import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Agents() {
  // This would fetch actual agents from the API once implemented
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["/api/agents"],
    enabled: false, // Disable until API is implemented
  });

  // Mock data for now to show the UI
  const mockAgents = [
    {
      id: "1",
      name: "Meeting Transcriber",
      description: "Converts audio recordings to structured meeting notes",
      status: "active",
      tags: ["transcription", "meetings"],
      lastRun: "2 hours ago",
      runsCount: 24,
    },
    {
      id: "2", 
      name: "Content Summarizer",
      description: "Extracts key insights from documents and articles",
      status: "inactive",
      tags: ["content", "analysis"],
      lastRun: "1 day ago",
      runsCount: 12,
    },
    {
      id: "3",
      name: "Action Extractor", 
      description: "Identifies action items and assigns them to team members",
      status: "active",
      tags: ["productivity", "tasks"],
      lastRun: "30 minutes ago",
      runsCount: 8,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold">Agents</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and monitor your AI agents
                </p>
              </div>
              <Button asChild data-testid="button-create-agent">
                <Link href="/agent-builder">
                  <i className="fas fa-plus mr-2"></i>
                  Create Agent
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-agents">
                    {mockAgents.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-agents">
                    {mockAgents.filter(a => a.status === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Runs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-runs">
                    {mockAgents.reduce((sum, agent) => sum + agent.runsCount, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-success-rate">
                    94%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agents List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Agents</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-filter">
                    <i className="fas fa-filter mr-2"></i>
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-sort">
                    <i className="fas fa-sort mr-2"></i>
                    Sort
                  </Button>
                </div>
              </div>

              {mockAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockAgents.map((agent) => (
                    <Card 
                      key={agent.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      data-testid={`card-agent-${agent.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                            <Badge 
                              variant={agent.status === 'active' ? 'default' : 'secondary'}
                              className="mt-2"
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`button-menu-${agent.id}`}>
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {agent.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {agent.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="text-muted-foreground">
                              Last run: {agent.lastRun}
                            </div>
                            <div className="text-muted-foreground">
                              {agent.runsCount} total runs
                            </div>
                          </div>
                          <Button size="sm" variant="outline" data-testid={`button-view-${agent.id}`}>
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-robot text-2xl text-muted-foreground"></i>
                    </div>
                    <h3 className="font-semibold mb-2">No agents yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first agent to start automating workflows
                    </p>
                    <Button asChild data-testid="button-create-first-agent">
                      <Link href="/agent-builder">
                        Create Your First Agent
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}