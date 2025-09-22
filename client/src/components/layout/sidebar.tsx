import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-home" },
    { path: "/agent-builder", label: "Agent Builder", icon: "fas fa-robot" },
    { path: "/flow-builder", label: "Flow Builder", icon: "fas fa-project-diagram" },
    { path: "/agents", label: "Agents", icon: "fas fa-users" },
    { path: "/tools", label: "Tools", icon: "fas fa-tools" },
    { path: "/runs", label: "Runs", icon: "fas fa-play-circle" },
    { path: "/templates", label: "Templates", icon: "fas fa-layer-group" },
  ];

  const platformItems = [
    { path: "/integrations", label: "Integrations", icon: "fas fa-plug" },
    { path: "/secrets", label: "Secrets", icon: "fas fa-key" },
    { path: "/settings", label: "Settings", icon: "fas fa-cog" },
  ];

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Logo & Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-sm"></i>
          </div>
          <span className="font-bold text-lg">AgentFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Workspace
        </div>
        
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={location === item.path ? "default" : "ghost"}
            className={`w-full justify-start gap-3 ${
              location === item.path 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-foreground"
            }`}
            data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
          >
            <i className={`${item.icon} w-4`}></i>
            <span>{item.label}</span>
          </Button>
        ))}

        <div className="pt-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Platform
          </div>
          
          {platformItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-muted text-foreground"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} w-4`}></i>
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-secondary-foreground text-sm font-medium">U</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">User</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground p-0 h-auto hover:bg-transparent hover:underline"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
