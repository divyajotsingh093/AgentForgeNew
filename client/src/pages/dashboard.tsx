import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TemplateInstantiationModal from "@/components/modals/template-instantiation-modal";
import { apiRequest } from "@/lib/queryClient";
import type { Template } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showInstantiationModal, setShowInstantiationModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: ""
  });

  // Fetch real templates from API
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowInstantiationModal(true);
  };

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
    onSuccess: () => {
      toast({
        title: "Project Created!",
        description: "Your new project has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowProjectModal(false);
      setProjectForm({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create project",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!projectForm.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(projectForm);
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects, isLoading: projectsLoading, error } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || projectsLoading) {
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
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground mt-1">
                  Build and manage your AI agent workflows
                </p>
              </div>
              <Button 
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => setShowProjectModal(true)}
                data-testid="button-new-project"
              >
                <i className="fas fa-plus mr-2"></i>
                New Project
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-project-count">
                    {projects?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Flows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-flow-count">0</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Runs Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-run-count">0</div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Projects</h2>
                <Button variant="outline" size="sm" data-testid="button-view-all">
                  View All
                </Button>
              </div>

              {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: any) => (
                    <Card 
                      key={project.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      data-testid={`card-project-${project.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {project.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          <Button size="sm" variant="outline">
                            Open
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
                      <i className="fas fa-project-diagram text-2xl text-muted-foreground"></i>
                    </div>
                    <h3 className="font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first project to start building agent workflows
                    </p>
                    <Button 
                      className="bg-primary text-primary-foreground hover:opacity-90"
                      data-testid="button-create-first-project"
                    >
                      Create Your First Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Popular Templates</h2>
                <Button variant="outline" size="sm" data-testid="button-browse-templates">
                  Browse All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.length > 0 ? (
                  templates.map((template) => {
                    // Template icon mapping
                    const getTemplateIcon = (name: string) => {
                      if (name.includes('Meeting')) return 'fas fa-users text-primary';
                      if (name.includes('Invoice')) return 'fas fa-file-invoice text-secondary';
                      if (name.includes('Content')) return 'fas fa-edit text-accent';
                      return 'fas fa-cogs text-muted-foreground';
                    };
                    
                    const getBgClass = (name: string) => {
                      if (name.includes('Meeting')) return 'bg-primary/10';
                      if (name.includes('Invoice')) return 'bg-secondary/10';
                      if (name.includes('Content')) return 'bg-accent/10';
                      return 'bg-muted/10';
                    };
                    
                    return (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow" 
                        onClick={() => handleTemplateClick(template)}
                        data-testid={`card-template-${template.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getBgClass(template.name)} rounded-lg flex items-center justify-center`}>
                              <i className={getTemplateIcon(template.name)}></i>
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Creation Modal */}
            <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                      placeholder="My AI Project"
                      data-testid="input-project-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                      placeholder="Describe your project..."
                      rows={3}
                      data-testid="textarea-project-description"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowProjectModal(false)}
                      data-testid="button-cancel-project"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateProject}
                      disabled={createProjectMutation.isPending}
                      data-testid="button-create-project"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Template Instantiation Modal */}
            <TemplateInstantiationModal
              template={selectedTemplate}
              open={showInstantiationModal}
              onClose={() => {
                setShowInstantiationModal(false);
                setSelectedTemplate(null);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
