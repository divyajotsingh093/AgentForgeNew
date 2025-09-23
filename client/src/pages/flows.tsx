import { useState } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Flow, Agent, Project, Step, InsertFlow } from "@shared/schema";
import { insertFlowSchema } from "@shared/schema";

const createFlowSchema = insertFlowSchema.omit({ projectId: true }).extend({
  name: z.string().min(1, "Flow name is required"),
  description: z.string().optional(),
});

type CreateFlowData = z.infer<typeof createFlowSchema>;

export default function Flows() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Get user's projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const projectId = projects.length > 0 ? projects[0].id : null;

  // Get flows for the project
  const { data: flows = [], isLoading: flowsLoading } = useQuery<Flow[]>({
    queryKey: ["/api/projects", projectId, "flows"],
    enabled: !!projectId,
  });

  // Get agents for the project
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/projects", projectId, "agents"],
    enabled: !!projectId,
  });

  // Get steps for all flows using useQueries to avoid dynamic hook issues
  const stepsQueries = useQueries({
    queries: flows.map(flow => ({
      queryKey: ["/api/flows", flow.id, "steps"],
      enabled: !!flow.id,
    }))
  });

  // Check if all steps queries are settled (either success or error)
  const allStepsLoaded = stepsQueries.every(q => q.status === 'success' || q.status === 'error');

  // Combine all steps data
  const allStepsData = flows.map((flow, index) => ({
    flowId: flow.id,
    steps: stepsQueries[index]?.data || []
  }));

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (data: CreateFlowData) => {
      if (!projectId) {
        throw new Error("No project selected. Please create a project first.");
      }
      const response = await apiRequest("POST", `/api/projects/${projectId}/flows`, data);
      return await response.json();
    },
    onSuccess: (newFlow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "flows"] });
      setShowCreateFlow(false);
      toast({
        title: "Flow Created",
        description: `Flow "${newFlow.name}" has been created successfully.`,
      });
      // Navigate to the flow builder
      setLocation(`/flow-builder/${newFlow.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create flow",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateFlowData>({
    resolver: zodResolver(createFlowSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Organize flows by agents (only when all steps are loaded to avoid flicker)
  const flowsByAgent: Record<string, { agent: Agent; flows: Flow[] }> = allStepsLoaded ? agents.reduce((acc, agent) => {
    const agentFlows = flows.filter(flow => {
      const flowSteps = allStepsData.find(data => data.flowId === flow.id)?.steps || [];
      return flowSteps.some((step: Step) => step.kind === 'agent' && step.refId === agent.id);
    });
    
    if (agentFlows.length > 0) {
      acc[agent.id] = {
        agent,
        flows: agentFlows
      };
    }
    
    return acc;
  }, {} as Record<string, { agent: Agent; flows: Flow[] }>) : {};

  // Flows that don't use any agents (only when all steps are loaded)
  const unassignedFlows: Flow[] = allStepsLoaded ? flows.filter(flow => {
    const flowSteps = allStepsData.find(data => data.flowId === flow.id)?.steps || [];
    return !flowSteps.some((step: Step) => step.kind === 'agent');
  }) : [];

  const handleCreateFlow = (data: CreateFlowData) => {
    createFlowMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Flows</h1>
              <p className="text-muted-foreground">
                Manage your agent workflows organized by agents
              </p>
            </div>
            
            <Dialog open={showCreateFlow} onOpenChange={setShowCreateFlow}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!projectId}
                  data-testid="button-create-flow"
                  title={!projectId ? "Please create a project first" : "Create new flow"}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create New Flow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flow</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateFlow)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flow Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter flow name..." 
                              {...field}
                              data-testid="input-flow-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this flow does..."
                              {...field}
                              data-testid="input-flow-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateFlow(false)}
                        data-testid="button-cancel-create"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFlowMutation.isPending}
                        data-testid="button-submit-create"
                      >
                        {createFlowMutation.isPending ? "Creating..." : "Create Flow"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {flowsLoading || !allStepsLoaded ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  {flowsLoading ? "Loading flows..." : "Loading flow details..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Flows by Agent */}
              {Object.values(flowsByAgent).map(({ agent, flows: agentFlows }) => (
                <div key={agent.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <i className="fas fa-user text-primary text-sm"></i>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" data-testid={`agent-name-${agent.id}`}>
                        {agent.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {agentFlows.length} flow{agentFlows.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                    {agentFlows.map((flow) => {
                      const flowSteps = allStepsData.find(data => data.flowId === flow.id)?.steps || [];
                      
                      return (
                        <Card 
                          key={flow.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setLocation(`/flow-builder/${flow.id}`)}
                          data-testid={`flow-card-${flow.id}`}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base" data-testid={`flow-title-${flow.id}`}>
                              {flow.name}
                            </CardTitle>
                            {flow.description && (
                              <p className="text-sm text-muted-foreground" data-testid={`flow-description-${flow.id}`}>
                                {flow.description}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" data-testid={`flow-steps-${flow.id}`}>
                                {allStepsLoaded ? `${flowSteps.length} steps` : "Loading..."}
                              </Badge>
                              <Badge variant="secondary" data-testid={`flow-version-${flow.id}`}>
                                v{flow.version}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Unassigned Flows */}
              {unassignedFlows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <i className="fas fa-cog text-muted-foreground text-sm"></i>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Tool-Only Flows</h2>
                      <p className="text-sm text-muted-foreground">
                        {unassignedFlows.length} flow{unassignedFlows.length !== 1 ? 's' : ''} without agents
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                    {unassignedFlows.map((flow) => {
                      const flowSteps = allStepsData.find(data => data.flowId === flow.id)?.steps || [];
                      
                      return (
                        <Card 
                          key={flow.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setLocation(`/flow-builder/${flow.id}`)}
                          data-testid={`flow-card-${flow.id}`}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base" data-testid={`flow-title-${flow.id}`}>
                              {flow.name}
                            </CardTitle>
                            {flow.description && (
                              <p className="text-sm text-muted-foreground" data-testid={`flow-description-${flow.id}`}>
                                {flow.description}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" data-testid={`flow-steps-${flow.id}`}>
                                {allStepsLoaded ? `${flowSteps.length} steps` : "Loading..."}
                              </Badge>
                              <Badge variant="secondary" data-testid={`flow-version-${flow.id}`}>
                                v{flow.version}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {flows.length === 0 && !flowsLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <i className="fas fa-project-diagram text-2xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {!projectId ? "No Project Found" : "No Flows Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {!projectId 
                      ? "Please create a project first to start building flows"
                      : "Create your first agent workflow to get started"
                    }
                  </p>
                  {projectId ? (
                    <Button onClick={() => setShowCreateFlow(true)} data-testid="button-create-first-flow">
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Flow
                    </Button>
                  ) : (
                    <Button onClick={() => setLocation("/agent-builder")} data-testid="button-create-project">
                      <i className="fas fa-folder-plus mr-2"></i>
                      Create Project
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}