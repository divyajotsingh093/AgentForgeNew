import pino from 'pino';

// Log tags for multi-dimensional logging
export interface LogTags {
  session?: string;
  agent?: string;
  step?: string;
  tool?: string;
  mcp?: string;
  runId?: string;
  attempt?: string;
}

// Logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Structured logging with tags
export class ExecutionLogger {
  private baseLogger: pino.Logger;
  
  constructor(runId?: string) {
    this.baseLogger = runId ? logger.child({ runId }) : logger;
  }

  info(message: string, tags: LogTags = {}, payload?: any) {
    this.baseLogger.info({ tags, payload }, message);
  }

  warn(message: string, tags: LogTags = {}, payload?: any) {
    this.baseLogger.warn({ tags, payload }, message);
  }

  error(message: string, tags: LogTags = {}, payload?: any) {
    this.baseLogger.error({ tags, payload }, message);
  }

  debug(message: string, tags: LogTags = {}, payload?: any) {
    this.baseLogger.debug({ tags, payload }, message);
  }

  // Create child logger for specific context
  child(tags: LogTags): ExecutionLogger {
    const childLogger = new ExecutionLogger();
    childLogger.baseLogger = this.baseLogger.child({ tags });
    return childLogger;
  }

  // Log step execution
  stepStart(stepId: string, stepName: string, tags: LogTags = {}) {
    this.info(`Starting step ${stepId}: ${stepName}`, { ...tags, step: stepId });
  }

  stepComplete(stepId: string, stepName: string, duration: number, tags: LogTags = {}) {
    this.info(`Completed step ${stepId}: ${stepName} in ${duration}ms`, { ...tags, step: stepId });
  }

  stepError(stepId: string, stepName: string, error: string, tags: LogTags = {}) {
    this.error(`Step ${stepId}: ${stepName} failed: ${error}`, { ...tags, step: stepId });
  }

  stepRetry(stepId: string, attempt: number, error: string, tags: LogTags = {}) {
    this.warn(`Step ${stepId} retry attempt ${attempt}: ${error}`, { ...tags, step: stepId, attempt: attempt.toString() });
  }

  // Log agent execution
  agentStart(agentName: string, tags: LogTags = {}) {
    this.info(`Executing agent: ${agentName}`, { ...tags, agent: agentName });
  }

  agentComplete(agentName: string, tags: LogTags = {}) {
    this.info(`Agent completed: ${agentName}`, { ...tags, agent: agentName });
  }

  agentError(agentName: string, error: string, tags: LogTags = {}) {
    this.error(`Agent ${agentName} failed: ${error}`, { ...tags, agent: agentName });
  }

  // Log tool execution
  toolStart(toolName: string, tags: LogTags = {}) {
    this.info(`Executing tool: ${toolName}`, { ...tags, tool: toolName });
  }

  toolComplete(toolName: string, tags: LogTags = {}) {
    this.info(`Tool completed: ${toolName}`, { ...tags, tool: toolName });
  }

  toolError(toolName: string, error: string, tags: LogTags = {}) {
    this.error(`Tool ${toolName} failed: ${error}`, { ...tags, tool: toolName });
  }

  // Log MCP operations
  mcpStart(operation: string, tags: LogTags = {}) {
    this.info(`MCP operation: ${operation}`, { ...tags, mcp: operation });
  }

  mcpComplete(operation: string, tags: LogTags = {}) {
    this.info(`MCP operation completed: ${operation}`, { ...tags, mcp: operation });
  }

  mcpError(operation: string, error: string, tags: LogTags = {}) {
    this.error(`MCP operation ${operation} failed: ${error}`, { ...tags, mcp: operation });
  }
}

// Default logger instance
export const executionLogger = new ExecutionLogger();

// Create logger for specific run
export function createRunLogger(runId: string): ExecutionLogger {
  return new ExecutionLogger(runId);
}