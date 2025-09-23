import { createNotionTasks } from "../notionClient";
import type { ToolDef, Context } from "../engine/types";
import type { ExecutionLogger } from "../engine/log";

// Execute a tool with the given inputs
export async function executeTool(
  toolDef: ToolDef,
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  logger.toolStart(toolDef.name, {
    session: context.sessionId
  });

  try {
    let result: any;

    if (toolDef.type === 'builtin') {
      result = await executeBuiltinTool(toolDef, inputs, context, logger);
    } else if (toolDef.type === 'http') {
      result = await executeHttpTool(toolDef, inputs, context, logger);
    } else if (toolDef.type === 'mcp') {
      result = await executeMcpTool(toolDef, inputs, context, logger);
    } else {
      throw new Error(`Unknown tool type: ${toolDef.type}`);
    }

    logger.toolComplete(toolDef.name, {
      session: context.sessionId
    });

    return result;

  } catch (error) {
    logger.toolError(toolDef.name, (error as Error).message, {
      session: context.sessionId
    });
    throw error;
  }
}

// Execute builtin tools
async function executeBuiltinTool(
  toolDef: ToolDef,
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  switch (toolDef.name) {
    case 'notion.export':
    case 'notion.create_tasks':
      return await executeNotionTool(inputs, context, logger);
    
    case 'speech.to_text':
      return await executeSpeechTool(inputs, context, logger);
    
    default:
      throw new Error(`Builtin tool not implemented: ${toolDef.name}`);
  }
}

// Execute HTTP tools
async function executeHttpTool(
  toolDef: ToolDef,
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  const spec = toolDef.spec as any;
  const url = spec.url;
  const method = spec.method || 'POST';
  const headers = spec.headers || {};

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(inputs)
  });

  if (!response.ok) {
    throw new Error(`HTTP tool failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Execute MCP tools
async function executeMcpTool(
  toolDef: ToolDef,
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  logger.mcpStart(toolDef.name, {
    session: context.sessionId
  });

  try {
    // MCP implementation would go here
    // For now, return placeholder
    const result = {
      success: true,
      message: `MCP tool ${toolDef.name} executed (placeholder)`,
      inputs
    };

    logger.mcpComplete(toolDef.name, {
      session: context.sessionId
    });

    return result;

  } catch (error) {
    logger.mcpError(toolDef.name, (error as Error).message, {
      session: context.sessionId
    });
    throw error;
  }
}

// Execute Notion tool
async function executeNotionTool(
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  // Extract tasks from inputs or context
  let tasks = inputs.tasks || inputs.action_items || context.action_items || [];
  
  // Normalize task format
  const normalizedTasks = tasks.map((task: any) => ({
    title: task.task || task.title || 'Untitled Task',
    owner: task.owner || undefined,
    due: task.due_by || task.due || undefined,
    priority: task.priority || 'Medium',
    notes: task.notes || undefined
  })).filter((task: any) => task.title && task.title !== 'Untitled Task');

  // Get database ID
  const databaseId = inputs.databaseId || 
                    context.notion_database_id || 
                    process.env.NOTION_DATABASE_ID || 
                    null;

  return await createNotionTasks(normalizedTasks, databaseId);
}

// Execute speech tool (stub)
async function executeSpeechTool(
  inputs: Record<string, any>,
  context: Context,
  logger: ExecutionLogger
): Promise<any> {
  // Stub implementation
  return {
    transcript: inputs.audioUrl ? `Transcribed content from ${inputs.audioUrl}` : inputs.transcript || "Sample transcript",
    success: true,
    duration: 0
  };
}