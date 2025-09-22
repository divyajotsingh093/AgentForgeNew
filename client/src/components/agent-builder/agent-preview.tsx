import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AgentPreviewProps {
  agentData: any;
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function AgentPreview({ agentData, isOpen, onClose, agentId }: AgentPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, reset } = useForm<{ message: string }>({
    defaultValues: { message: "" }
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Execute agent with a test message
  const executeAgentMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      if (!agentId) {
        // For unsaved agents, simulate a response
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          response: `Hello! I'm ${agentData.name || 'an AI agent'}. I received your message: "${message}". I'm currently in preview mode with the following capabilities: ${Object.entries(agentData.capabilities || {}).filter(([_, enabled]) => enabled).map(([cap]) => cap).join(', ') || 'none configured'}.`
        };
      }
      
      // For saved agents, make actual API call
      const response = await apiRequest('POST', `/api/agents/${agentId}/execute`, {
        input: { message },
        context: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      const agentMessage: Message = {
        id: Date.now().toString() + '-agent',
        role: 'agent',
        content: data.response || data.result || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsExecuting(false);
    },
    onError: (error) => {
      console.error('Agent execution error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'agent',
        content: `Error: ${error.message || 'Failed to execute agent'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsExecuting(false);
    }
  });

  const onSubmit = handleSubmit(({ message }) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Execute agent
    setIsExecuting(true);
    executeAgentMutation.mutate({ message });
    
    // Reset form
    reset();
  });

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-eye text-primary"></i>
            Agent Preview: {agentData.name || "Unnamed Agent"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Agent Configuration Panel */}
          <div className="w-1/3 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-sm">Agent Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Basic Info</h4>
                  <p className="text-xs text-muted-foreground">
                    <strong>Name:</strong> {agentData.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Description:</strong> {agentData.description || "No description"}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(agentData.capabilities || {}).map(([capability, enabled]) => (
                      <Badge 
                        key={capability} 
                        variant={enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-sm mb-2">System Prompt</h4>
                  <ScrollArea className="h-24 w-full rounded border p-2">
                    <p className="text-xs text-muted-foreground">
                      {agentData.systemPrompt || "No system prompt configured"}
                    </p>
                  </ScrollArea>
                </div>
                
                {agentData.userTemplate && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">User Template</h4>
                      <ScrollArea className="h-20 w-full rounded border p-2">
                        <p className="text-xs text-muted-foreground">
                          {agentData.userTemplate}
                        </p>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Test Chat Interface</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearChat}
                    data-testid="button-clear-chat"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Clear
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 mb-4 border rounded p-3">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <i className="fas fa-comments text-3xl mb-2 opacity-50"></i>
                        <p>Start a conversation to test your agent</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isExecuting && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">Agent is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
                
                {/* Message Input */}
                <form onSubmit={onSubmit} className="flex gap-2">
                  <Input
                    {...register("message")}
                    placeholder="Type a message to test your agent..."
                    disabled={isExecuting}
                    data-testid="input-test-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={isExecuting}
                    data-testid="button-send-message"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {agentId ? (
              <span className="flex items-center gap-1">
                <i className="fas fa-check-circle text-green-500"></i>
                Saved agent - real execution
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                Preview mode - simulated responses
              </span>
            )}
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close-preview">
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}