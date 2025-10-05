import { featureFlagService, FeatureFlags } from "./feature-flags.js";
import { db } from "../db.js";
import { steps } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import type { Flow, Run } from "../../shared/schema.js";

export type ExecutionEngine = 'legacy' | 'langgraph';

export interface EngineSelectionResult {
  engine: ExecutionEngine;
  reason: string;
  metadata?: Record<string, any>;
}

export class EngineSelector {
  async selectEngine(flow: Flow, projectId: string): Promise<EngineSelectionResult> {
    // Check if LangGraph is enabled for this project
    const langGraphEnabled = await featureFlagService.isEnabled(
      FeatureFlags.LANGGRAPH_ENGINE,
      projectId
    );

    if (!langGraphEnabled) {
      return {
        engine: 'legacy',
        reason: 'LangGraph engine not enabled for this project',
      };
    }

    // Check if parallel execution is requested (requires LangGraph)
    const parallelEnabled = await featureFlagService.isEnabled(
      FeatureFlags.PARALLEL_EXECUTION,
      projectId
    );

    if (parallelEnabled) {
      return {
        engine: 'langgraph',
        reason: 'Parallel execution enabled, requires LangGraph',
        metadata: { parallelExecution: true },
      };
    }

    // Check flow complexity - use LangGraph for complex flows
    const flowSteps = await db
      .select()
      .from(steps)
      .where(eq(steps.flowId, flow.id));
      
    if (flowSteps.length > 10) {
      return {
        engine: 'langgraph',
        reason: 'Complex flow with >10 steps, using LangGraph for better performance',
        metadata: { stepCount: flowSteps.length },
      };
    }

    // Default to LangGraph if enabled
    return {
      engine: 'langgraph',
      reason: 'LangGraph enabled as default engine',
    };
  }

  async shouldShadowRun(projectId: string): Promise<boolean> {
    // Shadow run: execute with both engines for comparison during migration
    // This is controlled by a special feature flag or gradual rollout
    const langGraphRollout = await featureFlagService.isEnabled(
      FeatureFlags.LANGGRAPH_ENGINE,
      projectId
    );

    // During rollout, we might want to run both engines
    // For now, return false to avoid double execution
    return false;
  }

  recordEngineSelection(runId: string, selection: EngineSelectionResult): void {
    // TODO: Log engine selection for analytics
    console.log(`[EngineSelector] Run ${runId}: ${selection.engine} - ${selection.reason}`);
  }
}

export const engineSelector = new EngineSelector();
