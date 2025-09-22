import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function Tools() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
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
      {/* Mobile overlay when sidebar is open */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar with responsive behavior */}
      <div className={`${sidebarCollapsed && isMobile ? 'hidden' : 'block'} ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'relative'}`}>
        <Sidebar onClose={() => setSidebarCollapsed(true)} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} showMenuButton={isMobile} />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Tools & Integrations</h1>
                <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                  Connect your agents to external services and APIs
                </p>
              </div>
              <Button 
                size={isMobile ? "sm" : "default"}
                data-testid="button-add-integration"
                className="self-start lg:self-auto"
              >
                <i className="fas fa-plus mr-1 lg:mr-2"></i>
                <span className="hidden sm:inline">Add Integration</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Connected Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold" data-testid="text-connected-tools">
                    {toolCategories.flatMap(cat => cat.tools).filter(tool => tool.status === 'connected').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold" data-testid="text-available-tools">
                    {toolCategories.flatMap(cat => cat.tools).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold" data-testid="text-categories">
                    {toolCategories.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tool Categories */}
            <div className="space-y-6 lg:space-y-8">
              {toolCategories.map((category) => (
                <div key={category.name}>
                  <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">{category.name}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {category.tools.map((tool) => (
                      <Card 
                        key={tool.name} 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 touch-manipulation"
                        data-testid={`card-tool-${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i className={`${tool.icon} text-primary text-sm lg:text-base`}></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-sm lg:text-base truncate">{tool.name}</CardTitle>
                                <Badge 
                                  variant={tool.status === 'connected' ? 'default' : 'secondary'}
                                  className="mt-1 text-xs"
                                >
                                  {tool.status}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-shrink-0 h-8 w-8 p-0"
                              data-testid={`button-menu-${tool.name}`}
                            >
                              <i className="fas fa-ellipsis-v text-xs"></i>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-muted-foreground text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2">
                            {tool.description}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {tool.status === 'connected' ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs lg:text-sm h-8 touch-manipulation"
                                  data-testid={`button-configure-${tool.name}`}
                                >
                                  Configure
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs lg:text-sm h-8 touch-manipulation"
                                  data-testid={`button-test-${tool.name}`}
                                >
                                  Test
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                className="text-xs lg:text-sm h-8 touch-manipulation w-full sm:w-auto"
                                data-testid={`button-connect-${tool.name}`}
                              >
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