import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { ExecutionEngine } from './executionEngine';

export interface WSMessage {
  type: 'log' | 'status_update' | 'run_complete' | 'error';
  runId: string;
  data: any;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, request: any) {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe_run' && data.runId) {
          await this.subscribeToRun(ws, data.runId);
        } else if (data.type === 'unsubscribe_run' && data.runId) {
          this.unsubscribeFromRun(ws, data.runId);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      this.cleanupConnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.cleanupConnection(ws);
    });
  }

  private async subscribeToRun(ws: WebSocket, runId: string) {
    try {
      // Verify the run exists
      const run = await storage.getRun(runId);
      if (!run) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Run not found'
        }));
        return;
      }

      // Add client to subscribers for this run
      if (!this.clients.has(runId)) {
        this.clients.set(runId, new Set());
      }
      this.clients.get(runId)!.add(ws);

      // Send current run status
      ws.send(JSON.stringify({
        type: 'run_status',
        runId,
        data: {
          status: run.status,
          sessionId: run.sessionId,
          createdAt: run.createdAt,
          completedAt: run.completedAt
        }
      }));

      // Send existing logs for this run
      const logs = await storage.getLogs(runId);
      logs.forEach(log => {
        ws.send(JSON.stringify({
          type: 'log',
          runId,
          data: {
            id: log.id,
            timestamp: log.ts,
            level: log.level,
            tags: log.tags,
            message: log.message,
            payload: log.payload
          }
        }));
      });

      console.log(`Client subscribed to run ${runId}`);
    } catch (error) {
      console.error('Error subscribing to run:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to subscribe to run'
      }));
    }
  }

  private unsubscribeFromRun(ws: WebSocket, runId: string) {
    const clients = this.clients.get(runId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(runId);
      }
    }
    console.log(`Client unsubscribed from run ${runId}`);
  }

  private cleanupConnection(ws: WebSocket) {
    // Remove this connection from all subscriptions
    for (const [runId, clients] of this.clients.entries()) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(runId);
      }
    }
  }

  // Called by ExecutionEngine to broadcast logs
  broadcastLog(runId: string, log: any) {
    const clients = this.clients.get(runId);
    if (clients && clients.size > 0) {
      const message = JSON.stringify({
        type: 'log',
        runId,
        data: {
          id: log.id,
          timestamp: log.ts,
          level: log.level,
          tags: log.tags,
          message: log.message,
          payload: log.payload
        }
      });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Called by ExecutionEngine to broadcast status updates
  broadcastStatusUpdate(runId: string, status: string, data?: any) {
    const clients = this.clients.get(runId);
    if (clients && clients.size > 0) {
      const message = JSON.stringify({
        type: 'status_update',
        runId,
        data: { status, ...data }
      });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Called by ExecutionEngine when run completes
  broadcastRunComplete(runId: string, output: any) {
    const clients = this.clients.get(runId);
    if (clients && clients.size > 0) {
      const message = JSON.stringify({
        type: 'run_complete',
        runId,
        data: { output }
      });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
}

let wsManager: WebSocketManager | null = null;

export function setupWebSocketServer(server: Server): WebSocketManager {
  wsManager = new WebSocketManager(server);
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}