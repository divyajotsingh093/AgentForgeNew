import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ComponentLibrary from "@/components/flow/component-library";
import FlowCanvas from "@/components/flow/flow-canvas";
import RunConsole from "@/components/flow/run-console";
import TextToAgentModal from "@/components/modals/text-to-agent-modal";

export default function FlowBuilder() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showTextToAgent, setShowTextToAgent] = useState(false);
  const [activeRun, setActiveRun] = useState<string | null>(null);

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

  const { data: flow, isLoading: flowLoading, error } = useQuery({
    queryKey: ["/api/flows", id],
    enabled: !!id,
    retry: false,
  });

  const { data: steps, isLoading: stepsLoading } = useQuery<any[]>({
    queryKey: ["/api/flows", id, "steps"],
    enabled: !!id,
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

  if (isLoading || flowLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flow builder...</p>
        </div>
      </div>
    );
  }

  // Mock flow data for demo purposes when no ID is provided
  const mockFlow = {
    id: 'demo-flow',
    name: 'Meeting → Action Orchestrator',
    description: 'Transform meeting recordings into actionable tasks',
    steps: [
      {
        id: '1',
        idx: 0,
        kind: 'agent',
        name: 'Transcriber Agent',
        description: 'Convert audio to clean transcript',
        status: 'active',
        input: 'raw_transcript',
        output: 'clean_transcript'
      },
      {
        id: '2',
        idx: 1,
        kind: 'agent',
        name: 'Summarizer Agent', 
        description: 'Create crisp meeting summary and key decisions',
        status: 'waiting',
        input: 'clean_transcript',
        output: 'summary, decisions'
      },
      {
        id: '3',
        idx: 2,
        kind: 'agent',
        name: 'Action Extractor Agent',
        description: 'Extract actionable tasks with owners and due dates',
        status: 'pending',
        input: 'transcript, summary',
        output: 'action_items'
      },
      {
        id: '4',
        idx: 3,
        kind: 'tool',
        name: 'Notion Export Tool',
        description: 'Create tasks in Notion database',
        status: 'conditional',
        input: 'action_items',
        output: 'notion_page_url'
      },
      {
        id: '5',
        idx: 4,
        kind: 'agent',
        name: 'Publisher Agent',
        description: 'Present final report and confirm exports',
        status: 'pending',
        input: 'summary, action_items, tool_results',
        output: 'final_report'
      }
    ]
  };

  const displayFlow = flow || mockFlow;
  const displaySteps = steps || mockFlow.steps;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          onTextToAgent={() => setShowTextToAgent(true)}
          onRunFlow={() => {
            // Start a new run
            setActiveRun(`run_${Date.now()}`);
            toast({
              title: "Flow Started",
              description: "Your agent workflow is now running",
            });
          }}
        />
        
        {/* Three-panel layout */}
        <div className="flex-1 flex">
          <ComponentLibrary />
          <FlowCanvas flow={displayFlow} steps={displaySteps} />
          <RunConsole activeRun={activeRun} />
        </div>
      </div>

      <TextToAgentModal 
        open={showTextToAgent}
        onClose={() => setShowTextToAgent(false)}
      />
    </div>
  );
}
