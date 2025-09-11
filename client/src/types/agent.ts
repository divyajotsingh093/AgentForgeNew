export interface Agent {
  id: string;
  projectId: string;
  name: string;
  description: string;
  systemPrompt: string;
  userTemplate?: string;
  fewShots?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  projectId: string;
  name: string;
  type: 'builtin' | 'http' | 'mcp';
  spec: Record<string, any>;
  createdAt: string;
}

export interface Flow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  version: number;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  flowId: string;
  idx: number;
  kind: 'agent' | 'tool';
  refId: string;
  config?: Record<string, any>;
  createdAt: string;
}

export interface Run {
  id: string;
  flowId: string;
  sessionId: string;
  status: 'queued' | 'running' | 'success' | 'error';
  input?: Record<string, any>;
  output?: Record<string, any>;
  context?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface Log {
  id: string;
  runId: string;
  ts: string;
  level: 'info' | 'warn' | 'error';
  tags: Record<string, string>;
  message: string;
  payload?: Record<string, any>;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  templateData: Record<string, any>;
  createdAt: string;
}
