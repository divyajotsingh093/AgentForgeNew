import { z } from "zod";

// Policy for execution control
export interface Policy {
  timeoutMs: number;
  maxRetries: number;
}

// Context that flows between steps
export interface Context extends Record<string, any> {
  // Core execution context
  sessionId: string;
  runId: string;
  projectId?: string;
  
  // Flow input
  input?: any;
  
  // Step outputs are added dynamically
  [key: string]: any;
}

// Step node definition
export interface StepNode {
  id: string;
  idx: number;
  kind: 'agent' | 'tool';
  name: string;
  refId: string; // References agent.id or tool.id
  in?: Record<string, string>; // Input mapping: { "transcript": "$.transcript" }
  out?: Record<string, string>; // Output mapping: { "summary": "$.summary" }
  condition?: string; // Conditional execution: "$.export == 'notion'"
  args?: Record<string, any>; // Tool arguments
  config?: Record<string, any>; // Step-specific configuration
  policy?: Policy;
}

// Flow definition
export interface FlowDef {
  id: string;
  name: string;
  description?: string;
  inputs: Record<string, string>; // Input schema: { "transcript": "string" }
  outputs?: Record<string, string>; // Output schema
  steps: StepNode[];
  policy?: Policy; // Default policy for all steps
}

// Registry for agents and tools
export interface AgentDef {
  name: string;
  systemPrompt: string;
  userTemplate?: string;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
  fewShots?: string;
  capabilities?: any;
}

export interface ToolDef {
  name: string;
  type: 'builtin' | 'http' | 'mcp';
  spec: any;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
}

export interface Registry {
  agents: Map<string, AgentDef>;
  tools: Map<string, ToolDef>;
}

// Execution results
export interface StepResult {
  stepId: string;
  status: 'success' | 'error' | 'skipped';
  output?: any;
  error?: string;
  duration: number;
  retries: number;
}

export interface RunResult {
  runId: string;
  status: 'success' | 'error' | 'timeout';
  output?: any;
  error?: string;
  steps: StepResult[];
  duration: number;
}

// Run options
export interface RunOptions {
  sessionId: string;
  input?: any;
  policy?: Policy;
  context?: Partial<Context>;
}

// LangGraph state interface
export interface LangGraphState {
  context: Context;
  currentStep: number;
  steps: StepNode[];
  results: StepResult[];
  error?: string;
  completed: boolean;
}