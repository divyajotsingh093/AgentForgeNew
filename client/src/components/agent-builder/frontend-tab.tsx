import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface FrontendTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function FrontendTab({ agentData, setAgentData }: FrontendTabProps) {
  const [uiComponents, setUiComponents] = useState([
    {
      id: "input-form",
      type: "form",
      name: "User Input Form",
      description: "Collect user requirements",
      config: { fields: 3, validation: true }
    },
    {
      id: "results-display",
      type: "dashboard",
      name: "Results Dashboard",
      description: "Display agent outputs",
      config: { charts: 2, tables: 1 }
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState("chat");

  const uiTemplates = [
    {
      id: "chat",
      name: "Chat Interface",
      description: "Clean chat-based interaction",
      icon: "fas fa-comments",
      preview: "/api/placeholder/chat-preview.png"
    },
    {
      id: "form",
      name: "Form-based",
      description: "Structured input forms",
      icon: "fas fa-wpforms",
      preview: "/api/placeholder/form-preview.png"
    },
    {
      id: "dashboard",
      name: "Analytics Dashboard",
      description: "Data visualization and insights",
      icon: "fas fa-chart-bar",
      preview: "/api/placeholder/dashboard-preview.png"
    },
    {
      id: "wizard",
      name: "Step-by-step Wizard",
      description: "Guided multi-step process",
      icon: "fas fa-list-ol",
      preview: "/api/placeholder/wizard-preview.png"
    }
  ];

  const componentTypes = [
    { id: "text-input", name: "Text Input", icon: "fas fa-edit", category: "Input" },
    { id: "textarea", name: "Text Area", icon: "fas fa-align-left", category: "Input" },
    { id: "select", name: "Dropdown", icon: "fas fa-chevron-down", category: "Input" },
    { id: "checkbox", name: "Checkbox", icon: "fas fa-check-square", category: "Input" },
    { id: "file-upload", name: "File Upload", icon: "fas fa-upload", category: "Input" },
    { id: "button", name: "Button", icon: "fas fa-hand-pointer", category: "Action" },
    { id: "text-display", name: "Text Display", icon: "fas fa-font", category: "Display" },
    { id: "image", name: "Image", icon: "fas fa-image", category: "Display" },
    { id: "chart", name: "Chart", icon: "fas fa-chart-line", category: "Display" },
    { id: "table", name: "Data Table", icon: "fas fa-table", category: "Display" },
    { id: "card", name: "Info Card", icon: "fas fa-id-card", category: "Layout" },
    { id: "tabs", name: "Tabs", icon: "fas fa-folder", category: "Layout" }
  ];

  const addComponent = (componentType: string) => {
    const newComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      name: `New ${componentType.replace('-', ' ')}`,
      description: "Click to configure",
      config: {}
    };
    setUiComponents([...uiComponents, newComponent]);
  };

  const removeComponent = (id: string) => {
    setUiComponents(uiComponents.filter(comp => comp.id !== id));
  };

  const getComponentIcon = (type: string) => {
    const component = componentTypes.find(c => c.id === type);
    return component ? component.icon : "fas fa-square";
  };

  return (
    <div className="space-y-6">
      {/* Frontend Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-desktop text-primary"></i>
            Frontend Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Custom Frontend</Label>
                <p className="text-sm text-muted-foreground">
                  Create a custom UI for your agent
                </p>
              </div>
              <Switch data-testid="switch-enable-frontend" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Public Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow public access to agent UI
                </p>
              </div>
              <Switch data-testid="switch-public-access" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Responsive Design</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize for mobile devices
                </p>
              </div>
              <Switch data-testid="switch-responsive" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-palette text-primary"></i>
            UI Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {uiTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
                data-testid={`ui-template-${template.id}`}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                      <i className={`${template.icon} text-2xl text-muted-foreground`}></i>
                    </div>
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {selectedTemplate === template.id && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* UI Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-th-large text-primary"></i>
            UI Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="components" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components" data-testid="tab-ui-components">
                Components
              </TabsTrigger>
              <TabsTrigger value="layout" data-testid="tab-ui-layout">
                Layout
              </TabsTrigger>
              <TabsTrigger value="styling" data-testid="tab-ui-styling">
                Styling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="space-y-4">
              {/* Component Library */}
              <div>
                <h3 className="font-medium mb-3">Available Components</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {componentTypes.map((component) => (
                    <Button
                      key={component.id}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2"
                      onClick={() => addComponent(component.id)}
                      data-testid={`add-component-${component.id}`}
                    >
                      <i className={`${component.icon} text-lg`}></i>
                      <span className="text-xs text-center">{component.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Current Components */}
              <div>
                <h3 className="font-medium mb-3">Current Components ({uiComponents.length})</h3>
                <div className="space-y-2">
                  {uiComponents.map((component) => (
                    <div key={component.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <i className={`${getComponentIcon(component.type)} text-muted-foreground`}></i>
                      <div className="flex-1">
                        <div className="font-medium">{component.name}</div>
                        <div className="text-sm text-muted-foreground">{component.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" data-testid={`configure-component-${component.id}`}>
                          <i className="fas fa-cog"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeComponent(component.id)}
                          data-testid={`remove-component-${component.id}`}
                        >
                          <i className="fas fa-trash text-destructive"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {uiComponents.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No components added yet. Click on components above to add them.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="layout-type">Layout Type</Label>
                  <Select>
                    <SelectTrigger data-testid="select-layout-type">
                      <SelectValue placeholder="Choose layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-column">Single Column</SelectItem>
                      <SelectItem value="two-column">Two Column</SelectItem>
                      <SelectItem value="three-column">Three Column</SelectItem>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="custom">Custom Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-width">Max Width</Label>
                  <Select>
                    <SelectTrigger data-testid="select-max-width">
                      <SelectValue placeholder="Choose width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Width</SelectItem>
                      <SelectItem value="container">Container (1200px)</SelectItem>
                      <SelectItem value="medium">Medium (800px)</SelectItem>
                      <SelectItem value="small">Small (600px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="spacing">Component Spacing</Label>
                  <Select>
                    <SelectTrigger data-testid="select-spacing">
                      <SelectValue placeholder="Choose spacing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="loose">Loose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="alignment">Content Alignment</Label>
                  <Select>
                    <SelectTrigger data-testid="select-alignment">
                      <SelectValue placeholder="Choose alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="styling" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="color-scheme">Color Scheme</Label>
                  <Select>
                    <SelectTrigger data-testid="select-color-scheme">
                      <SelectValue placeholder="Choose colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue Theme</SelectItem>
                      <SelectItem value="green">Green Theme</SelectItem>
                      <SelectItem value="purple">Purple Theme</SelectItem>
                      <SelectItem value="custom">Custom Colors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select>
                    <SelectTrigger data-testid="select-font-family">
                      <SelectValue placeholder="Choose font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Select>
                    <SelectTrigger data-testid="select-border-radius">
                      <SelectValue placeholder="Choose roundness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sharp (0px)</SelectItem>
                      <SelectItem value="small">Small (4px)</SelectItem>
                      <SelectItem value="medium">Medium (8px)</SelectItem>
                      <SelectItem value="large">Large (12px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shadow">Shadow Style</Label>
                  <Select>
                    <SelectTrigger data-testid="select-shadow">
                      <SelectValue placeholder="Choose shadow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Shadow</SelectItem>
                      <SelectItem value="small">Small Shadow</SelectItem>
                      <SelectItem value="medium">Medium Shadow</SelectItem>
                      <SelectItem value="large">Large Shadow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  placeholder="/* Add your custom CSS here */
.agent-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}"
                  rows={6}
                  className="font-mono text-sm"
                  data-testid="textarea-custom-css"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview & Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-eye text-primary"></i>
            Preview & Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Frontend URL</h3>
              <p className="text-sm text-muted-foreground">
                Your agent will be accessible at this URL
              </p>
            </div>
            <Badge variant="outline" className="font-mono">
              /agent/my-agent-ui
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-preview-frontend">
              <i className="fas fa-eye mr-2"></i>
              Preview
            </Button>
            <Button data-testid="button-deploy-frontend">
              <i className="fas fa-rocket mr-2"></i>
              Deploy Frontend
            </Button>
            <Button variant="outline" data-testid="button-export-code">
              <i className="fas fa-download mr-2"></i>
              Export Code
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-1"></i>
              <div className="text-sm">
                <p className="font-medium">Preview Mode Active</p>
                <p className="text-muted-foreground">
                  Your frontend is currently in preview mode. Deploy to make it publicly accessible.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}