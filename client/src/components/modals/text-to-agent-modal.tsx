import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TextToAgentModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TextToAgentModal({ open, onClose }: TextToAgentModalProps) {
  const [description, setDescription] = useState("");
  const [inputs, setInputs] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: { description: string; inputs: string }) => {
      const response = await apiRequest("POST", "/api/text-to-agent", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Flow Generated",
        description: "Your agent workflow has been created successfully.",
      });
      onClose();
      // Here you would typically navigate to the new flow or update the UI
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate agent flow",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description of your workflow",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({ description, inputs });
  };

  const handleClose = () => {
    if (!generateMutation.isPending) {
      setDescription("");
      setInputs("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Text-to-Agent Builder
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Describe your workflow in natural language
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Describe your workflow
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-[120px] resize-none"
              placeholder="Example: I want to process customer support emails, categorize them by urgency, extract action items, create Jira tickets for bugs, and send summaries to Slack..."
              disabled={generateMutation.isPending}
              data-testid="textarea-workflow-description"
            />
          </div>
          
          <div>
            <Label htmlFor="inputs" className="text-sm font-medium">
              Expected inputs
            </Label>
            <Input
              id="inputs"
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              className="mt-2"
              placeholder="email, customer_data, priority_rules"
              disabled={generateMutation.isPending}
              data-testid="input-expected-inputs"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={generateMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
              data-testid="button-generate-flow"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate Agent Flow
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={generateMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
