import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Step, Agent, Tool, Project } from "@shared/schema";
import { insertStepSchema } from "@shared/schema";

const createStepSchema = insertStepSchema.omit({ flowId: true }).extend({
  kind: z.enum(['agent', 'tool']),
  refId: z.string().min(1, "Please select an agent or tool"),
  idx: z.coerce.number().min(0, "Step index must be non-negative"),
});

const editStepSchema = createStepSchema.partial();

type CreateStepData = z.infer<typeof createStepSchema>;
type EditStepData = z.infer<typeof editStepSchema>;

interface FlowCanvasProps {
  flow: any;
  steps: Step[];
  onStepsChange?: () => void;
}

export default function FlowCanvas({ flow, steps, onStepsChange }: FlowCanvasProps) {
  const { toast } = useToast();
  const [showAddStep, setShowAddStep] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);

  // Get user's projects to get agents and tools
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const projectId = flow?.projectId || (projects.length > 0 ? projects[0].id : null);

  // Get agents for the project
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/projects", projectId, "agents"],
    enabled: !!projectId,
  });

  // Get tools for the project
  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["/api/projects", projectId, "tools"],
    enabled: !!projectId,
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async (data: CreateStepData) => {
      const response = await apiRequest("POST", `/api/flows/${flow.id}/steps`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows", flow.id, "steps"] });
      setShowAddStep(false);
      toast({
        title: "Step Added",
        description: "Step has been added to the flow successfully.",
      });
      onStepsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add step",
        variant: "destructive",
      });
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      await apiRequest("DELETE", `/api/steps/${stepId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows", flow.id, "steps"] });
      toast({
        title: "Step Deleted",
        description: "Step has been removed from the flow.",
      });
      onStepsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete step",
        variant: "destructive",
      });
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: string; data: EditStepData }) => {
      const response = await apiRequest("PUT", `/api/steps/${stepId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows", flow.id, "steps"] });
      setEditingStep(null);
      toast({
        title: "Step Updated",
        description: "Step has been updated successfully.",
      });
      onStepsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update step",
        variant: "destructive",
      });
    },
  });

  const editForm = useForm<EditStepData>({
    resolver: zodResolver(editStepSchema),
    defaultValues: {
      kind: "agent",
      refId: "",
      idx: 0,
      config: {},
    },
  });

  const editSelectedKind = editForm.watch("kind");

  const form = useForm<CreateStepData>({
    resolver: zodResolver(createStepSchema),
    defaultValues: {
      kind: "agent",
      refId: "",
      idx: steps.length,
      config: {},
    },
  });

  const selectedKind = form.watch("kind");

  const handleAddStep = (data: CreateStepData) => {
    createStepMutation.mutate(data);
  };

  const handleDeleteStep = (stepId: string) => {
    deleteStepMutation.mutate(stepId);
  };

  const handleEditStep = (data: EditStepData) => {
    if (editingStep) {
      updateStepMutation.mutate({ stepId: editingStep.id, data });
    }
  };

  const startEditStep = (step: Step) => {
    setEditingStep(step);
    editForm.reset({
      kind: step.kind as "agent" | "tool",
      refId: step.refId,
      idx: step.idx,
      config: step.config || {},
    });
  };

  const getStepEntity = (step: Step) => {
    if (step.kind === 'agent') {
      return agents.find(a => a.id === step.refId);
    } else if (step.kind === 'tool') {
      return tools.find(t => t.id === step.refId);
    }
    return null;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent/10 text-accent';
      case 'waiting': return 'bg-muted text-muted-foreground'; 
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'conditional': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStepIcon = (kind: string, name: string) => {
    if (kind === 'agent') {
      if (name.includes('Transcriber')) return 'fas fa-microphone';
      if (name.includes('Summarizer')) return 'fas fa-file-alt';
      if (name.includes('Action')) return 'fas fa-tasks';
      if (name.includes('Publisher')) return 'fas fa-share';
      return 'fas fa-user';
    } else {
      if (name.includes('Notion')) return 'fab fa-notion';
      if (name.includes('Slack')) return 'fab fa-slack';
      return 'fas fa-tool';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Canvas Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" data-testid="flow-title">
              {flow.name}
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="flow-description">
              {flow.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className="bg-accent/10 text-accent"
              data-testid="step-count-badge"
            >
              {steps.length} Steps
            </Badge>
            <Badge 
              variant="outline"
              data-testid="last-run-badge"
            >
              Last run: 2m ago
            </Badge>
          </div>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-auto bg-muted/30 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Flow Input */}
          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-play text-primary"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium" data-testid="flow-input-title">Flow Input</h3>
                  <p className="text-sm text-muted-foreground">
                    Transcript, attendees, export target
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-configure-input"
                >
                  <i className="fas fa-cog text-muted-foreground"></i>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          {steps.map((step, index) => {
            const entity = getStepEntity(step);
            const stepName = entity?.name || `${step.kind} ${step.idx + 1}`;
            const stepDescription = entity?.description || `${step.kind} step`;
            
            return (
              <div key={step.id}>
                {/* Step Connector */}
                <div className="h-6 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-border"></div>
                </div>

                {/* Step Card */}
                <Card 
                  className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  data-testid={`step-${step.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${
                        step.kind === 'agent' ? 'bg-secondary/10' : 'bg-accent/10'
                      } rounded-lg flex items-center justify-center`}>
                        <i className={`${getStepIcon(step.kind, stepName)} ${
                          step.kind === 'agent' ? 'text-secondary' : 'text-accent'
                        }`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{stepName}</h3>
                          <Badge 
                            variant="outline"
                            data-testid={`step-kind-${step.id}`}
                          >
                            {step.kind}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {stepDescription}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditStep(step)}
                          data-testid={`button-edit-${step.id}`}
                        >
                          <i className="fas fa-edit text-muted-foreground"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteStep(step.id)}
                          data-testid={`button-delete-${step.id}`}
                        >
                          <i className="fas fa-trash text-muted-foreground"></i>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Step {step.idx + 1} • {step.kind} • {entity ? 'Configured' : 'Not Found'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Add Step Button */}
          <div>
            <div className="h-6 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-border"></div>
            </div>
            
            <Card className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-4 flex items-center gap-3 justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAddStep(true)}
                  data-testid="button-add-step"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <div className="font-medium">Add Step</div>
                    <div className="text-sm">Add an agent or tool to your flow</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Flow Output */}
          <div>
            <div className="h-6 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-border"></div>
            </div>
            
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-flag-checkered text-primary"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium" data-testid="flow-output-title">Flow Output</h3>
                    <p className="text-sm text-muted-foreground">
                      Final report with action items and confirmations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Step to Flow</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStep)} className="space-y-4">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Type</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={(value: "agent" | "tool") => {
                          field.onChange(value);
                          form.setValue("refId", ""); // Reset selection when changing type
                        }}
                      >
                        <SelectTrigger data-testid="select-step-kind">
                          <SelectValue placeholder="Select step type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="refId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedKind === 'agent' ? 'Select Agent' : 'Select Tool'}
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-step-ref">
                          <SelectValue placeholder={`Select ${selectedKind}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedKind === 'agent' 
                            ? agents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.name}
                                </SelectItem>
                              ))
                            : tools.map(tool => (
                                <SelectItem key={tool.id} value={tool.id}>
                                  {tool.name}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="idx"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Position</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max={steps.length}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-step-index"
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
                  onClick={() => setShowAddStep(false)}
                  data-testid="button-cancel-add-step"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStepMutation.isPending}
                  data-testid="button-submit-add-step"
                >
                  {createStepMutation.isPending ? "Adding..." : "Add Step"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Step</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditStep)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Type</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={(value: "agent" | "tool") => {
                          field.onChange(value);
                          editForm.setValue("refId", ""); // Reset selection when changing type
                        }}
                      >
                        <SelectTrigger data-testid="select-edit-step-kind">
                          <SelectValue placeholder="Select step type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="refId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editSelectedKind === 'agent' ? 'Select Agent' : 'Select Tool'}
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-edit-step-ref">
                          <SelectValue placeholder={`Select ${editSelectedKind}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {editSelectedKind === 'agent' 
                            ? agents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.name}
                                </SelectItem>
                              ))
                            : tools.map(tool => (
                                <SelectItem key={tool.id} value={tool.id}>
                                  {tool.name}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="idx"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Position</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max={steps.length - 1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-edit-step-index"
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
                  onClick={() => setEditingStep(null)}
                  data-testid="button-cancel-edit-step"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateStepMutation.isPending}
                  data-testid="button-submit-edit-step"
                >
                  {updateStepMutation.isPending ? "Updating..." : "Update Step"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
