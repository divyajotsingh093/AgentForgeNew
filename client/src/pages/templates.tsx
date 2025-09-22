import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import TemplateInstantiationModal from "@/components/modals/template-instantiation-modal";
import type { Template } from "@shared/schema";

export default function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showInstantiationModal, setShowInstantiationModal] = useState(false);

  // Fetch templates from API
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowInstantiationModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
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
                <h1 className="text-3xl font-bold">Templates</h1>
                <p className="text-muted-foreground mt-1">
                  Pre-built agent workflows ready to deploy
                </p>
              </div>
              <Button data-testid="button-create-template">
                <i className="fas fa-plus mr-2"></i>
                Create Template
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-template-count">
                    {templates.length}
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
                    3
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-downloads">
                    47
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Template Categories */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Browse Templates</h2>
              
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTemplateClick(template)}
                      data-testid={`card-template-${template.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="secondary" className="mt-2">
                              {template.category || 'General'}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`button-menu-${template.id}`}>
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {template.description}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Type: </span>
                            <span className="font-medium">
                              Multi-Agent Workflow
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Complexity: </span>
                            <span className="font-medium">
                              Advanced
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Created {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Recently'}
                          </div>
                          <Button size="sm" data-testid={`button-use-${template.id}`}>
                            Use Template
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
                      <i className="fas fa-layer-group text-2xl text-muted-foreground"></i>
                    </div>
                    <h3 className="font-semibold mb-2">No templates available</h3>
                    <p className="text-muted-foreground mb-4">
                      Templates help you get started with pre-built workflows
                    </p>
                    <Button data-testid="button-browse-marketplace">
                      Browse Marketplace
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Template Instantiation Modal */}
      {selectedTemplate && (
        <TemplateInstantiationModal
          open={showInstantiationModal}
          onClose={() => setShowInstantiationModal(false)}
          template={selectedTemplate}
        />
      )}
    </div>
  );
}