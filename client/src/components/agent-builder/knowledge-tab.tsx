import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface KnowledgeTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function KnowledgeTab({ agentData, setAgentData }: KnowledgeTabProps) {
  const [knowledgeItems, setKnowledgeItems] = useState([
    { id: "1", type: "file", title: "Product Documentation.pdf", status: "processed", size: "2.4 MB", chunks: 45 },
    { id: "2", type: "url", title: "Company Website", status: "processing", size: "1.2 MB", chunks: 23 },
    { id: "3", type: "text", title: "Custom Instructions", status: "processed", size: "0.8 KB", chunks: 2 }
  ]);

  const [newUrl, setNewUrl] = useState("");
  const [newText, setNewText] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const newItem = {
          id: Date.now().toString(),
          type: "file",
          title: file.name,
          status: "uploading",
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          chunks: 0
        };
        setKnowledgeItems(prev => [...prev, newItem]);
      });
    }
  };

  const addUrl = () => {
    if (!newUrl.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      type: "url",
      title: new URL(newUrl).hostname,
      status: "processing",
      size: "0 MB",
      chunks: 0
    };
    setKnowledgeItems(prev => [...prev, newItem]);
    setNewUrl("");
  };

  const addText = () => {
    if (!newText.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      type: "text",
      title: "Custom Text",
      status: "processed",
      size: `${(newText.length / 1024).toFixed(1)} KB`,
      chunks: Math.ceil(newText.length / 1000)
    };
    setKnowledgeItems(prev => [...prev, newItem]);
    setNewText("");
  };

  const removeItem = (id: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed": return "fas fa-check-circle text-green-500";
      case "processing": return "fas fa-spinner fa-spin text-yellow-500";
      case "uploading": return "fas fa-upload text-blue-500";
      case "error": return "fas fa-exclamation-circle text-red-500";
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
                {knowledgeItems.length}
              </div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="knowledge-chunks-count">
                {knowledgeItems.reduce((sum, item) => sum + item.chunks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Chunks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent" data-testid="knowledge-storage-size">
                4.4 MB
              </div>
              <div className="text-sm text-muted-foreground">Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="knowledge-embeddings-count">
                1,536
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
            {knowledgeItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <i className={`${getTypeIcon(item.type)} text-muted-foreground`}></i>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.size} • {item.chunks} chunks
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className={getStatusIcon(item.status)}></i>
                  <Badge variant={item.status === "processed" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    data-testid={`button-remove-knowledge-${item.id}`}
                  >
                    <i className="fas fa-trash text-destructive"></i>
                  </Button>
                </div>
              </div>
            ))}
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