import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function KnowledgeTab({ agentData, setAgentData }: KnowledgeTabProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newText, setNewText] = useState("");
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string | null>(null);
  const { toast } = useToast();

  // Query for knowledge bases
  const { data: knowledgeBases = [], isLoading: loadingKnowledgeBases } = useQuery<any[]>({
    queryKey: ["/api/agents", agentData?.id, "knowledge-bases"],
    enabled: !!agentData?.id,
  });

  // Query for knowledge items
  const { data: knowledgeItems = [], isLoading: loadingKnowledgeItems, refetch: refetchKnowledgeItems } = useQuery<any[]>({
    queryKey: ["/api/knowledge-bases", selectedKnowledgeBase, "items"],
    enabled: !!selectedKnowledgeBase,
  });

  // Auto-select first knowledge base or create one if none exists
  useEffect(() => {
    if (knowledgeBases.length > 0 && !selectedKnowledgeBase) {
      setSelectedKnowledgeBase(knowledgeBases[0].id);
    } else if (knowledgeBases.length === 0 && !loadingKnowledgeBases && agentData?.id) {
      // Create a default knowledge base
      createKnowledgeBase.mutate({
        name: "Default Knowledge Base",
        description: "Default knowledge base for this agent",
        embeddingModel: "text-embedding-3-small",
        vectorDimensions: 1536,
        chunkSize: 1500,
        chunkOverlap: 200
      });
    }
  }, [knowledgeBases, selectedKnowledgeBase, loadingKnowledgeBases, agentData?.id]);

  // Mutation for creating knowledge base
  const createKnowledgeBase = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/agents/${agentData.id}/knowledge-bases`, data);
      return response.json();
    },
    onSuccess: (newKnowledgeBase) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentData.id, "knowledge-bases"] });
      setSelectedKnowledgeBase(newKnowledgeBase.id);
      toast({
        title: "Knowledge base created",
        description: "Default knowledge base created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create knowledge base",
        variant: "destructive",
      });
    }
  });

  // Mutation for file upload
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedKnowledgeBase) {
        throw new Error("No knowledge base selected");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/knowledge-bases/${selectedKnowledgeBase}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      refetchKnowledgeItems();
      toast({
        title: "File uploaded successfully",
        description: `Processed ${result.totalChunks} chunks with ${result.embeddingsCount} embeddings`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedKnowledgeBase) {
      Array.from(files).forEach((file) => {
        uploadFileMutation.mutate(file);
      });
    } else if (!selectedKnowledgeBase) {
      toast({
        title: "No knowledge base",
        description: "Please wait for knowledge base to be created",
        variant: "destructive",
      });
    }
  };

  // Mutation for adding knowledge items (URL and text)
  const addKnowledgeItemMutation = useMutation({
    mutationFn: async (data: { type: string, title: string, content: string, metadata?: any }) => {
      if (!selectedKnowledgeBase) {
        throw new Error("No knowledge base selected");
      }
      
      const response = await apiRequest("POST", `/api/knowledge-bases/${selectedKnowledgeBase}/items`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchKnowledgeItems();
      toast({
        title: "Knowledge item added",
        description: "Item added and processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting knowledge items
  const deleteKnowledgeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/knowledge-items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      refetchKnowledgeItems();
      toast({
        title: "Item deleted",
        description: "Knowledge item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addUrl = () => {
    if (!newUrl.trim() || !selectedKnowledgeBase) return;
    
    try {
      const urlObj = new URL(newUrl);
      addKnowledgeItemMutation.mutate({
        type: "url",
        title: urlObj.hostname,
        content: newUrl,
        metadata: { originalUrl: newUrl }
      });
      setNewUrl("");
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
    }
  };

  const addText = () => {
    if (!newText.trim() || !selectedKnowledgeBase) return;
    
    addKnowledgeItemMutation.mutate({
      type: "text",
      title: "Custom Text",
      content: newText,
      metadata: { 
        length: newText.length,
        source: "manual"
      }
    });
    setNewText("");
  };

  const removeItem = (id: string) => {
    deleteKnowledgeItemMutation.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "processed": return "fas fa-check-circle text-green-500";
      case "processing": return "fas fa-spinner fa-spin text-yellow-500";
      case "uploading": return "fas fa-upload text-blue-500";
      case "error": return "fas fa-exclamation-circle text-red-500";
      case "pending": return "fas fa-clock text-yellow-500";
      default: return "fas fa-circle text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "file": return "fas fa-file-alt";
      case "url": return "fas fa-link";
      case "text": return "fas fa-align-left";
      default: return "fas fa-question";
    }
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Base Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-brain text-primary"></i>
            Knowledge Base Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="knowledge-items-count">
                {loadingKnowledgeItems ? "..." : knowledgeItems.length}
              </div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="knowledge-chunks-count">
                {loadingKnowledgeItems ? "..." : (knowledgeItems as any[]).reduce((sum: number, item: any) => {
                  // Calculate chunks based on content length if not provided
                  const chunks = item.metadata?.totalChunks || Math.ceil((item.content?.length || 0) / 1500);
                  return sum + chunks;
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Chunks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent" data-testid="knowledge-storage-size">
                {loadingKnowledgeItems ? "..." : `${((knowledgeItems as any[]).reduce((sum: number, item: any) => {
                  return sum + (item.content?.length || 0);
                }, 0) / 1024 / 1024).toFixed(1)} MB`}
              </div>
              <div className="text-sm text-muted-foreground">Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="knowledge-embeddings-count">
                {loadingKnowledgeItems ? "..." : (knowledgeItems as any[]).reduce((sum: number, item: any) => {
                  const chunks = item.metadata?.totalChunks || Math.ceil((item.content?.length || 0) / 1500);
                  return sum + chunks;
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Embeddings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Knowledge Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-plus text-primary"></i>
            Add Knowledge Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" data-testid="tab-upload-files">
                <i className="fas fa-upload mr-2"></i>
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="url" data-testid="tab-add-url">
                <i className="fas fa-link mr-2"></i>
                Add URL
              </TabsTrigger>
              <TabsTrigger value="text" data-testid="tab-add-text">
                <i className="fas fa-edit mr-2"></i>
                Add Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, TXT, DOC, CSV, and more
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.csv,.md,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" data-testid="button-upload-files">
                    <i className="fas fa-plus mr-2"></i>
                    Choose Files
                  </Button>
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/documentation"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  data-testid="input-knowledge-url"
                />
                <Button onClick={addUrl} data-testid="button-add-url">
                  <i className="fas fa-plus mr-2"></i>
                  Add URL
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll scrape and process the content from the provided URL.
              </p>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder="Enter your custom knowledge content here..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={6}
                data-testid="textarea-knowledge-text"
              />
              <Button onClick={addText} data-testid="button-add-text">
                <i className="fas fa-plus mr-2"></i>
                Add Text
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Knowledge Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-list text-primary"></i>
            Knowledge Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loadingKnowledgeItems ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                <p className="text-muted-foreground">Loading knowledge items...</p>
              </div>
            ) : (knowledgeItems as any[]).length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-book text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No knowledge items yet. Upload files or add content to get started.</p>
              </div>
            ) : (
              (knowledgeItems as any[]).map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className={`${getTypeIcon(item.type)} text-muted-foreground`}></i>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type === "file" && item.metadata?.mimeType && `${item.metadata.mimeType} • `}
                        {item.content ? `${(item.content.length / 1024).toFixed(1)} KB` : "0 KB"} • 
                        {item.metadata?.totalChunks || Math.ceil((item.content?.length || 0) / 1500)} chunks
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className={getStatusIcon(item.processingStatus || "processed")}></i>
                    <Badge variant={item.processingStatus === "completed" || item.isProcessed ? "default" : "secondary"}>
                      {item.processingStatus || (item.isProcessed ? "processed" : "pending")}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      data-testid={`button-remove-knowledge-${item.id}`}
                      disabled={deleteKnowledgeItemMutation.isPending}
                    >
                      <i className="fas fa-trash text-destructive"></i>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Embedding Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-primary"></i>
            Embedding Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="embedding-model">Embedding Model</Label>
              <Input 
                id="embedding-model"
                value="text-embedding-ada-002"
                readOnly
                data-testid="input-embedding-model"
              />
            </div>
            <div>
              <Label htmlFor="chunk-size">Chunk Size (tokens)</Label>
              <Input 
                id="chunk-size"
                type="number"
                defaultValue="1000"
                data-testid="input-chunk-size"
              />
            </div>
            <div>
              <Label htmlFor="chunk-overlap">Chunk Overlap (tokens)</Label>
              <Input 
                id="chunk-overlap"
                type="number"
                defaultValue="200"
                data-testid="input-chunk-overlap"
              />
            </div>
            <div>
              <Label htmlFor="similarity-threshold">Similarity Threshold</Label>
              <Input 
                id="similarity-threshold"
                type="number"
                step="0.01"
                min="0"
                max="1"
                defaultValue="0.7"
                data-testid="input-similarity-threshold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-inject Knowledge</Label>
              <p className="text-sm text-muted-foreground">
                Automatically include relevant knowledge in agent context
              </p>
            </div>
            <Switch data-testid="switch-auto-inject" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}