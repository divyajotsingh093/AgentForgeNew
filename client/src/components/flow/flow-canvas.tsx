import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FlowCanvasProps {
  flow: any;
  steps: any[];
}

export default function FlowCanvas({ flow, steps }: FlowCanvasProps) {
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
          {steps.map((step, index) => (
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
                      <i className={`${getStepIcon(step.kind, step.name)} ${
                        step.kind === 'agent' ? 'text-secondary' : 'text-accent'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{step.name}</h3>
                        <Badge 
                          className={getStatusColor(step.status)}
                          data-testid={`step-status-${step.id}`}
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-edit-${step.id}`}
                      >
                        <i className="fas fa-edit text-muted-foreground"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-delete-${step.id}`}
                      >
                        <i className="fas fa-trash text-muted-foreground"></i>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Input: {step.input} → Output: {step.output}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

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
    </div>
  );
}
