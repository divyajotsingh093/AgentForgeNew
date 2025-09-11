import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Template, Project } from "@shared/schema";

interface TemplateInstantiationModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
}

export default function TemplateInstantiationModal({ 
  template, 
  open, 
  onClose 
}: TemplateInstantiationModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    name: "",
    description: "",
    projectId: "",
    export_target: "notion",
    notion_database_id: "",
    secrets: {}
  });

  // Get user's projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: open,
  });

  // Create a new project when needed
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const response = await apiRequest('POST', '/api/projects', {
        name: data.name,
        slug: slug,
        description: data.description
      });
      return await response.json();
    },
    onSuccess: (newProject: any) => {
      toast({
        title: "Project Created!",
        description: "New project created. You can now configure your workflow.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setConfig({...config, projectId: newProject.id});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create project",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const instantiateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/templates/${template?.id}/instantiate`, data);
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Template Instantiated!",
        description: "Your workflow has been created successfully.",
      });
      
      // Navigate to the flow builder with the new flow
      navigate(`/flow/${result.flowId}`);
      onClose();
      
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create workflow",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleInstantiate = () => {
    if (!config.projectId) {
      if (projects.length === 0) {
        toast({
          title: "Create a Project First",
          description: "Please create a project above to continue",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Project Required",
          description: "Please select a project for your workflow",
          variant: "destructive",
        });
      }
      return;
    }

    const instantiationConfig: any = {
      projectId: config.projectId,
      name: config.name || `${template?.name} - ${new Date().toLocaleDateString()}`,
      description: config.description || template?.description,
      config: {
        export_target: config.export_target,
      }
    };

    // Add Notion configuration if provided
    if (config.notion_database_id) {
      instantiationConfig.config.notion_database_id = config.notion_database_id;
    }

    // Add secrets if any are provided
    const secrets: any = {};
    if (config.notion_database_id) {
      secrets.NOTION_DB_ID = config.notion_database_id;
    }
    
    if (Object.keys(secrets).length > 0) {
      instantiationConfig.config.secrets = secrets;
    }

    instantiateMutation.mutate(instantiationConfig);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create {template.name} Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Description */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>

          {/* Basic Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              {projects.length > 0 ? (
                <Select value={config.projectId} onValueChange={(value) => setConfig({...config, projectId: value})}>
                  <SelectTrigger data-testid="select-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground">
                    You don't have any projects yet. Create your first project to continue.
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Project name (e.g., My AI Assistant)"
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      data-testid="input-quick-project-name"
                    />
                    <Button 
                      onClick={() => {
                        if (!config.name.trim()) {
                          toast({
                            title: "Project name required",
                            description: "Please enter a name for your project",
                            variant: "destructive",
                          });
                          return;
                        }
                        createProjectMutation.mutate({
                          name: config.name || "My AI Project",
                          description: `Project for ${template?.name} workflow`
                        });
                      }}
                      disabled={createProjectMutation.isPending}
                      data-testid="button-create-quick-project"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
                placeholder={`${template.name} - ${new Date().toLocaleDateString()}`}
                data-testid="input-workflow-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig({...config, description: e.target.value})}
                placeholder={template.description || "Describe your workflow..."}
                data-testid="textarea-description"
              />
            </div>
          </div>

          {/* Meeting Action Template Specific Configuration */}
          {template.name.includes("Meeting") && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Meeting Action Configuration</h4>
              
              <div>
                <Label htmlFor="export-target">Export Target</Label>
                <Select value={config.export_target} onValueChange={(value) => setConfig({...config, export_target: value})}>
                  <SelectTrigger data-testid="select-export-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notion">Notion</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.export_target === "notion" && (
                <div>
                  <Label htmlFor="notion-db">Notion Database ID</Label>
                  <Input
                    id="notion-db"
                    value={config.notion_database_id}
                    onChange={(e) => setConfig({...config, notion_database_id: e.target.value})}
                    placeholder="Enter your Notion database ID"
                    data-testid="input-notion-database-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: If provided, tasks will be automatically exported to this Notion database
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleInstantiate}
              disabled={instantiateMutation.isPending}
              data-testid="button-create-workflow"
            >
              {instantiateMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}