import { nanoid } from "nanoid";
import { createRegistry } from "./registry";
import { loadFlow, getFlowById } from "./flowLoader";
import { createRunLogger } from "./engine/log";
import type { FlowDef, RunOptions, RunResult } from "./engine/types";

// Simplified runFlow implementation for now (will be replaced with working LangGraph version)
async function runFlow(flow: FlowDef, registry: any, options: RunOptions): Promise<RunResult> {
  const startTime = Date.now();
  
  // For now, return a successful placeholder result
  return {
    runId: options.context?.runId || nanoid(),
    status: 'success',
    output: {
      message: `Flow "${flow.name}" executed successfully (placeholder implementation)`,
      steps: flow.steps.length,
      duration: Date.now() - startTime
    },
    steps: flow.steps.map(step => ({
      stepId: step.id,
      status: 'success' as const,
      output: { message: `Step ${step.name} completed` },
      duration: 100,
      retries: 0
    })),
    duration: Date.now() - startTime
  };
}

// LangGraph-based execution engine
export class LangGraphEngine {
  private registry = createRegistry();

  // Execute a flow by ID
  async executeFlowById(
    flowId: string,
    sessionId: string,
    input: any = {},
    projectId?: string
  ): Promise<RunResult> {
    const flow = await getFlowById(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    return this.executeFlow(flow, sessionId, input, projectId);
  }

  // Execute a flow by name (load from JSON)
  async executeFlowByName(
    flowName: string,
    sessionId: string,
    input: any = {},
    projectId?: string
  ): Promise<RunResult> {
    const flow = await loadFlow(flowName);
    return this.executeFlow(flow, sessionId, input, projectId);
  }

  // Execute a flow definition directly
  async executeFlow(
    flow: FlowDef,
    sessionId: string,
    input: any = {},
    projectId?: string
  ): Promise<RunResult> {
    const logger = createRunLogger(`demo-${nanoid()}`);
    
    logger.info(`Starting LangGraph execution: ${flow.name}`, {
      session: sessionId
    });

    const options: RunOptions = {
      sessionId,
      input,
      context: {
        projectId
      }
    };

    try {
      const result = await runFlow(flow, this.registry, options);
      
      logger.info(`LangGraph execution completed: ${flow.name}`, {
        session: sessionId
      });

      return result;
    } catch (error) {
      logger.error(`LangGraph execution failed: ${flow.name}`, {
        session: sessionId
      }, { error: (error as Error).message });

      throw error;
    }
  }

  // Test the meeting actions flow with sample data
  async testMeetingActionsFlow(): Promise<RunResult> {
    const sampleInput = {
      transcript: `
Meeting Transcript - Product Planning Session
Date: September 23, 2025

John: Alright everyone, let's start our product planning session. We need to discuss the Q4 roadmap.

Sarah: I've been analyzing user feedback, and there are three main areas we need to focus on. First, performance improvements - users are complaining about slow load times.

Mike: I can handle the performance optimization. I think we can reduce load times by at least 40% by implementing lazy loading and optimizing our API calls.

John: Great. Mike, can you have a proposal ready by next Friday?

Mike: Yes, I'll put together a detailed plan.

Sarah: Second issue is the mobile experience. We're getting lots of complaints about the mobile interface being difficult to use.

Lisa: I can redesign the mobile UI. I've been working on some prototypes already.

John: Perfect. Lisa, when can you show us the prototypes?

Lisa: I can present them in our next meeting on Monday.

Sarah: The third issue is integration with third-party tools. Users want better Slack and Notion integration.

John: That's a bigger project. We should probably plan that for Q1 next year.

Mike: Actually, I think we could start with basic Slack notifications. That wouldn't be too complex.

John: Good point. Mike, add that to your proposal as well.

Sarah: One more thing - we need to update our user documentation. It's really outdated.

Lisa: I can work on that too. Documentation is important for user onboarding.

John: Excellent. So to summarize: Mike will work on performance and basic Slack integration, Lisa will handle mobile UI and documentation. Let's reconvene on Monday to review progress.

Meeting ended.
      `,
      export: "notion"
    };

    return this.executeFlowByName('meeting-actions', 'test-session', sampleInput);
  }

  // Get registry (for debugging/inspection)
  getRegistry() {
    return this.registry;
  }
}

// Default engine instance
export const langGraphEngine = new LangGraphEngine();