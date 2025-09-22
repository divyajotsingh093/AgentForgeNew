import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Runs() {
  // Mock data for demonstration
  const runs = [
    {
      id: "run_001",
      agent: "Meeting Transcriber",
      status: "completed",
      startTime: "2 hours ago",
      duration: "45s",
      trigger: "webhook",
      output: "Processed 12-minute meeting recording",
    },
    {
      id: "run_002", 
      agent: "Action Extractor",
      status: "running",
      startTime: "5 minutes ago",
      duration: "2m 15s",
      trigger: "schedule",
      output: "Processing action items...",
    },
    {
      id: "run_003",
      agent: "Content Summarizer", 
      status: "failed",
      startTime: "1 hour ago",
      duration: "12s",
      trigger: "manual",
      output: "Error: File format not supported",
    },
    {
      id: "run_004",
      agent: "Meeting Transcriber",
      status: "completed",
      startTime: "3 hours ago", 
      duration: "1m 23s",
      trigger: "webhook",
      output: "Processed 8-minute team standup",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle';
      case 'running': return 'fas fa-spinner fa-spin';
      case 'failed': return 'fas fa-times-circle';
      default: return 'fas fa-clock';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Runs</h1>
                <p className="text-muted-foreground mt-1">
                  Monitor and track agent execution history
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-filter-runs">
                  <i className="fas fa-filter mr-2"></i>
                  Filter
                </Button>
                <Button variant="outline" data-testid="button-export-runs">
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Runs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-runs">
                    {runs.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Successful
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-successful-runs">
                    {runs.filter(r => r.status === 'completed').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Running
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-running-runs">
                    {runs.filter(r => r.status === 'running').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-failed-runs">
                    {runs.filter(r => r.status === 'failed').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Runs List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
              <div className="space-y-4">
                {runs.map((run) => (
                  <Card 
                    key={run.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    data-testid={`card-run-${run.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <i className={`${getStatusIcon(run.status)} text-lg`}></i>
                            <Badge variant={getStatusColor(run.status)}>
                              {run.status}
                            </Badge>
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">{run.agent}</div>
                            <div className="text-sm text-muted-foreground">
                              {run.output}
                            </div>
                          </div>
                          
                          <div className="text-right text-sm space-y-1">
                            <div className="text-muted-foreground">
                              Started {run.startTime}
                            </div>
                            <div className="text-muted-foreground">
                              Duration: {run.duration}
                            </div>
                            <div className="text-muted-foreground">
                              Trigger: {run.trigger}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`button-view-logs-${run.id}`}
                          >
                            <i className="fas fa-file-alt mr-2"></i>
                            Logs
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`button-menu-${run.id}`}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}