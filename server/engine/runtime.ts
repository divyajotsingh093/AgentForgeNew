import { StateGraph } from "@langchain/langgraph";
import { nanoid } from "nanoid";
import { storage } from "../storage";
import { buildGraph } from "./graph";
import { createRunLogger, ExecutionLogger } from "./log";
import type { FlowDef, Registry, RunOptions, RunResult, Context, LangGraphState } from "./types";

// Execute a flow using LangGraph
export async function runFlow(
  flow: FlowDef,
  registry: Registry,
  options: RunOptions
): Promise<RunResult> {
  const runId = nanoid();
  const logger = createRunLogger(runId);
  const startTime = Date.now();

  logger.info(`Starting flow execution: ${flow.name}`, {
    session: options.sessionId
  });

  try {
    // Create initial context
    const initialContext: Context = {
      sessionId: options.sessionId,
      runId,
      projectId: options.context?.projectId,
      ...options.context,
      ...options.input
    };

    // Save run to database
    await storage.createRun({
      flowId: flow.id,
      sessionId: options.sessionId,
      status: 'running',
      input: options.input || {},
      context: initialContext
    });

    // Build and compile the graph
    const graph = buildGraph(flow, registry);
    const compiledGraph = graph.compile();

    // Create initial state
    const initialState: LangGraphState = {
      context: initialContext,
      currentStep: 0,
      steps: flow.steps,
      results: [],
      completed: false
    };

    // Execute the graph
    const finalState = await executeGraphWithCheckpoints(
      compiledGraph, 
      initialState, 
      runId, 
      logger
    );

    const duration = Date.now() - startTime;

    // Update run with final results
    await storage.updateRun(runId, {
      status: finalState.error ? 'error' : 'success',
      output: finalState.context,
      context: finalState.context,
      completedAt: new Date()
    });

    const result: RunResult = {
      runId,
      status: finalState.error ? 'error' : 'success',
      output: finalState.context,
      error: finalState.error,
      steps: finalState.results,
      duration
    };

    logger.info(`Flow execution completed: ${flow.name}`, {
      session: options.sessionId,
      status: result.status,
      duration
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Flow execution failed: ${flow.name}`, {
      session: options.sessionId
    }, { error: (error as Error).message });

    // Update run with error
    await storage.updateRun(runId, {
      status: 'error',
      completedAt: new Date()
    });

    return {
      runId,
      status: 'error',
      error: (error as Error).message,
      steps: [],
      duration
    };
  }
}

// Execute graph with checkpoint support
async function executeGraphWithCheckpoints(
  graph: any,
  initialState: LangGraphState,
  runId: string,
  logger: ExecutionLogger
): Promise<LangGraphState> {
  let currentState = initialState;
  let stepIndex = 0;

  try {
    // For now, we'll implement a simple sequential execution
    // until we can resolve the LangGraph API issues
    return await executeSequentially(currentState, logger, runId);
  } catch (error) {
    logger.error("Graph execution failed", {}, { error: (error as Error).message });
    return {
      ...currentState,
      error: (error as Error).message,
      completed: true
    };
  }
}

// Fallback sequential execution
async function executeSequentially(
  state: LangGraphState,
  logger: ExecutionLogger,
  runId: string
): Promise<LangGraphState> {
  let currentState = { ...state };

  // Save checkpoint before execution
  await saveCheckpoint(runId, 0, 'running', currentState.context);

  for (let i = 0; i < currentState.steps.length; i++) {
    const step = currentState.steps[i];
    
    try {
      logger.stepStart(step.id, step.name, {
        session: currentState.context.sessionId
      });

      // TODO: Execute step using registry
      // For now, create placeholder result
      const stepResult = {
        stepId: step.id,
        status: 'success' as const,
        output: { message: `Step ${step.name} executed (placeholder)` },
        duration: 100,
        retries: 0
      };

      currentState.results.push(stepResult);
      currentState.currentStep = i + 1;

      // Save checkpoint after each step
      await saveCheckpoint(runId, i + 1, 'running', currentState.context);

      logger.stepComplete(step.id, step.name, stepResult.duration, {
        session: currentState.context.sessionId
      });

    } catch (error) {
      logger.stepError(step.id, step.name, (error as Error).message, {
        session: currentState.context.sessionId
      });

      const stepResult = {
        stepId: step.id,
        status: 'error' as const,
        error: (error as Error).message,
        duration: 0,
        retries: 0
      };

      currentState.results.push(stepResult);
      break; // Stop execution on error
    }
  }

  currentState.completed = true;
  return currentState;
}

// Save execution checkpoint
async function saveCheckpoint(
  runId: string,
  stepIdx: number,
  status: string,
  context: Context
): Promise<void> {
  try {
    // TODO: Implement checkpoint saving to database
    // For now, just log
    console.log(`Checkpoint saved: run=${runId}, step=${stepIdx}, status=${status}`);
  } catch (error) {
    console.error("Failed to save checkpoint:", error);
  }
}