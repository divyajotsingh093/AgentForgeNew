import { Button } from "@/components/ui/button";

interface HeaderProps {
  onTextToAgent?: () => void;
  onRunFlow?: () => void;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ onTextToAgent, onRunFlow, onMenuToggle, showMenuButton }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden"
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars"></i>
            </Button>
          )}
          
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">Projects</span>
            <i className="fas fa-chevron-right text-xs text-muted-foreground hidden sm:inline"></i>
            <span className="text-muted-foreground hidden sm:inline">Meeting Orchestrator</span>
            <i className="fas fa-chevron-right text-xs text-muted-foreground hidden sm:inline"></i>
            <span className="font-medium">Flow Builder</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Text-to-Agent Button */}
          {onTextToAgent && (
            <Button 
              onClick={onTextToAgent}
              className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 bg-secondary text-secondary-foreground hover:opacity-90"
              size="sm"
              data-testid="button-text-to-agent"
            >
              <i className="fas fa-magic text-sm"></i>
              <span className="font-medium hidden sm:inline">Text to Agent</span>
              <span className="sm:hidden">Text</span>
            </Button>
          )}
          
          {/* Run Flow Button */}
          {onRunFlow && (
            <Button 
              onClick={onRunFlow}
              className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
              size="sm"
              data-testid="button-run-flow"
            >
              <i className="fas fa-play text-sm"></i>
              <span className="font-medium hidden sm:inline">Run Flow</span>
              <span className="sm:hidden">Run</span>
            </Button>
          )}
          
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
