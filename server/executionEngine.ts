import { storage } from "./storage";
import { generateAgentResponse } from "./openaiClient";
import { createNotionTasks } from "./notionClient";
import type { Run, Step, Agent, Tool } from "@shared/schema";

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
            context = await this.executeAgentStep(runId, run.sessionId, step, context);
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

    const response = await generateAgentResponse(agent.systemPrompt, userMessage, context);
    
    // Parse any tool calls from the response
    const toolCallMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (toolCallMatch) {
      await this.logMessage(runId, 'info', { 
        session: sessionId, 
        agent: agent.name,
        tool: 'tool_call'
      }, `Agent requested tool call`);
      
      try {
        const toolCall = JSON.parse(toolCallMatch[1]);
        context[`${agent.name}_tool_call`] = toolCall;
      } catch (error) {
        await this.logMessage(runId, 'warn', { 
          session: sessionId, 
          agent: agent.name
        }, `Failed to parse tool call: ${(error as Error).message}`);
      }
    }

    context[`${agent.name}_output`] = response;
    
    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      agent: agent.name,
      step: step.idx.toString() 
    }, `Agent completed: ${agent.name}`);

    return context;
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

    context[`${tool.name}_result`] = result;
    
    await this.logMessage(runId, 'info', { 
      session: sessionId, 
      tool: tool.name,
      step: step.idx.toString() 
    }, `Tool completed: ${tool.name}`);

    return context;
  }

  private async executeBuiltinTool(tool: Tool, context: any, simplified = false): Promise<any> {
    if (tool.name === 'notion.create_tasks') {
      // Extract tasks from context
      const tasks = this.extractTasksFromContext(context);
      return await createNotionTasks(tasks);
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
