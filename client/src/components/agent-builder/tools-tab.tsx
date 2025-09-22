import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface ToolsTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function ToolsTab({ agentData, setAgentData }: ToolsTabProps) {
  const [selectedTools, setSelectedTools] = useState<string[]>(["openai", "notion"]);
  const [showCustomApiDialog, setShowCustomApiDialog] = useState(false);

  const builtinTools = [
    {
      id: "openai",
      name: "OpenAI GPT",
      category: "AI",
      description: "Access to GPT models for advanced reasoning",
      icon: "fas fa-brain",
      color: "bg-green-500"
    },
    {
      id: "notion",
      name: "Notion",
      category: "Productivity",
      description: "Create and manage Notion pages and databases",
      icon: "fab fa-notion",
      color: "bg-gray-800"
    },
    {
      id: "google-search",
      name: "Google Search",
      category: "Search",
      description: "Search the web for real-time information",
      icon: "fab fa-google",
      color: "bg-blue-500"
    },
    {
      id: "calculator",
      name: "Calculator",
      category: "Utility",
      description: "Perform mathematical calculations",
      icon: "fas fa-calculator",
      color: "bg-purple-500"
    },
    {
      id: "email",
      name: "Email",
      category: "Communication",
      description: "Send emails via SMTP",
      icon: "fas fa-envelope",
      color: "bg-red-500"
    },
    {
      id: "slack",
      name: "Slack",
      category: "Communication",
      description: "Send messages to Slack channels",
      icon: "fab fa-slack",
      color: "bg-pink-500"
    },
    {
      id: "github",
      name: "GitHub",
      category: "Developer",
      description: "Create issues, PRs, and manage repositories",
      icon: "fab fa-github",
      color: "bg-gray-900"
    },
    {
      id: "database",
      name: "Database Query",
      category: "Data",
      description: "Execute SQL queries on connected databases",
      icon: "fas fa-database",
      color: "bg-blue-600"
    }
  ];

  const integrations = [
    {
      id: "stripe",
      name: "Stripe",
      category: "Payment",
      description: "Process payments and manage subscriptions",
      icon: "fab fa-stripe",
      color: "bg-blue-600",
      status: "available"
    },
    {
      id: "twilio",
      name: "Twilio",
      category: "Communication",
      description: "Send SMS and make phone calls",
      icon: "fas fa-phone",
      color: "bg-red-600",
      status: "available"
    },
    {
      id: "shopify",
      name: "Shopify",
      category: "E-commerce",
      description: "Manage products and orders",
      icon: "fab fa-shopify",
      color: "bg-green-600",
      status: "coming-soon"
    },
    {
      id: "salesforce",
      name: "Salesforce",
      category: "CRM",
      description: "Manage leads and customer data",
      icon: "fab fa-salesforce",
      color: "bg-blue-700",
      status: "coming-soon"
    }
  ];

  const customApis = [
    {
      id: "weather-api",
      name: "Weather API",
      description: "Get weather information for any location",
      endpoint: "https://api.weather.com",
      status: "active"
    },
    {
      id: "crm-api",
      name: "Custom CRM API",
      description: "Internal customer management system",
      endpoint: "https://api.company.com/crm",
      status: "active"
    }
  ];

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const categories = [...new Set(builtinTools.map(tool => tool.category))];

  return (
    <div className="space-y-6">
      {/* Selected Tools Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-check-circle text-primary"></i>
            Selected Tools ({selectedTools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map(toolId => {
              const tool = builtinTools.find(t => t.id === toolId);
              return tool ? (
                <Badge key={toolId} className="flex items-center gap-2 px-3 py-1">
                  <i className={tool.icon}></i>
                  {tool.name}
                  <button 
                    onClick={() => toggleTool(toolId)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`remove-tool-${toolId}`}
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
            {selectedTools.length === 0 && (
              <p className="text-muted-foreground">No tools selected</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tool Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-tools text-primary"></i>
            Tool Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builtin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builtin" data-testid="tab-builtin-tools">
                Built-in Tools
              </TabsTrigger>
              <TabsTrigger value="integrations" data-testid="tab-integrations">
                Integrations
              </TabsTrigger>
              <TabsTrigger value="custom" data-testid="tab-custom-apis">
                Custom APIs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builtin" className="space-y-4">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {builtinTools
                      .filter(tool => tool.category === category)
                      .map(tool => (
                        <Card 
                          key={tool.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTools.includes(tool.id) ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => toggleTool(tool.id)}
                          data-testid={`tool-card-${tool.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center text-white`}>
                                <i className={tool.icon}></i>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{tool.name}</h4>
                                  {selectedTools.includes(tool.id) && (
                                    <i className="fas fa-check text-primary"></i>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map(integration => (
                  <Card key={integration.id} className="cursor-pointer hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center text-white`}>
                          <i className={integration.icon}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{integration.name}</h4>
                            <Badge 
                              variant={integration.status === "available" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {integration.status === "available" ? "Available" : "Coming Soon"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {integration.description}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {integration.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Custom API Endpoints</h3>
                <Dialog open={showCustomApiDialog} onOpenChange={setShowCustomApiDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-custom-api">
                      <i className="fas fa-plus mr-2"></i>
                      Add Custom API
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom API</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api-name">API Name</Label>
                        <Input 
                          id="api-name" 
                          placeholder="My Custom API"
                          data-testid="input-custom-api-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="api-endpoint">Base URL</Label>
                        <Input 
                          id="api-endpoint" 
                          placeholder="https://api.example.com"
                          data-testid="input-custom-api-endpoint"
                        />
                      </div>
                      <div>
                        <Label htmlFor="api-auth">Authentication</Label>
                        <Input 
                          id="api-auth" 
                          placeholder="Bearer token, API key, etc."
                          data-testid="input-custom-api-auth"
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => setShowCustomApiDialog(false)}
                        data-testid="button-save-custom-api"
                      >
                        Add API
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {customApis.map(api => (
                  <div key={api.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <i className="fas fa-code text-muted-foreground"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{api.name}</h4>
                        <Badge variant={api.status === "active" ? "default" : "secondary"}>
                          {api.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{api.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{api.endpoint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-api-${api.id}`}>
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-delete-api-${api.id}`}>
                        <i className="fas fa-trash text-destructive"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tool Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-primary"></i>
            Tool Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Parallel Tool Execution</Label>
              <p className="text-sm text-muted-foreground">
                Allow agent to use multiple tools simultaneously
              </p>
            </div>
            <Switch data-testid="switch-parallel-execution" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Tool Call Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Maximum time to wait for tool responses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue="30" 
                className="w-20"
                data-testid="input-tool-timeout"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Retry Failed Tool Calls</Label>
              <p className="text-sm text-muted-foreground">
                Automatically retry failed tool executions
              </p>
            </div>
            <Switch data-testid="switch-retry-tools" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}