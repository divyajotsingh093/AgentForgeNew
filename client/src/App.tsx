import { Switch, Route, Router } from "wouter";
import { queryClient, setTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import FlowBuilder from "@/pages/flow-builder";
import Flows from "@/pages/flows";
import AgentBuilder from "@/pages/agent-builder";
import Agents from "@/pages/agents";
import Tools from "@/pages/tools";
import Runs from "@/pages/runs";
import Templates from "@/pages/templates";
import Integrations from "@/pages/integrations";
import Secrets from "@/pages/secrets";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();

  // Set up token getter for API calls
  useEffect(() => {
    if (getAccessToken) {
      setTokenGetter(getAccessToken);
    }
  }, [getAccessToken]);

  return (
    <Router>
      <Switch>
        {/* Auth route is always available */}
        <Route path="/auth" component={Auth} />
        
        {isLoading || !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/flows" component={Flows} />
            <Route path="/flow-builder/:id?" component={FlowBuilder} />
            <Route path="/agent-builder/:id?" component={AgentBuilder} />
            <Route path="/agents" component={Agents} />
            <Route path="/tools" component={Tools} />
            <Route path="/runs" component={Runs} />
            <Route path="/templates" component={Templates} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/secrets" component={Secrets} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
