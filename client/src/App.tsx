import { Switch, Route } from "wouter";
import { queryClient, setTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import FlowBuilder from "@/pages/flow-builder";
import AgentBuilder from "@/pages/agent-builder";
import Agents from "@/pages/agents";
import Tools from "@/pages/tools";
import Runs from "@/pages/runs";
import Templates from "@/pages/templates";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();

  // Set up token getter for API calls
  useEffect(() => {
    if (getAccessToken) {
      setTokenGetter(getAccessToken);
    }
  }, [getAccessToken]);

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/flow-builder/:id?" component={FlowBuilder} />
          <Route path="/agent-builder/:id?" component={AgentBuilder} />
          <Route path="/agents" component={Agents} />
          <Route path="/tools" component={Tools} />
          <Route path="/runs" component={Runs} />
          <Route path="/templates" component={Templates} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
