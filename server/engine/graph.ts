import { StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import type { FlowDef, StepNode, Registry, LangGraphState, Context, StepResult } from "./types";
import { ExecutionLogger } from "./log";
import { executeAgent } from "../agents/base";
import { executeTool } from "../tools/base";

// Build LangGraph from flow definition
export function buildGraph(flow: FlowDef, registry: Registry): StateGraph<LangGraphState> {
  // Create initial state
  const initialState: LangGraphState = {
    context: { sessionId: '', runId: '' },
    currentStep: 0,
    steps: [],
    results: [],
    completed: false
  };

  const graph = new StateGraph<LangGraphState>({});

  // Add start node
  graph.addNode("start", async (state: LangGraphState) => {
    const logger = new ExecutionLogger(state.context.runId);
    logger.info(`Starting flow execution: ${flow.name}`, { 
      session: state.context.sessionId 
    });

    return {
      ...state,
      steps: flow.steps,
      currentStep: 0,
      results: []
    };
  });

  // Add step nodes
  for (const step of flow.steps) {
    const nodeId = `step_${step.idx}`;
    
    graph.addNode(nodeId, async (state: LangGraphState) => {
      const logger = new ExecutionLogger(state.context.runId);
      const startTime = Date.now();
      
      try {
        // Check if step should be skipped due to condition
        if (step.condition && !evaluateCondition(step.condition, state.context)) {
          logger.info(`Skipping step ${step.idx}: condition not met`, {
            session: state.context.sessionId,
            step: step.idx.toString()
          });
          
          const result: StepResult = {
            stepId: step.id,
            status: 'skipped',
            duration: Date.now() - startTime,
            retries: 0
          };

          return {
            ...state,
            currentStep: step.idx + 1,
            results: [...state.results, result]
          };
        }

        logger.stepStart(step.id, step.name, {
          session: state.context.sessionId
        });

        // Map inputs from context
        const mappedInputs = mapInputs(step.in || {}, state.context);
        
        let stepOutput: any;
        let retries = 0;
        const maxRetries = step.policy?.maxRetries || flow.policy?.maxRetries || 2;
        
        // Execute step with retries
        while (retries <= maxRetries) {
          try {
            if (step.kind === 'agent') {
              const agentDef = registry.agents.get(step.name);
              if (!agentDef) {
                throw new Error(`Agent not found: ${step.name}`);
              }
              stepOutput = await executeAgent(agentDef, mappedInputs, state.context, logger);
            } else if (step.kind === 'tool') {
              const toolDef = registry.tools.get(step.name);
              if (!toolDef) {
                throw new Error(`Tool not found: ${step.name}`);
              }
              stepOutput = await executeTool(toolDef, { ...mappedInputs, ...step.args }, state.context, logger);
            }
            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries <= maxRetries) {
              logger.stepRetry(step.id, retries, (error as Error).message, {
                session: state.context.sessionId
              });
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            } else {
              throw error;
            }
          }
        }

        // Map outputs to context
        const updatedContext = mapOutputs(step.out || {}, stepOutput, state.context);
        
        const duration = Date.now() - startTime;
        logger.stepComplete(step.id, step.name, duration, {
          session: state.context.sessionId
        });

        const result: StepResult = {
          stepId: step.id,
          status: 'success',
          output: stepOutput,
          duration,
          retries
        };

        return {
          ...state,
          context: updatedContext,
          currentStep: step.idx + 1,
          results: [...state.results, result]
        };

      } catch (error) {
        const duration = Date.now() - startTime;
        logger.stepError(step.id, step.name, (error as Error).message, {
          session: state.context.sessionId
        });

        const result: StepResult = {
          stepId: step.id,
          status: 'error',
          error: (error as Error).message,
          duration,
          retries: 0
        };

        return {
          ...state,
          currentStep: step.idx + 1,
          results: [...state.results, result],
          error: (error as Error).message
        };
      }
    });
  }

  // Add end node
  graph.addNode("end", async (state: LangGraphState) => {
    const logger = new ExecutionLogger(state.context.runId);
    logger.info(`Flow execution completed: ${flow.name}`, {
      session: state.context.sessionId
    });

    return {
      ...state,
      completed: true
    };
  });

  // Connect steps sequentially
  if (flow.steps.length > 0) {
    graph.addEdge("start", `step_${flow.steps[0].idx}`);
    
    for (let i = 0; i < flow.steps.length; i++) {
      const currentStep = flow.steps[i];
      const nextStep = flow.steps[i + 1];
      
      if (nextStep) {
        graph.addEdge(`step_${currentStep.idx}`, `step_${nextStep.idx}`);
      } else {
        graph.addEdge(`step_${currentStep.idx}`, "end");
      }
    }
  } else {
    graph.addEdge("start", "end");
  }

  return graph;
}

// Evaluate step condition against context
function evaluateCondition(condition: string, context: Context): boolean {
  try {
    // Simple condition evaluation for now
    // Format: "$.export == 'notion'" or "$.field != null"
    const match = condition.match(/\$\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
    if (!match) return true;

    const [, field, operator, value] = match;
    const contextValue = context[field];
    let expectedValue: any = value;

    // Parse expected value
    if (value === 'null') expectedValue = null;
    else if (value === 'true') expectedValue = true;
    else if (value === 'false') expectedValue = false;
    else if (value.startsWith("'") && value.endsWith("'")) {
      expectedValue = value.slice(1, -1);
    } else if (!isNaN(Number(value))) {
      expectedValue = Number(value);
    }

    switch (operator) {
      case '==': return contextValue === expectedValue;
      case '!=': return contextValue !== expectedValue;
      case '>': return contextValue > expectedValue;
      case '<': return contextValue < expectedValue;
      case '>=': return contextValue >= expectedValue;
      case '<=': return contextValue <= expectedValue;
      default: return true;
    }
  } catch (error) {
    console.warn(`Condition evaluation failed: ${condition}`, error);
    return true; // Default to executing step if condition fails
  }
}

// Map inputs from context using JSONPath-like syntax
function mapInputs(inputMapping: Record<string, string>, context: Context): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  for (const [key, path] of Object.entries(inputMapping)) {
    if (path.startsWith('$.')) {
      const fieldName = path.substring(2);
      mapped[key] = context[fieldName];
    } else {
      mapped[key] = path; // Literal value
    }
  }
  
  return mapped;
}

// Map outputs to context
function mapOutputs(
  outputMapping: Record<string, string>, 
  stepOutput: any, 
  currentContext: Context
): Context {
  const updatedContext = { ...currentContext };
  
  for (const [outputKey, contextPath] of Object.entries(outputMapping)) {
    if (contextPath.startsWith('$.')) {
      const fieldName = contextPath.substring(2);
      if (stepOutput && typeof stepOutput === 'object' && outputKey in stepOutput) {
        updatedContext[fieldName] = stepOutput[outputKey];
      }
    }
  }
  
  // Also store the full output with step name prefix for backward compatibility
  if (stepOutput && typeof stepOutput === 'object') {
    Object.keys(stepOutput).forEach(key => {
      updatedContext[key] = stepOutput[key];
    });
  }
  
  return updatedContext;
}