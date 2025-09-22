import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Integrations() {
  const connectedIntegrations = [
    {
      id: "openai",
      name: "OpenAI",
      type: "AI Model",
      status: "connected",
      description: "Advanced language models for text generation and analysis",
      icon: "fas fa-brain",
      configuredAt: "2 days ago",
      lastUsed: "5 minutes ago",
      usageCount: 156,
    },
    {
      id: "notion",
      name: "Notion",
      type: "Productivity", 
      status: "connected",
      description: "Note-taking and database management platform",
      icon: "fas fa-file-alt",
      configuredAt: "1 week ago",
      lastUsed: "2 hours ago",
      usageCount: 43,
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "Database",
      status: "connected", 
      description: "Relational database for structured data storage",
      icon: "fas fa-database",
      configuredAt: "3 days ago",
      lastUsed: "1 hour ago",
      usageCount: 89,
    },
  ];

  const availableIntegrations = [
    {
      id: "slack",
      name: "Slack",
      type: "Communication",
      status: "available",
      description: "Team communication and collaboration platform",
      icon: "fab fa-slack",
      popularity: "Very Popular",
    },
    {
      id: "gmail",
      name: "Gmail",
      type: "Communication",
      status: "available", 
      description: "Email automation and management",
      icon: "fas fa-envelope",
      popularity: "Popular",
    },
    {
      id: "calendar",
      name: "Google Calendar",
      type: "Productivity",
      status: "available",
      description: "Schedule management and event automation",
      icon: "fas fa-calendar",
      popularity: "Popular",
    },
    {
      id: "stripe",
      name: "Stripe",
      type: "Payment",
      status: "available",
      description: "Payment processing and subscription management",
      icon: "fab fa-stripe",
      popularity: "Popular",
    },
    {
      id: "github", 
      name: "GitHub",
      type: "Development",
      status: "available",
      description: "Code repository and project management",
      icon: "fab fa-github",
      popularity: "Popular",
    },
    {
      id: "twilio",
      name: "Twilio",
      type: "Communication",
      status: "available",
      description: "SMS and voice communication APIs",
      icon: "fas fa-sms",
      popularity: "Moderate",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'available': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
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
                <h1 className="text-3xl font-bold">Integrations</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your connected services and discover new integrations
                </p>
              </div>
              <Button data-testid="button-browse-marketplace">
                <i className="fas fa-store mr-2"></i>
                Browse Marketplace
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Connected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-connected-count">
                    {connectedIntegrations.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-available-count">
                    {availableIntegrations.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-usage">
                    {connectedIntegrations.reduce((sum, integration) => sum + integration.usageCount, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-categories-count">
                    8
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Connected vs Available */}
            <Tabs defaultValue="connected" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connected" data-testid="tab-connected">
                  Connected ({connectedIntegrations.length})
                </TabsTrigger>
                <TabsTrigger value="available" data-testid="tab-available">
                  Available ({availableIntegrations.length})
                </TabsTrigger>
              </TabsList>

              {/* Connected Integrations */}
              <TabsContent value="connected" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Connected Integrations</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="button-filter-connected">
                      <i className="fas fa-filter mr-2"></i>
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-export-usage">
                      <i className="fas fa-download mr-2"></i>
                      Export Usage
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connectedIntegrations.map((integration) => (
                    <Card 
                      key={integration.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      data-testid={`card-connected-${integration.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <i className={`${integration.icon} text-primary`}></i>
                            </div>
                            <div>
                              <CardTitle className="text-base">{integration.name}</CardTitle>
                              <Badge variant={getStatusColor(integration.status)} className="mt-1">
                                {integration.status}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`button-menu-${integration.id}`}>
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {integration.description}
                        </p>
                        
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{integration.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last used:</span>
                            <span className="font-medium">{integration.lastUsed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Usage:</span>
                            <span className="font-medium">{integration.usageCount} calls</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-configure-${integration.id}`}>
                            Configure
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-test-${integration.id}`}>
                            Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Available Integrations */}
              <TabsContent value="available" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Available Integrations</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="button-filter-available">
                      <i className="fas fa-filter mr-2"></i>
                      Filter by Category
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-sort-available">
                      <i className="fas fa-sort mr-2"></i>
                      Sort by Popularity
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableIntegrations.map((integration) => (
                    <Card 
                      key={integration.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      data-testid={`card-available-${integration.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <i className={`${integration.icon} text-muted-foreground`}></i>
                            </div>
                            <div>
                              <CardTitle className="text-base">{integration.name}</CardTitle>
                              <Badge variant={getStatusColor(integration.status)} className="mt-1">
                                {integration.status}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {integration.popularity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {integration.description}
                        </p>
                        
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium">{integration.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Popularity:</span>
                            <span className="font-medium">{integration.popularity}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" data-testid={`button-connect-${integration.id}`}>
                            <i className="fas fa-plus mr-2"></i>
                            Connect
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-learn-more-${integration.id}`}>
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}