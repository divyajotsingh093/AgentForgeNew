import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Secrets() {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSecret, setNewSecret] = useState({
    name: "",
    value: "",
    description: "",
    category: "",
  });

  // Mock data for existing secrets (in real app, these values would be hidden)
  const secrets = [
    {
      id: "1",
      name: "OPENAI_API_KEY",
      category: "AI Services",
      description: "API key for OpenAI GPT models and embeddings",
      lastUsed: "5 minutes ago",
      createdAt: "2 days ago",
      usageCount: 156,
      status: "active",
    },
    {
      id: "2", 
      name: "NOTION_INTEGRATION_SECRET",
      category: "Productivity",
      description: "Secret for Notion API integration",
      lastUsed: "2 hours ago",
      createdAt: "1 week ago",
      usageCount: 43,
      status: "active",
    },
    {
      id: "3",
      name: "DATABASE_URL",
      category: "Database",
      description: "PostgreSQL connection string",
      lastUsed: "1 hour ago", 
      createdAt: "3 days ago",
      usageCount: 89,
      status: "active",
    },
    {
      id: "4",
      name: "SLACK_BOT_TOKEN",
      category: "Communication",
      description: "Bot token for Slack workspace integration",
      lastUsed: "Never",
      createdAt: "5 days ago",
      usageCount: 0,
      status: "inactive",
    },
  ];

  const categories = [
    "AI Services",
    "Productivity", 
    "Communication",
    "Database",
    "Payment",
    "Authentication",
    "Development",
    "Custom",
  ];

  const handleAddSecret = () => {
    if (!newSecret.name || !newSecret.value) {
      toast({
        title: "Missing required fields",
        description: "Please provide both name and value for the secret",
        variant: "destructive",
      });
      return;
    }

    // In real app, this would make an API call to securely store the secret
    toast({
      title: "Secret added successfully",
      description: `${newSecret.name} has been securely stored`,
    });

    setShowAddModal(false);
    setNewSecret({ name: "", value: "", description: "", category: "" });
  };

  const handleDeleteSecret = (secretName: string) => {
    // In real app, this would make an API call to delete the secret
    toast({
      title: "Secret deleted",
      description: `${secretName} has been removed from your environment`,
      variant: "destructive",
    });
  };

  const handleRotateSecret = (secretName: string) => {
    // In real app, this would generate a new secret value
    toast({
      title: "Secret rotated",
      description: `A new value has been generated for ${secretName}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI Services': return 'fas fa-brain';
      case 'Productivity': return 'fas fa-tasks';
      case 'Communication': return 'fas fa-comments';
      case 'Database': return 'fas fa-database';
      case 'Payment': return 'fas fa-credit-card';
      case 'Authentication': return 'fas fa-shield-alt';
      case 'Development': return 'fas fa-code';
      default: return 'fas fa-key';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Secrets Management</h1>
                <p className="text-muted-foreground mt-1">
                  Securely store and manage API keys, tokens, and other sensitive data
                </p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                data-testid="button-add-secret"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Secret
              </Button>
            </div>

            {/* Security Notice */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-shield-alt text-amber-600 text-lg"></i>
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      Security Best Practices
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                      Your secrets are encrypted at rest and in transit. Never share secret values in logs, code, or external communications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Secrets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-secrets">
                    {secrets.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Secrets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-active-secrets">
                    {secrets.filter(s => s.status === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-categories">
                    {categories.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-usage">
                    {secrets.reduce((sum, secret) => sum + secret.usageCount, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secrets List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Secrets</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-filter-secrets">
                    <i className="fas fa-filter mr-2"></i>
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-export-audit">
                    <i className="fas fa-download mr-2"></i>
                    Export Audit Log
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {secrets.map((secret) => (
                  <Card 
                    key={secret.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    data-testid={`card-secret-${secret.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <i className={`${getCategoryIcon(secret.category)} text-primary`}></i>
                            </div>
                            <div>
                              <div className="font-medium">{secret.name}</div>
                              <Badge variant={getStatusColor(secret.status)} className="mt-1">
                                {secret.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground mb-1">
                              {secret.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Category: {secret.category}
                            </div>
                          </div>
                          
                          <div className="text-right text-sm space-y-1">
                            <div className="text-muted-foreground">
                              Last used: {secret.lastUsed}
                            </div>
                            <div className="text-muted-foreground">
                              Created: {secret.createdAt}
                            </div>
                            <div className="text-muted-foreground">
                              Usage: {secret.usageCount} times
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRotateSecret(secret.name)}
                            data-testid={`button-rotate-${secret.id}`}
                          >
                            <i className="fas fa-sync mr-2"></i>
                            Rotate
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteSecret(secret.name)}
                            data-testid={`button-delete-${secret.id}`}
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Delete
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`button-menu-${secret.id}`}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Secret Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent data-testid="modal-add-secret">
          <DialogHeader>
            <DialogTitle>Add New Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="secret-name">Secret Name</Label>
              <Input
                id="secret-name"
                placeholder="e.g., STRIPE_SECRET_KEY"
                value={newSecret.name}
                onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })}
                data-testid="input-secret-name"
              />
            </div>
            
            <div>
              <Label htmlFor="secret-value">Secret Value</Label>
              <Input
                id="secret-value"
                type="password"
                placeholder="Enter the secret value"
                value={newSecret.value}
                onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                data-testid="input-secret-value"
              />
            </div>
            
            <div>
              <Label htmlFor="secret-category">Category</Label>
              <Select
                value={newSecret.category}
                onValueChange={(value) => setNewSecret({ ...newSecret, category: value })}
              >
                <SelectTrigger data-testid="select-secret-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="secret-description">Description (Optional)</Label>
              <Textarea
                id="secret-description"
                placeholder="Describe what this secret is used for"
                value={newSecret.description}
                onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                data-testid="textarea-secret-description"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddSecret} data-testid="button-save-secret">
                Add Secret
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                data-testid="button-cancel-secret"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}