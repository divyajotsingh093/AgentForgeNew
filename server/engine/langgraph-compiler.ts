import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { db } from "../db.js";
import { steps, agents, tools } from "../../shared/schema.js";
import { eq, asc } from "drizzle-orm";
import type { Flow, Step } from "../../shared/schema.js";

export interface WorkflowState {
  flowId: string;
  runId: string;
  context: Record<string, any>;
  stepResults: Record<string, any>;
  errors: Array<{ stepId: string; error: string }>;
  currentStepIndex: number;
  joinBarriers: Record<string, { completed: string[]; fired: boolean }>;
}

const WorkflowStateAnnotation = Annotation.Root({
  flowId: Annotation<string>,
  runId: Annotation<string>,
  context: Annotation<Record<string, any>>,
  stepResults: Annotation<Record<string, any>>,
  errors: Annotation<Array<{ stepId: string; error: string }>>,
  currentStepIndex: Annotation<number>,
  joinBarriers: Annotation<Record<string, { completed: string[]; fired: boolean }>>,
});

export interface CompiledGraph {
  graph: StateGraph<typeof WorkflowStateAnnotation.State>;
  compiled: any;
  metadata: {
    flowId: string;
    stepCount: number;
    hasParallel: boolean;
    hasConditional: boolean;
    joinNodes: string[];
  };
}

export class LangGraphCompiler {
  private joinNodes: string[] = [];

  async compileFlow(flow: Flow): Promise<CompiledGraph> {
    this.joinNodes = []; // Reset for each compilation
    const flowSteps = await this.loadSteps(flow.id);
    
    if (flowSteps.length === 0) {
      throw new Error(`Flow ${flow.id} has no steps to compile`);
    }

    const graph = new StateGraph(WorkflowStateAnnotation);
    
    // Add nodes for each step
    for (const step of flowSteps) {
      const nodeFunc = await this.createNodeFunction(step);
      graph.addNode(step.id, nodeFunc);
    }

    // Analyze dependencies and build edges
    const { hasParallel, hasConditional, groups } = this.analyzeAndGroupSteps(flowSteps);

    // Build intra-group and inter-group edges
    this.buildGraphEdges(graph, groups, hasConditional);

    // Connect START to initial step(s)
    // Only connect to the actual entry points (first step of each parallel group, or first step if sequential)
    const initialSteps = groups[0];
    if (this.isSequentialGroup(initialSteps)) {
      // Sequential: only connect to first step
      (graph as any).addEdge(START, initialSteps[0].id);
    } else {
      // Parallel: connect to all steps in first group
      for (const step of initialSteps) {
        (graph as any).addEdge(START, step.id);
      }
    }

    // Connect final step(s) to END
    const finalSteps = groups[groups.length - 1];
    if (this.isSequentialGroup(finalSteps)) {
      // Sequential: only last step connects to END
      (graph as any).addEdge(finalSteps[finalSteps.length - 1].id, END);
    } else {
      // Parallel: all steps connect to END
      for (const step of finalSteps) {
        (graph as any).addEdge(step.id, END);
      }
    }

    const compiled = graph.compile();

    return {
      graph,
      compiled,
      metadata: {
        flowId: flow.id,
        stepCount: flowSteps.length,
        hasParallel,
        hasConditional,
        joinNodes: this.joinNodes,
      },
    };
  }

  private async loadSteps(flowId: string): Promise<Step[]> {
    return await db
      .select()
      .from(steps)
      .where(eq(steps.flowId, flowId))
      .orderBy(asc(steps.idx));
  }

  private async createNodeFunction(step: Step) {
    return async (state: typeof WorkflowStateAnnotation.State) => {
      try {
        console.log(`[LangGraph] Executing step ${step.kind}: ${step.id}`);
        
        // Load step's agent or tool
        let result: any = null;

        if (step.kind === 'agent') {
          result = await this.executeAgent(step, state);
        } else if (step.kind === 'tool') {
          result = await this.executeTool(step, state);
        } else {
          throw new Error(`Step ${step.id} has unknown kind: ${step.kind}`);
        }

        // Update state with step result
        return {
          ...state,
          stepResults: {
            ...state.stepResults,
            [step.id]: result,
          },
          context: {
            ...state.context,
            lastStepResult: result,
          },
          currentStepIndex: state.currentStepIndex + 1,
        };
      } catch (error: any) {
        console.error(`[LangGraph] Step ${step.id} failed:`, error.message);
        
        return {
          ...state,
          errors: [
            ...state.errors,
            { stepId: step.id, error: error.message },
          ],
        };
      }
    };
  }

  private async executeAgent(step: Step, state: typeof WorkflowStateAnnotation.State): Promise<any> {
    // TODO: Integrate with actual agent execution
    // For now, return mock execution
    console.log(`[LangGraph] Agent execution for step ${step.id}`);
    
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, step.refId))
      .limit(1);

    if (agent.length === 0) {
      throw new Error(`Agent ${step.refId} not found`);
    }

    return {
      stepId: step.id,
      agentId: step.refId,
      output: `Agent ${agent[0].name} executed successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeTool(step: Step, state: typeof WorkflowStateAnnotation.State): Promise<any> {
    // TODO: Integrate with actual tool execution
    // For now, return mock execution
    console.log(`[LangGraph] Tool execution for step ${step.id}`);
    
    const tool = await db
      .select()
      .from(tools)
      .where(eq(tools.id, step.refId))
      .limit(1);

    if (tool.length === 0) {
      throw new Error(`Tool ${step.refId} not found`);
    }

    return {
      stepId: step.id,
      toolId: step.refId,
      output: `Tool ${tool[0].name} executed successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  private analyzeAndGroupSteps(steps: Step[]): {
    hasParallel: boolean;
    hasConditional: boolean;
    groups: Step[][];
  } {
    // Group steps by execution mode for proper edge building
    const groups: Step[][] = [];
    let currentGroup: Step[] = [];
    let currentMode: 'sequential' | 'parallel' | 'conditional' | null = null;
    let hasParallel = false;
    let hasConditional = false;

    for (const step of steps) {
      const config = step.config as any;
      
      // Determine step execution mode
      let stepMode: 'sequential' | 'parallel' | 'conditional';
      if (config?.conditional || config?.branches) {
        stepMode = 'conditional';
        hasConditional = true;
      } else if (config?.execution === 'parallel') {
        stepMode = 'parallel';
        hasParallel = true;
      } else {
        stepMode = 'sequential';
      }

      // Flush current group when mode changes
      if (currentMode !== null && currentMode !== stepMode) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }

      // Conditional steps always get their own group
      if (stepMode === 'conditional') {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
        groups.push([step]);
        currentMode = null; // Reset mode after conditional
      } else {
        currentGroup.push(step);
        currentMode = stepMode;
      }
    }

    // Flush remaining group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // If no groups, create single group
    if (groups.length === 0 && steps.length > 0) {
      groups.push(steps);
    }

    return { hasParallel, hasConditional, groups };
  }

  private buildGraphEdges(
    graph: StateGraph<typeof WorkflowStateAnnotation.State>,
    groups: Step[][],
    hasConditional: boolean
  ): void {
    // First, build intra-group edges for sequential groups
    for (const group of groups) {
      if (this.isSequentialGroup(group)) {
        // Create chain of edges within sequential group
        for (let i = 0; i < group.length - 1; i++) {
          (graph as any).addEdge(group[i].id, group[i + 1].id);
        }
      }
    }

    // Then, build inter-group edges
    for (let i = 0; i < groups.length - 1; i++) {
      const currentGroup = groups[i];
      const nextGroup = groups[i + 1];

      // Check if current group has conditional branching
      const currentConfig = currentGroup[0].config as any;
      const currentIsConditional = currentGroup.length === 1 && 
        (currentConfig?.conditional || currentConfig?.branches);

      if (currentIsConditional) {
        // Add conditional edge with routing function
        this.addConditionalEdge(graph, currentGroup[0], nextGroup);
      } else {
        // Determine connection pattern based on group types
        const currentIsSeq = this.isSequentialGroup(currentGroup);
        const nextIsSeq = this.isSequentialGroup(nextGroup);

        if (currentIsSeq && nextIsSeq) {
          // Sequential to sequential: connect last of current to first of next
          (graph as any).addEdge(
            currentGroup[currentGroup.length - 1].id,
            nextGroup[0].id
          );
        } else if (currentIsSeq && !nextIsSeq) {
          // Sequential to parallel: fan-out from last of current to all of next
          for (const nextStep of nextGroup) {
            (graph as any).addEdge(
              currentGroup[currentGroup.length - 1].id,
              nextStep.id
            );
          }
        } else if (!currentIsSeq && nextIsSeq) {
          // Parallel to sequential: need explicit join node
          const joinNodeId = this.createJoinNode(graph, currentGroup, nextGroup[0]);
          this.joinNodes.push(joinNodeId);
        } else {
          // Parallel to parallel: need explicit join node
          const joinNodeId = this.createJoinNode(graph, currentGroup, nextGroup);
          this.joinNodes.push(joinNodeId);
        }
      }
    }
  }

  private isSequentialGroup(group: Step[]): boolean {
    // A group is sequential if all steps have sequential execution mode
    // (i.e., not marked as parallel)
    return group.every(step => {
      const config = step.config as any;
      return config?.execution !== 'parallel';
    });
  }

  private createJoinNode(
    graph: StateGraph<typeof WorkflowStateAnnotation.State>,
    parallelSteps: Step[],
    nextSteps: Step | Step[]
  ): string {
    const joinNodeId = `join_${parallelSteps.map(s => s.id.slice(0, 8)).join('_')}`;
    const nextStepsArray = Array.isArray(nextSteps) ? nextSteps : [nextSteps];
    const expectedStepIds = parallelSteps.map(s => s.id);
    const expectedCount = expectedStepIds.length;

    // Create join node with barrier semantics
    const joinFunc = async (state: typeof WorkflowStateAnnotation.State) => {
      // Initialize barrier tracking if not present
      const barriers = state.joinBarriers || {};
      const barrier = barriers[joinNodeId] || { completed: [], fired: false };

      // If barrier already fired, skip (prevent re-entry)
      if (barrier.fired) {
        console.log(`[LangGraph] Join node ${joinNodeId} already fired, skipping`);
        return state;
      }

      // Track which step triggered this invocation
      const completedSteps = new Set(barrier.completed);
      for (const stepId of expectedStepIds) {
        if (state.stepResults[stepId] && !completedSteps.has(stepId)) {
          completedSteps.add(stepId);
        }
      }

      const completedCount = completedSteps.size;
      console.log(`[LangGraph] Join node ${joinNodeId}: ${completedCount}/${expectedCount} branches completed`);

      // If not all branches complete, update barrier state and wait
      if (completedCount < expectedCount) {
        return {
          ...state,
          joinBarriers: {
            ...barriers,
            [joinNodeId]: {
              completed: Array.from(completedSteps),
              fired: false,
            },
          },
        };
      }

      // All branches complete - fire barrier and aggregate results
      console.log(`[LangGraph] Join node ${joinNodeId} barrier met - forwarding control`);
      
      const aggregatedResults: Record<string, any> = {};
      for (const stepId of expectedStepIds) {
        if (state.stepResults[stepId]) {
          aggregatedResults[stepId] = state.stepResults[stepId];
        }
      }

      return {
        ...state,
        joinBarriers: {
          ...barriers,
          [joinNodeId]: {
            completed: Array.from(completedSteps),
            fired: true,
          },
        },
        context: {
          ...state.context,
          joinResults: aggregatedResults,
        },
        stepResults: {
          ...state.stepResults,
          [joinNodeId]: {
            type: 'join',
            aggregated: aggregatedResults,
            timestamp: new Date().toISOString(),
          },
        },
      };
    };

    graph.addNode(joinNodeId, joinFunc);

    // Connect all parallel steps to join node
    for (const step of parallelSteps) {
      (graph as any).addEdge(step.id, joinNodeId);
    }

    // Connect join node to next steps
    if (nextStepsArray.length === 1) {
      (graph as any).addEdge(joinNodeId, nextStepsArray[0].id);
    } else {
      // Fan out to multiple next steps
      for (const nextStep of nextStepsArray) {
        (graph as any).addEdge(joinNodeId, nextStep.id);
      }
    }

    return joinNodeId;
  }

  private addConditionalEdge(
    graph: StateGraph<typeof WorkflowStateAnnotation.State>,
    conditionalStep: Step,
    nextSteps: Step[]
  ): void {
    // Build routing function based on step config
    const config = conditionalStep.config as any;
    const branches = config?.branches || {};

    const routingFunc = (state: typeof WorkflowStateAnnotation.State): string => {
      // Evaluate condition based on last step result
      const lastResult = state.stepResults[conditionalStep.id];
      
      // Simple routing: check result value against branch conditions
      for (const [branchName, condition] of Object.entries(branches)) {
        const conditionConfig = condition as any;
        
        if (conditionConfig.when && this.evaluateCondition(lastResult, conditionConfig.when)) {
          // Find matching next step by name or first step
          const targetStep = nextSteps.find(s => s.id === conditionConfig.target) || nextSteps[0];
          return targetStep.id;
        }
      }

      // Default: route to first next step
      return nextSteps[0].id;
    };

    // Create path mapping for all possible targets
    const pathMap: Record<string, string> = {};
    for (const step of nextSteps) {
      pathMap[step.id] = step.id;
    }

    // Add conditional edge
    (graph as any).addConditionalEdges(
      conditionalStep.id,
      routingFunc,
      pathMap
    );
  }

  private evaluateCondition(value: any, condition: any): boolean {
    // Simple condition evaluation
    if (typeof condition === 'string') {
      return value === condition;
    }
    
    if (condition.equals !== undefined) {
      return value === condition.equals;
    }
    
    if (condition.contains !== undefined) {
      return String(value).includes(condition.contains);
    }
    
    return false;
  }
}

export const langGraphCompiler = new LangGraphCompiler();
