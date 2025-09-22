import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RunConsoleProps {
  activeRun: string | null;
  onClose?: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  session: string;
  agent?: string;
  step?: string;
  tool?: string;
  mcp?: string;
  message: string;
  type: 'session' | 'agent' | 'tool' | 'note';
}

export default function RunConsole({ activeRun, onClose }: RunConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [duration, setDuration] = useState('0:00');

  // Simulate log streaming when there's an active run
  useEffect(() => {
    if (!activeRun) return;

    setRunStatus('running');
    setLogs([]);

    const mockLogs: Omit<LogEntry, 'id' | 'timestamp'>[] = [
      {
        session: activeRun,
        agent: 'transcriber',
        step: '1',
        message: 'Processing audio transcript...',
        type: 'agent'
      },
      {
        session: activeRun,
        agent: 'transcriber',
        tool: 'gmeet.fetch_transcript',
        message: 'Tool call: gmeet.fetch_transcript',
        type: 'tool'
      },
      {
        session: activeRun,
        agent: 'summarizer',
        step: '2', 
        message: 'Creating meeting summary...',
        type: 'agent'
      },
      {
        session: activeRun,
        message: 'Extracted 3 action items from transcript',
        type: 'note'
      },
      {
        session: activeRun,
        agent: 'action_extractor',
        step: '3',
        message: 'Processing action items...',
        type: 'agent'
      },
      {
        session: activeRun,
        tool: 'notion.create_tasks',
        message: 'Creating tasks in Notion database',
        type: 'tool'
      }
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < mockLogs.length) {
        const logEntry = {
          id: `${activeRun}_${logIndex}`,
          timestamp: new Date().toLocaleTimeString(),
          ...mockLogs[logIndex]
        };
        
        setLogs(prev => [...prev, logEntry]);
        logIndex++;
      } else {
        setRunStatus('success');
        clearInterval(interval);
      }
    }, 2000);

    // Duration counter
    const startTime = Date.now();
    const durationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(durationInterval);
    };
  }, [activeRun]);

  const getLogStyle = (log: LogEntry) => {
    if (log.agent) return 'border-l-2 border-secondary';
    if (log.tool) return 'border-l-2 border-accent';
    if (log.type === 'note') return 'border-l-2 border-muted-foreground';
    return 'border-l-2 border-primary';
  };

  const getStatusBadge = () => {
    switch (runStatus) {
      case 'running':
        return <Badge className="bg-accent/10 text-accent">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Mobile close button */}
      {onClose && (
        <div className="p-2 border-b border-border lg:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="w-full"
            data-testid="button-close-console"
          >
            <i className="fas fa-times mr-2"></i>
            Close Console
          </Button>
        </div>
      )}
      
      {/* Panel Tabs */}
      <Tabs defaultValue="console" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="console" data-testid="tab-run-console">Run Console</TabsTrigger>
          <TabsTrigger value="properties" data-testid="tab-properties">Properties</TabsTrigger>
          <TabsTrigger value="variables" data-testid="tab-variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="console" className="flex-1 flex flex-col m-0">
          {/* Run Status */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Current Run</h3>
              {getStatusBadge()}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-xs" data-testid="text-session-id">
                  {activeRun || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span data-testid="text-start-time">
                  {activeRun ? new Date().toLocaleTimeString() : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span data-testid="text-duration">{duration}</span>
              </div>
            </div>
          </div>

          {/* Live Logs */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <h4 className="font-medium mb-3 text-sm">Live Logs</h4>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground text-sm">
                    {activeRun ? 'Waiting for logs...' : 'No active run'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 bg-muted/50 rounded ${getLogStyle(log)}`}
                      data-testid={`log-${log.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-primary font-medium">
                          [#session:{log.session}]
                        </span>
                        {log.agent && (
                          <span className="text-secondary">
                            [#agent:{log.agent}]
                          </span>
                        )}
                        {log.step && (
                          <span className="text-muted-foreground">
                            [#step:{log.step}]
                          </span>
                        )}
                        {log.tool && (
                          <span className="text-accent">
                            [#tool:{log.tool}]
                          </span>
                        )}
                        {log.mcp && (
                          <span className="text-purple-600">
                            [#mcp:{log.mcp}]
                          </span>
                        )}
                      </div>
                      <div className="text-foreground">{log.message}</div>
                      <div className="text-muted-foreground mt-1">{log.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Output Preview */}
          {logs.length > 0 && (
            <div className="border-t border-border p-4">
              <h4 className="font-medium mb-3 text-sm">Output Preview</h4>
              <div className="bg-muted/50 rounded p-3 text-xs" data-testid="output-preview">
                <div className="font-medium mb-2">Summary</div>
                <div className="text-muted-foreground mb-3">
                  Team discussed Q4 roadmap priorities and resource allocation...
                </div>
                
                <div className="font-medium mb-2">Action Items</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>• Alice: Draft product brief (Due: Sep 19)</div>
                  <div>• Bob: Set up user interviews (Due: Sep 18)</div>
                  <div>• Carol: Review API specs (Due: Sep 20)</div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-4 m-0">
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              Select a step to view properties
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="flex-1 p-4 m-0">
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              No variables defined
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
