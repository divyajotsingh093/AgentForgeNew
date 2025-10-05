import { langGraphCompiler, type WorkflowState, type CompiledGraph } from "./langgraph-compiler.js";
import { db } from "../db.js";
import { runs, logs, runCheckpoints } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import type { Flow } from "../../shared/schema.js";

export interface ExecutionOptions {
  initialContext?: Record<string, any>;
  checkpointId?: string;
  streamLogs?: boolean;
}

export interface ExecutionResult {
  runId: string;
  status: 'completed' | 'failed' | 'partial';
  finalState: WorkflowState;
  stepResults: Record<string, any>;
  errors: Array<{ stepId: string; error: string }>;
  checkpoints: string[];
  duration: number;
}

export class LangGraphRuntime {
  private graphCache: Map<string, CompiledGraph> = new Map();

  async executeFlow(flow: Flow, runId: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[LangGraphRuntime] Starting flow execution: ${flow.name} (${flow.id})`);
      
      // Compile or retrieve cached graph
      const compiledGraph = await this.getOrCompileGraph(flow);
      
      // Initialize state
      const initialState: WorkflowState = options.checkpointId
        ? await this.loadCheckpoint(options.checkpointId)
        : {
            flowId: flow.id,
            runId,
            context: options.initialContext || {},
            stepResults: {},
            errors: [],
            currentStepIndex: 0,
            joinBarriers: {},
          };

      // Log execution start
      await this.logExecution(runId, 'info', 'Flow execution started with LangGraph engine', {
        flowId: flow.id,
        engineType: 'langgraph',
        metadata: compiledGraph.metadata,
      });

      // Execute the graph
      const result = await compiledGraph.compiled.invoke(initialState);
      
      // Save final checkpoint
      const checkpointId = await this.saveCheckpoint(runId, result);

      const duration = Date.now() - startTime;

      // Determine final status
      const status = result.errors.length > 0 ? 'partial' : 'completed';

      // Log execution completion
      await this.logExecution(runId, status === 'completed' ? 'info' : 'warn', 
        `Flow execution ${status}`, {
        duration,
        stepCount: compiledGraph.metadata.stepCount,
        errorCount: result.errors.length,
      });

      // Update run status in database
      await db
        .update(runs)
        .set({
          status: status === 'completed' ? 'success' : 'error',
          completedAt: new Date(),
          output: result.stepResults,
        })
        .where(eq(runs.id, runId));

      return {
        runId,
        status,
        finalState: result,
        stepResults: result.stepResults,
        errors: result.errors,
        checkpoints: [checkpointId],
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.error(`[LangGraphRuntime] Flow execution failed:`, error);
      
      await this.logExecution(runId, 'error', 'Flow execution failed', {
        error: error.message,
        stack: error.stack,
        duration,
      });

      // Update run status
      await db
        .update(runs)
        .set({
          status: 'error',
          completedAt: new Date(),
        })
        .where(eq(runs.id, runId));

      throw error;
    }
  }

  private async getOrCompileGraph(flow: Flow): Promise<CompiledGraph> {
    const cacheKey = `${flow.id}-v${flow.version}`;
    
    if (this.graphCache.has(cacheKey)) {
      console.log(`[LangGraphRuntime] Using cached graph for flow ${flow.id}`);
      return this.graphCache.get(cacheKey)!;
    }

    console.log(`[LangGraphRuntime] Compiling graph for flow ${flow.id}`);
    const compiled = await langGraphCompiler.compileFlow(flow);
    
    this.graphCache.set(cacheKey, compiled);
    
    // Limit cache size
    if (this.graphCache.size > 100) {
      const firstKey = this.graphCache.keys().next().value;
      if (firstKey) {
        this.graphCache.delete(firstKey);
      }
    }

    return compiled;
  }

  private async saveCheckpoint(runId: string, state: WorkflowState): Promise<string> {
    const checkpoint = await db
      .insert(runCheckpoints)
      .values({
        runId,
        stepIdx: state.currentStepIndex,
        status: state.errors.length > 0 ? 'error' : 'success',
        contextJson: state,
      })
      .returning();

    return checkpoint[0].id;
  }

  private async loadCheckpoint(checkpointId: string): Promise<WorkflowState> {
    const checkpoint = await db
      .select()
      .from(runCheckpoints)
      .where(eq(runCheckpoints.id, checkpointId))
      .limit(1);

    if (checkpoint.length === 0) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    return checkpoint[0].contextJson as WorkflowState;
  }

  private async logExecution(
    runId: string,
    level: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await db.insert(logs).values({
      runId,
      level,
      message,
      tags: {},
      payload: metadata,
    });
  }

  clearCache(): void {
    this.graphCache.clear();
  }

  async replayFromCheckpoint(checkpointId: string): Promise<ExecutionResult> {
    const checkpoint = await db
      .select()
      .from(runCheckpoints)
      .where(eq(runCheckpoints.id, checkpointId))
      .limit(1);

    if (checkpoint.length === 0) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const run = await db
      .select()
      .from(runs)
      .where(eq(runs.id, checkpoint[0].runId))
      .limit(1);

    if (run.length === 0) {
      throw new Error(`Run ${checkpoint[0].runId} not found`);
    }

    // TODO: Fetch flow from run and execute from checkpoint
    throw new Error('Checkpoint replay not yet implemented');
  }
}

export const langGraphRuntime = new LangGraphRuntime();
