import { generateAgentResponse } from "../openaiClient";
import type { AgentDef, Context } from "../engine/types";
import type { ExecutionLogger } from "../engine/log";
import { z } from "zod";

// Execute an agent with the given inputs
export async function executeAgent(
  agentDef: AgentDef,
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  logger.agentStart(agentDef.name, {
    session: context.sessionId
  });

  try {
    // Build user message from template and inputs
    let userMessage = agentDef.userTemplate || "";
    
    // Replace template variables
    Object.keys(inputs).forEach(key => {
      const value = inputs[key];
      userMessage = userMessage.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });

    // Add context variables
    Object.keys(context).forEach(key => {
      const value = context[key];
      if (typeof value === 'string' || typeof value === 'number') {
        userMessage = userMessage.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
      }
    });

    // Generate response
    const response = await generateAgentResponse(
      agentDef.systemPrompt,
      userMessage,
      context
    );

    // Parse structured output if schema is provided
    let structuredOutput = {};
    if (agentDef.outputSchema) {
      try {
        structuredOutput = parseAgentOutput(response, agentDef.outputSchema);
        logger.info(`Successfully parsed structured output for agent: ${agentDef.name}`, {
          session: context.sessionId,
          agent: agentDef.name
        });
      } catch (error) {
        logger.warn(`Failed to parse structured output for agent ${agentDef.name}: ${(error as Error).message}`, {
          session: context.sessionId,
          agent: agentDef.name
        });
        // Continue with text output
      }
    }

    logger.agentComplete(agentDef.name, {
      session: context.sessionId
    });

    return {
      response,
      ...structuredOutput
    };

  } catch (error) {
    logger.agentError(agentDef.name, (error as Error).message, {
      session: context.sessionId
    });
    throw error;
  }
}

// Parse structured output from agent response
function parseAgentOutput(response: string, schema: z.ZodSchema): any {
  // Extract JSON blocks from response
  const jsonMatches = response.match(/```json\s*(\{[\s\S]*?\})\s*```/g);
  
  if (!jsonMatches || jsonMatches.length === 0) {
    throw new Error("No JSON output found in agent response");
  }

  // Get the last JSON block
  const lastJsonMatch = jsonMatches[jsonMatches.length - 1];
  const jsonContent = lastJsonMatch.match(/```json\s*(\{[\s\S]*?\})\s*```/)?.[1];
  
  if (!jsonContent) {
    throw new Error("Could not extract JSON content");
  }

  // Parse and validate
  const parsed = JSON.parse(jsonContent);
  return schema.parse(parsed);
}