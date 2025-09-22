import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import TemplateInstantiationModal from "@/components/modals/template-instantiation-modal";
import type { Template, Agent, Project } from "@shared/schema";

interface ComponentLibraryProps {
  onClose?: () => void;
  projectId?: string;
}

export default function ComponentLibrary({ onClose, projectId }: ComponentLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showInstantiationModal, setShowInstantiationModal] = useState(false);

  // Fetch real templates from API
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Fetch user's projects to get the first project if no projectId provided
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !projectId,
  });

  // Use provided projectId or fall back to first project
  const effectiveProjectId = projectId || (projects.length > 0 ? projects[0].id : '');

  // Fetch published agents for multi-agent workflows
  const { data: publishedAgents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/projects", effectiveProjectId, "agents"],
    enabled: !!effectiveProjectId,
  });

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowInstantiationModal(true);
  };

  const agents = [
    {
      id: "transcriber",
      name: "Transcriber",
      description: "Convert audio to text",
      icon: "fas fa-microphone"
    },
    {
      id: "summarizer", 
      name: "Summarizer",
      description: "Create meeting summaries",
      icon: "fas fa-file-alt"
    },
    {
      id: "action-extractor",
      name: "Action Extractor", 
      description: "Extract actionable items",
      icon: "fas fa-tasks"
    },
    {
      id: "publisher",
      name: "Publisher",
      description: "Format and share results", 
      icon: "fas fa-share"
    }
  ];

  const tools = [
    {
      id: "notion-tasks",
      name: "Notion Tasks",
      description: "Create tasks in Notion",
      icon: "fab fa-notion"
    },
    {
      id: "slack-message",
      name: "Slack Message", 
      description: "Send to Slack channel",
      icon: "fab fa-slack"
    },
    {
      id: "http-webhook",
      name: "HTTP Webhook",
      description: "Custom API calls",
      icon: "fas fa-globe"
    }
  ];

  // Templates are now fetched from API above

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Component Library</h3>
            <p className="text-sm text-muted-foreground mt-1">Drag to add to your flow</p>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="lg:hidden"
              data-testid="button-close-components"
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </Button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto">
        {/* Multi Agent Section - Published Agents */}
        {publishedAgents.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Multi Agent
              </h4>
              <span className="text-xs text-muted-foreground">
                {publishedAgents.length} published
              </span>
            </div>
            
            <div className="space-y-2">
              {publishedAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="p-3 cursor-grab hover:border-primary transition-colors bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"
                  draggable
                  data-testid={`published-agent-${agent.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
                        <i className="fas fa-robot text-white text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{agent.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Template Agents Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Template Agents
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary hover:underline p-0 h-auto"
              data-testid="button-new-agent"
            >
              + New
            </Button>
          </div>
          
          <div className="space-y-2">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="p-3 cursor-grab hover:border-primary transition-colors"
                draggable
                data-testid={`template-agent-${agent.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-md flex items-center justify-center">
                      <i className={`${agent.icon} text-secondary text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Tools
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary hover:underline p-0 h-auto"
              data-testid="button-add-tool"
            >
              + Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className="p-3 cursor-grab hover:border-primary transition-colors"
                draggable
                data-testid={`tool-${tool.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-md flex items-center justify-center">
                      <i className={`${tool.icon} text-accent text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Templates Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Templates
            </h4>
          </div>
          
          <div className="space-y-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleTemplateClick(template)}
                data-testid={`template-${template.id}`}
              >
                <CardContent className="p-0">
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

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
  );
}
