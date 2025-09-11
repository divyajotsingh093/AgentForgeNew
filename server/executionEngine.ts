import { storage } from "./storage";
import { generateAgentResponse } from "./openaiClient";
import { createNotionTasks } from "./notionClient";
import type { Run, Step, Agent, Tool } from "@shared/schema";
import { z } from "zod";

class ExecutionEngine {
  private activeRuns = new Map<string, any>();

  async executeFlow(runId: string) {
    try {
      const run = await storage.getRun(runId);
      if (!run) {
        throw new Error("Run not found");
      }

      await this.updateRunStatus(runId, 'running');
      await this.logMessage(runId, 'info', { session: run.sessionId }, `Starting flow execution`);

      const flow = await storage.getFlow(run.flowId);
      if (!flow) {
        throw new Error("Flow not found");
      }

      const steps = await storage.getSteps(run.flowId);
      let context = run.context || {};

      // Execute steps sequentially
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await this.logMessage(runId, 'info', { 
          session: run.sessionId, 
          step: step.idx.toString() 
        }, `Starting step ${step.idx}: ${step.kind}`);

        try {
          if (step.kind === 'agent') {
            context = await this.executeAgentStepWithRetry(runId, run.sessionId, step, context);
            
            // Check if agent requested a tool call via structured output
            const agent = await storage.getAgent(step.refId);
            const toolCallKey = `${agent?.name}_tool_call`;
            
            if (context[toolCallKey] && typeof context[toolCallKey] === 'object') {
              await this.logMessage(runId, 'info', { 
                session: run.sessionId, 
                agent: agent?.name,
                step: step.idx.toString() 
              }, `Auto-executing tool call requested by agent: ${agent?.name}`);
              
              context = await this.autoExecuteToolCall(runId, run.sessionId, context[toolCallKey], context, step.idx);
            }
          } else if (step.kind === 'tool') {
            context = await this.executeToolStep(runId, run.sessionId, step, context);
          }
        } catch (error) {
          await this.logMessage(runId, 'error', { 
            session: run.sessionId, 
            step: step.idx.toString() 
          }, `Step failed: ${(error as Error).message}`);
          
          // Attempt retry with simplified payload
          try {
            await this.logMessage(runId, 'info', { 
              session: run.sessionId, 
              step: step.idx.toString() 
            }, `Retrying step with simplified payload`);
            
            if (step.kind === 'tool') {
              context = await this.executeToolStep(runId, run.sessionId, step, context, true);
            } else {
              throw error; // Don't retry agent steps
            }
          } catch (retryError) {
            await this.logMessage(runId, 'error', { 
              session: run.sessionId, 
              step: step.idx.toString() 
            }, `Step retry failed: ${(retryError as Error).message}`);
            
            // Continue with text-only result
            (context as any)[`step_${step.idx}_error`] = (error as Error).message;
          }
        }
      }

      await this.updateRunStatus(runId, 'success', context);
      await this.logMessage(runId, 'info', { session: run.sessionId }, `Flow execution completed successfully`);
      
    } catch (error) {
      await this.updateRunStatus(runId, 'error');
      await this.logMessage(runId, 'error', {}, `Flow execution failed: ${(error as Error).message}`);
    }
  }

  private async executeAgentStepWithRetry(runId: string, sessionId: string, step: Step, context: any): Promise<any> {
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await this.executeAgentStep(runId, sessionId, step, context);
        
        // Check if we got structured output - if not on first attempt, retry
        const agent = await storage.getAgent(step.refId);
        if (agent?.outputSchema && attempt === 1) {
          const hasStructuredFields = Object.keys(agent.outputSchema.properties || {}).some(
            field => result.hasOwnProperty(field)
          );
          
          if (!hasStructuredFields) {
            await this.logMessage(runId, 'warn', {
              session: sessionId,
              agent: agent.name,
              attempt: attempt.toString()
            }, `No structured output detected on attempt ${attempt}, retrying with enhanced prompt`);
            
            // Add retry instruction to context for next attempt
            context._retry_instruction = "CRITICAL: Your previous response did not end with a properly formatted JSON block. You MUST end your response with a JSON code block that matches your outputSchema exactly.";
            continue;
          }
        }
        
        // Remove retry instruction on success
        delete context._retry_instruction;
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        await this.logMessage(runId, 'warn', {
          session: sessionId,
          step: step.idx.toString(),
          attempt: attempt.toString()
        }, `Agent step attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt > maxRetries) {
          break;
        }
        
        // Add retry context for next attempt
        context._retry_instruction = `CRITICAL: Previous attempt failed with error: ${lastError.message}. Ensure your response ends with a properly formatted JSON block that matches your outputSchema.`;
      }
    }
    
    // If all attempts failed, log final error and continue with basic context
    await this.logMessage(runId, 'error', {
      session: sessionId,
      step: step.idx.toString()
    }, `All retry attempts failed. Final error: ${lastError?.message}. Continuing with text-only output.`);
    
    // Remove retry instruction
    delete context._retry_instruction;
    
    // Return the result from the last attempt even if parsing failed
    return await this.executeAgentStep(runId, sessionId, step, context);
  }

  private async executeAgentStep(runId: string, sessionId: string, step: Step, context: any): Promise<any> {
    const agent = await storage.getAgent(step.refId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      agent: agent.name,
      step: step.idx.toString() 
    }, `Executing agent: ${agent.name}`);

    // Replace variables in user template
    let userMessage = agent.userTemplate || "";
    Object.keys(context).forEach(key => {
      userMessage = userMessage.replace(new RegExp(`{{${key}}}`, 'g'), context[key] || '');
    });

    // Add retry instruction if present
    if (context._retry_instruction) {
      userMessage = `${context._retry_instruction}\n\n${userMessage}`;
    }

    const response = await generateAgentResponse(agent.systemPrompt, userMessage, context);
    
    // Store the full response for debugging
    context[`${agent.name}_output`] = response;
    
    // Parse structured JSON output from agent response
    await this.parseAgentStructuredOutput(runId, sessionId, agent, response, context);
    
    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      agent: agent.name,
      step: step.idx.toString() 
    }, `Agent completed: ${agent.name}`);

    return context;
  }

  private async parseAgentStructuredOutput(
    runId: string,
    sessionId: string,
    agent: Agent,
    response: string,
    context: any
  ): Promise<void> {
    try {
      // Extract the final JSON block from the response (agents should end with structured output)
      const jsonMatches = response.match(/```json\s*(\{[\s\S]*?\})\s*```/g);
      
      if (!jsonMatches || jsonMatches.length === 0) {
        await this.logMessage(runId, 'warn', {
          session: sessionId,
          agent: agent.name
        }, `No JSON output found from agent ${agent.name}, using text-only output`);
        return;
      }

      // Get the last JSON block (structured output should be at the end)
      const lastJsonMatch = jsonMatches[jsonMatches.length - 1];
      const jsonContent = lastJsonMatch.match(/```json\s*(\{[\s\S]*?\})\s*```/)?.[1];
      
      if (!jsonContent) {
        throw new Error("Could not extract JSON content from final block");
      }

      // Parse the JSON
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(jsonContent);
      } catch (parseError) {
        throw new Error(`JSON parsing failed: ${(parseError as Error).message}`);
      }

      // Validate against agent's outputSchema if available
      if (agent.outputSchema) {
        try {
          const zodSchema = this.jsonSchemaToZod(agent.outputSchema);
          const validatedOutput = zodSchema.parse(parsedOutput);
          parsedOutput = validatedOutput;
          
          await this.logMessage(runId, 'info', {
            session: sessionId,
            agent: agent.name
          }, `Successfully validated structured output against schema`);
        } catch (validationError) {
          await this.logMessage(runId, 'warn', {
            session: sessionId,
            agent: agent.name
          }, `Schema validation failed: ${(validationError as Error).message}, using unvalidated output`);
        }
      }

      // Store structured fields in context for downstream templating
      if (typeof parsedOutput === 'object' && parsedOutput !== null) {
        Object.keys(parsedOutput).forEach(key => {
          context[key] = parsedOutput[key];
          
          // Note: Debug log removed from forEach to avoid async issues
          // We'll log the summary after the loop instead
        });

        await this.logMessage(runId, 'info', {
          session: sessionId,
          agent: agent.name
        }, `Added ${Object.keys(parsedOutput).length} structured fields to context`);
      }

      // Also check for tool calls in the structured output
      if (parsedOutput.tool_call && typeof parsedOutput.tool_call === 'object') {
        context[`${agent.name}_tool_call`] = parsedOutput.tool_call;
        
        await this.logMessage(runId, 'info', {
          session: sessionId,
          agent: agent.name,
          tool: 'tool_call'
        }, `Agent requested tool call via structured output`);
      }

    } catch (error) {
      await this.logMessage(runId, 'error', {
        session: sessionId,
        agent: agent.name
      }, `Failed to parse structured output: ${(error as Error).message}`);
      
      // Don't throw - continue with text-only output
    }
  }

  private jsonSchemaToZod(schema: any): z.ZodSchema {
    // Convert JSON Schema to Zod schema for validation
    if (!schema || typeof schema !== 'object') {
      return z.any();
    }

    if (schema.type === 'object' && schema.properties) {
      const shape: Record<string, z.ZodSchema> = {};
      
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        shape[key] = this.jsonSchemaToZod(propSchema);
      });
      
      const zodObject = z.object(shape);
      
      // Handle optional vs required fields
      if (schema.required && Array.isArray(schema.required)) {
        const requiredFields = new Set(schema.required);
        const partialShape: Record<string, z.ZodSchema> = {};
        
        Object.entries(shape).forEach(([key, zodSchema]) => {
          partialShape[key] = requiredFields.has(key) ? zodSchema : zodSchema.optional();
        });
        
        return z.object(partialShape);
      }
      
      return zodObject.partial(); // All fields optional by default
    }

    if (schema.type === 'array' && schema.items) {
      return z.array(this.jsonSchemaToZod(schema.items));
    }

    if (schema.type === 'string') {
      let zodSchema = z.string();
      if (schema.enum) {
        return z.enum(schema.enum);
      }
      return zodSchema;
    }

    if (schema.type === 'number') {
      return z.number();
    }

    if (schema.type === 'integer') {
      return z.number().int();
    }

    if (schema.type === 'boolean') {
      return z.boolean();
    }

    // Default fallback
    return z.any();
  }

  private async executeToolStep(runId: string, sessionId: string, step: Step, context: any, simplified = false): Promise<any> {
    const tool = await storage.getTool(step.refId);
    if (!tool) {
      throw new Error("Tool not found");
    }

    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      tool: tool.name,
      step: step.idx.toString() 
    }, `Executing tool: ${tool.name}`);

    let result;
    
    if (tool.type === 'builtin') {
      result = await this.executeBuiltinTool(tool, context, simplified);
    } else if (tool.type === 'http') {
      result = await this.executeHttpTool(tool, context, simplified);
    } else if (tool.type === 'mcp') {
      result = await this.executeMcpTool(tool, context, simplified);
    } else {
      throw new Error(`Unknown tool type: ${tool.type}`);
    }

    // Store result with both underscore and dot naming for template compatibility
    const underscoreName = tool.name.replace(/\./g, '_');
    context[`${tool.name}_result`] = result; // Keep original format
    context[`${underscoreName}_result`] = result; // Add underscore format for templates
    
    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      tool: tool.name,
      step: step.idx.toString() 
    }, `Tool completed: ${tool.name}`);

    return context;
  }

  private async executeBuiltinTool(tool: Tool, context: any, simplified = false): Promise<any> {
    if (tool.name === 'notion.create_tasks') {
      // Use structured action_items from context if available, otherwise extract from text
      let tasks = context.action_items || [];
      
      if (tasks.length === 0) {
        // Fallback to text extraction if no structured data
        tasks = this.extractTasksFromContext(context);
      }
      
      // Normalize data shape: map {owner, task, due_by, priority, notes} to {title, owner, due, priority, notes}
      const normalizedTasks = tasks.map((task: any) => {
        // Handle both structured and text-extracted formats
        const normalizedTask: any = {
          title: (task.task || task.title || '').trim() || 'Untitled Task',
          owner: (task.owner || '').trim() || undefined,
          due: (task.due_by || task.due || '').trim() || undefined,
          priority: (task.priority || 'Medium').trim() as 'Low' | 'Medium' | 'High',
          notes: (task.notes || '').trim() || undefined
        };
        
        // Remove undefined/empty fields
        Object.keys(normalizedTask).forEach(key => {
          if (normalizedTask[key] === undefined || normalizedTask[key] === '') {
            delete normalizedTask[key];
          }
        });
        
        return normalizedTask;
      }).filter(task => task.title && task.title !== 'Untitled Task'); // Filter out empty tasks
      
      // Get database_id from tool spec, context, or environment
      const databaseId = tool.spec?.database_id || 
                        context.notion_database_id || 
                        process.env.NOTION_DATABASE_ID || 
                        null;
      
      return await createNotionTasks(normalizedTasks, databaseId);
    }
    
    // Add other builtin tools here
    throw new Error(`Builtin tool not implemented: ${tool.name}`);
  }

  private async executeHttpTool(tool: Tool, context: any, simplified = false): Promise<any> {
    const spec = tool.spec as any;
    const url = spec.url;
    const method = spec.method || 'POST';
    const headers = spec.headers || {};
    
    const payload = simplified ? this.simplifyPayload(context) : context;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP tool failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeMcpTool(tool: Tool, context: any, simplified = false): Promise<any> {
    // MCP tool execution would be implemented here
    // For now, return a placeholder
    return {
      success: true,
      message: `MCP tool ${tool.name} executed (placeholder)`
    };
  }

  private extractTasksFromContext(context: any): Array<{
    title: string;
    owner?: string;
    due?: string;
    priority?: 'Low' | 'Medium' | 'High';
    notes?: string;
  }> {
    // Look for action items in various formats in the context
    const tasks = [];
    
    for (const [key, value] of Object.entries(context)) {
      if (key.includes('action') || key.includes('task')) {
        if (typeof value === 'string') {
          // Parse text for task-like content
          const lines = value.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.includes('|') && (line.includes('Task') || line.includes('Owner'))) {
              // Table format
              const parts = line.split('|').map(p => p.trim());
              if (parts.length >= 2) {
                tasks.push({
                  title: parts[1],
                  owner: parts[0],
                  priority: 'Medium' as const
                });
              }
            } else if (line.match(/^[-*•]\s/)) {
              // Bullet point format
              tasks.push({
                title: line.replace(/^[-*•]\s/, ''),
                priority: 'Medium' as const
              });
            }
          }
        }
      }
    }

    // If no tasks found, create a default one
    if (tasks.length === 0) {
      tasks.push({
        title: 'Review and organize extracted content',
        priority: 'Medium' as const
      });
    }

    return tasks;
  }

  private simplifyPayload(context: any): any {
    // Create a simplified version of the context for retry attempts
    const simplified: any = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string' && value.length > 1000) {
        simplified[key] = value.substring(0, 1000) + '...';
      } else if (Array.isArray(value) && value.length > 5) {
        simplified[key] = value.slice(0, 5);
      } else {
        simplified[key] = value;
      }
    }
    
    return simplified;
  }

  private async updateRunStatus(runId: string, status: string, context?: any) {
    const updates: any = { status };
    if (status === 'success' || status === 'error') {
      updates.completedAt = new Date();
    }
    if (context) {
      updates.context = context;
      updates.output = this.generateOutputSummary(context);
    }
    
    await storage.updateRun(runId, updates);
  }

  private generateOutputSummary(context: any): any {
    // Generate a summary of the execution results
    const summary: any = {
      executedAt: new Date().toISOString(),
      steps: []
    };

    for (const [key, value] of Object.entries(context)) {
      if (key.endsWith('_output') || key.endsWith('_result')) {
        summary.steps.push({
          step: key,
          hasOutput: !!value,
          type: key.endsWith('_output') ? 'agent' : 'tool'
        });
      }
    }

    return summary;
  }

  private async autoExecuteToolCall(
    runId: string, 
    sessionId: string, 
    toolCall: any, 
    context: any, 
    agentStepIdx: number
  ): Promise<any> {
    try {
      // Parse tool call structure
      const toolName = toolCall.tool || toolCall.name;
      const toolArgs = toolCall.args || toolCall.arguments || {};
      
      if (!toolName) {
        throw new Error("Tool call missing tool name");
      }
      
      // Check for deduplication - skip if tool is already executed or will be executed later
      const underscoreName = toolName.replace(/\./g, '_');
      if (context[`${toolName}_result`] || context[`${underscoreName}_result`] || context[`${toolName}_executed`]) {
        await this.logMessage(runId, 'info', { 
          session: sessionId,
          tool: toolName,
          step: `${agentStepIdx}-auto`
        }, `Skipping auto-execution of ${toolName} - already executed or pending`);
        return context;
      }
      
      // Mark as being executed to prevent duplicate runs
      context[`${toolName}_executed`] = true;
      context[`${underscoreName}_executed`] = true;
      
      await this.logMessage(runId, 'info', { 
        session: sessionId,
        tool: toolName,
        step: `${agentStepIdx}-auto`
      }, `Auto-executing tool: ${toolName}`);
      
      // Find the tool by name in the project
      const projectId = context.project_id || await this.getProjectIdFromContext(context);
      const tools = projectId ? await storage.getTools(projectId) : [];
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        // Try to create a dynamic builtin tool for common cases
        const dynamicTool = this.createDynamicBuiltinTool(toolName, toolArgs);
        if (!dynamicTool) {
          throw new Error(`Tool '${toolName}' not found in project`);
        }
        
        const result = await this.executeBuiltinTool(dynamicTool, context);
        
        // Store result in context with both naming conventions
        context[`${toolName}_result`] = result;
        context[`${underscoreName}_result`] = result;
        
        await this.logMessage(runId, 'info', { 
          session: sessionId,
          tool: toolName,
          step: `${agentStepIdx}-auto`
        }, `Auto-executed dynamic tool: ${toolName}`);
        
        return context;
      }
      
      // Execute the found tool
      let result;
      if (tool.type === 'builtin') {
        // Merge tool args into context for builtin tools
        const mergedContext = { ...context, ...toolArgs };
        result = await this.executeBuiltinTool(tool, mergedContext);
      } else if (tool.type === 'http') {
        result = await this.executeHttpTool(tool, { ...context, ...toolArgs });
      } else if (tool.type === 'mcp') {
        result = await this.executeMcpTool(tool, { ...context, ...toolArgs });
      } else {
        throw new Error(`Unknown tool type: ${tool.type}`);
      }
      
      // Store result in context with both naming conventions
      context[`${tool.name}_result`] = result;
      context[`${underscoreName}_result`] = result;
      
      await this.logMessage(runId, 'info', { 
        session: sessionId,
        tool: tool.name,
        step: `${agentStepIdx}-auto`
      }, `Auto-executed tool: ${tool.name}`);
      
      return context;
      
    } catch (error) {
      await this.logMessage(runId, 'error', { 
        session: sessionId,
        step: `${agentStepIdx}-auto`
      }, `Auto-execution failed: ${(error as Error).message}`);
      
      // Store error in context but don't throw
      context[`auto_tool_error`] = (error as Error).message;
      return context;
    }
  }

  private createDynamicBuiltinTool(toolName: string, toolArgs: any): Tool | null {
    // Create dynamic builtin tools for common cases
    if (toolName === 'notion.create_tasks') {
      return {
        id: 'dynamic-notion-create-tasks',
        projectId: 'dynamic',
        name: 'notion.create_tasks',
        type: 'builtin',
        spec: {
          database_id: toolArgs.database_id || null
        },
        createdAt: new Date()
      } as Tool;
    }
    
    return null;
  }

  private async getProjectIdFromContext(context: any): Promise<string | null> {
    // Try to extract project ID from context or from the current run
    return context.project_id || null;
  }

  private async logMessage(runId: string, level: string, tags: Record<string, string>, message: string, payload?: any) {
    try {
      await storage.createLog({
        runId,
        level,
        tags,
        message,
        payload
      });

      // Broadcast to WebSocket clients if available
      // This would be implemented with the WebSocket server
    } catch (error) {
      console.error("Failed to create log:", error);
    }
  }
}

export const executionEngine = new ExecutionEngine();
