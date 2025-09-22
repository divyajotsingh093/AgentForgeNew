import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Tools() {
  const toolCategories = [
    {
      name: "AI Models",
      tools: [
        { name: "OpenAI GPT", description: "Advanced language model for text generation", status: "connected", icon: "fas fa-brain" },
        { name: "Claude", description: "Anthropic's AI assistant", status: "available", icon: "fas fa-robot" },
        { name: "Gemini", description: "Google's multimodal AI model", status: "available", icon: "fas fa-star" },
      ]
    },
    {
      name: "Productivity",
      tools: [
        { name: "Notion", description: "Note-taking and database management", status: "connected", icon: "fas fa-file-alt" },
        { name: "Slack", description: "Team communication and messaging", status: "available", icon: "fas fa-comments" },
        { name: "Google Calendar", description: "Schedule and event management", status: "available", icon: "fas fa-calendar" },
      ]
    },
    {
      name: "Data Sources", 
      tools: [
        { name: "PostgreSQL", description: "Relational database queries", status: "connected", icon: "fas fa-database" },
        { name: "REST API", description: "HTTP API integrations", status: "connected", icon: "fas fa-plug" },
        { name: "Webhooks", description: "Real-time event notifications", status: "connected", icon: "fas fa-bolt" },
      ]
    },
    {
      name: "Communication",
      tools: [
        { name: "Email (SMTP)", description: "Send automated emails", status: "available", icon: "fas fa-envelope" },
        { name: "SMS (Twilio)", description: "Send text messages", status: "available", icon: "fas fa-sms" },
        { name: "Discord", description: "Gaming and community chat", status: "available", icon: "fab fa-discord" },
      ]
    }
  ];

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
                <h1 className="text-3xl font-bold">Tools & Integrations</h1>
                <p className="text-muted-foreground mt-1">
                  Connect your agents to external services and APIs
                </p>
              </div>
              <Button data-testid="button-add-integration">
                <i className="fas fa-plus mr-2"></i>
                Add Integration
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Connected Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-connected-tools">
                    {toolCategories.flatMap(cat => cat.tools).filter(tool => tool.status === 'connected').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-available-tools">
                    {toolCategories.flatMap(cat => cat.tools).length}
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
                  <div className="text-2xl font-bold" data-testid="text-categories">
                    {toolCategories.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tool Categories */}
            <div className="space-y-8">
              {toolCategories.map((category) => (
                <div key={category.name}>
                  <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.tools.map((tool) => (
                      <Card 
                        key={tool.name} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        data-testid={`card-tool-${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <i className={`${tool.icon} text-primary`}></i>
                              </div>
                              <div>
                                <CardTitle className="text-base">{tool.name}</CardTitle>
                                <Badge 
                                  variant={tool.status === 'connected' ? 'default' : 'secondary'}
                                  className="mt-1"
                                >
                                  {tool.status}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" data-testid={`button-menu-${tool.name}`}>
                              <i className="fas fa-ellipsis-v"></i>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm mb-4">
                            {tool.description}
                          </p>
                          <div className="flex gap-2">
                            {tool.status === 'connected' ? (
                              <>
                                <Button size="sm" variant="outline" data-testid={`button-configure-${tool.name}`}>
                                  Configure
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-test-${tool.name}`}>
                                  Test
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" data-testid={`button-connect-${tool.name}`}>
                                Connect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}