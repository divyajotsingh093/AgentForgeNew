import { Button } from "@/components/ui/button";

interface HeaderProps {
  onTextToAgent?: () => void;
  onRunFlow?: () => void;
}

export default function Header({ onTextToAgent, onRunFlow }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Projects</span>
            <i className="fas fa-chevron-right text-xs text-muted-foreground"></i>
            <span className="text-muted-foreground">Meeting Orchestrator</span>
            <i className="fas fa-chevron-right text-xs text-muted-foreground"></i>
            <span className="font-medium">Flow Builder</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Text-to-Agent Button */}
          <Button 
            onClick={onTextToAgent}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:opacity-90"
            data-testid="button-text-to-agent"
          >
            <i className="fas fa-magic text-sm"></i>
            <span className="font-medium">Text to Agent</span>
          </Button>
          
          {/* Run Flow Button */}
          <Button 
            onClick={onRunFlow}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
            data-testid="button-run-flow"
          >
            <i className="fas fa-play text-sm"></i>
            <span className="font-medium">Run Flow</span>
          </Button>
          
          {/* More Actions */}
          <Button 
            variant="ghost"
            size="sm"
            className="p-2"
            data-testid="button-more-actions"
          >
            <i className="fas fa-ellipsis-v text-muted-foreground"></i>
          </Button>
        </div>
      </div>
    </header>
  );
}
