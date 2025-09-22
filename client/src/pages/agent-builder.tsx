import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { insertAgentSchema, type InsertAgent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ObjectivesTab from "@/components/agent-builder/objectives-tab";
import KnowledgeTab from "@/components/agent-builder/knowledge-tab";
import ToolsTab from "@/components/agent-builder/tools-tab";
import DataFabricTab from "@/components/agent-builder/data-fabric-tab";
import FrontendTab from "@/components/agent-builder/frontend-tab";
import TriggersTab from "@/components/agent-builder/triggers-tab";
import AgentPreview from "@/components/agent-builder/agent-preview";

// Create extended form schema with all the UI state
const agentFormSchema = insertAgentSchema.extend({
  // Add UI-specific fields that aren't in the database schema
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.string()
  })).optional(),
  fewShotExamples: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  presencePenalty: z.number().optional()
});

type AgentFormData = z.infer<typeof agentFormSchema>;

export default function AgentBuilder() {
  const { id, projectId } = useParams<{id?: string; projectId?: string}>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("objectives");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize form with default values
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "",
      userTemplate: "",
      fewShots: "",
      capabilities: {
        knowledge: false,
        tools: false,
        dataFabric: false,
        frontend: false,
        triggers: false
      },
      knowledgeBaseConfig: {},
      frontendConfig: {},
      triggerConfig: {},
      dataFabricConfig: {},
      projectId: projectId || ""
    }
  });

  // Fetch agent data if editing existing agent
  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["/api/agents", id],
    enabled: !!id,
    retry: false,
  });

  // Fetch current project to get projectId if not in URL
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !projectId && isAuthenticated
  });

  // Update form when agent data is loaded
  useEffect(() => {
    if (agent) {
      form.reset({
        ...agent,
        variables: [],
        fewShotExamples: agent.fewShots || ""
      });
    } else if (projects && projects.length > 0 && !projectId) {
      // If no projectId in URL, use the first project
      form.setValue('projectId', projects[0].id);
    }
  }, [agent, projects, form, projectId]);

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const { variables, fewShotExamples, maxTokens, temperature, topP, presencePenalty, ...agentData } = data;
      
      // Include few shots if provided
      if (fewShotExamples) {
        agentData.fewShots = fewShotExamples;
      }
      
      const effectiveProjectId = agentData.projectId || projectId;
      if (!effectiveProjectId) {
        throw new Error("Project ID is required");
      }
      
      const response = await apiRequest('POST', `/api/projects/${effectiveProjectId}/agents`, agentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agent Created",
        description: "Your agent has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/agent-builder/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create agent: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      if (!id) throw new Error("Agent ID is required for updates");
      
      const { variables, fewShotExamples, maxTokens, temperature, topP, presencePenalty, ...agentData } = data;
      
      // Include few shots if provided
      if (fewShotExamples) {
        agentData.fewShots = fewShotExamples;
      }
      
      const response = await apiRequest('PUT', `/api/agents/${id}`, agentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "Your agent has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update agent: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSaveAgent = form.handleSubmit((data) => {
    if (id) {
      updateAgentMutation.mutate(data);
    } else {
      createAgentMutation.mutate(data);
    }
  });

  const handlePreviewAgent = () => {
    setIsPreviewOpen(true);
  };

  const tabs = [
    {
      id: "objectives",
      label: "Objectives & Prompts",
      icon: "fas fa-target",
      description: "Define agent goals and prompt engineering"
    },
    {
      id: "knowledge",
      label: "Knowledge Management",
      icon: "fas fa-brain",
      description: "Upload files, URLs, and manage knowledge base"
    },
    {
      id: "tools",
      label: "Tools & Integrations", 
      icon: "fas fa-tools",
      description: "Select tools and configure integrations"
    },
    {
      id: "data-fabric",
      label: "Data Fabric",
      icon: "fas fa-database",
      description: "Connect data sources and configure mappings"
    },
    {
      id: "frontend",
      label: "Frontend Capabilities",
      icon: "fas fa-desktop",
      description: "Design custom UI and forms"
    },
    {
      id: "triggers",
      label: "Autonomous Triggers",
      icon: "fas fa-bolt",
      description: "Set up automated execution triggers"
    }
  ];

  if (isLoading || agentLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent builder...</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
        
        {/* Agent Builder Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold" data-testid="agent-builder-title">
                    {id ? "Edit Agent" : "Create New Agent"}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Build a comprehensive AI agent with advanced capabilities
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviewAgent}
                    data-testid="button-preview-agent"
                  >
                    <i className="fas fa-eye mr-2"></i>
                    Preview
                  </Button>
                  <Button 
                    onClick={handleSaveAgent}
                    disabled={createAgentMutation.isPending || updateAgentMutation.isPending}
                    data-testid="button-save-agent"
                  >
                    {(createAgentMutation.isPending || updateAgentMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Agent Overview Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-info-circle text-primary"></i>
                    Agent Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="agent-name">Agent Name *</Label>
                      <Input
                        {...form.register("name")}
                        id="agent-name"
                        placeholder="My Intelligent Agent"
                        data-testid="input-agent-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="agent-description">Description</Label>
                      <Input
                        {...form.register("description")}
                        id="agent-description"
                        placeholder="Brief description of what this agent does"
                        data-testid="input-agent-description"
                      />
                    </div>
                  </div>
                  
                  {/* Capabilities Overview */}
                  <div className="mt-6">
                    <Label className="text-sm font-medium">Enabled Capabilities</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(form.watch("capabilities") || {}).map(([key, enabled]) => (
                        <Badge 
                          key={key}
                          variant={enabled ? "default" : "secondary"}
                          className={enabled ? "bg-primary" : ""}
                          data-testid={`badge-capability-${key}`}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multi-Tab Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Tab Navigation */}
              <div className="border-b border-border">
                <TabsList className="h-auto p-0 bg-transparent">
                  <div className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                      <TabsTrigger 
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                        data-testid={`tab-${tab.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`${tab.icon} text-lg`}></i>
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground max-w-32 text-center">
                          {tab.description}
                        </span>
                      </TabsTrigger>
                    ))}
                  </div>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px]">
                <TabsContent value="objectives" className="space-y-6">
                  <ObjectivesTab />
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-6">
                  <KnowledgeTab />
                </TabsContent>

                <TabsContent value="tools" className="space-y-6">
                  <ToolsTab />
                </TabsContent>

                <TabsContent value="data-fabric" className="space-y-6">
                  <DataFabricTab />
                </TabsContent>

                <TabsContent value="frontend" className="space-y-6">
                  <FrontendTab />
                </TabsContent>

                <TabsContent value="triggers" className="space-y-6">
                  <TriggersTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
        </div>
      </div>
      
      {/* Agent Preview Modal */}
      <AgentPreview
        agentData={form.getValues()}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        agentId={id}
      />
    </FormProvider>
  );
}