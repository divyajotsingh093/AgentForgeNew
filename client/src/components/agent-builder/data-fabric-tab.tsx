import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface DataFabricTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function DataFabricTab({ agentData, setAgentData }: DataFabricTabProps) {
  const [dataSources, setDataSources] = useState([
    {
      id: "postgres-main",
      name: "Main Database",
      type: "postgresql",
      status: "connected",
      tables: 12,
      lastSync: "2 minutes ago"
    },
    {
      id: "api-crm",
      name: "CRM API",
      type: "rest_api",
      status: "connected",
      endpoints: 8,
      lastSync: "5 minutes ago"
    },
    {
      id: "sheets-data",
      name: "Analytics Spreadsheet",
      type: "google_sheets",
      status: "disconnected",
      rows: 1500,
      lastSync: "1 hour ago"
    }
  ]);

  const [dataConnections, setDataConnections] = useState([
    {
      id: "1",
      sourceId: "postgres-main",
      sourceName: "Main Database",
      contextKey: "customer_data",
      mapping: "customers table → agent context",
      isActive: true
    },
    {
      id: "2", 
      sourceId: "api-crm",
      sourceName: "CRM API",
      contextKey: "sales_pipeline",
      mapping: "leads endpoint → agent context",
      isActive: true
    }
  ]);

  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "postgresql": return "fas fa-database text-blue-600";
      case "mysql": return "fas fa-database text-orange-600";
      case "rest_api": return "fas fa-link text-green-600";
      case "graphql": return "fas fa-project-diagram text-purple-600";
      case "google_sheets": return "fas fa-table text-green-500";
      case "csv": return "fas fa-file-csv text-gray-600";
      default: return "fas fa-question-circle text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-500";
      case "connecting": return "text-yellow-500";
      case "disconnected": return "text-red-500";
      case "error": return "text-red-600";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Fabric Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-sitemap text-primary"></i>
            Data Fabric Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="data-sources-count">
                {dataSources.length}
              </div>
              <div className="text-sm text-muted-foreground">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="active-connections-count">
                {dataConnections.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent" data-testid="context-keys-count">
                {dataConnections.length}
              </div>
              <div className="text-sm text-muted-foreground">Context Keys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="sync-status">
                Real-time
              </div>
              <div className="text-sm text-muted-foreground">Sync Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-database text-primary"></i>
              Data Sources
            </CardTitle>
            <Dialog open={showDataSourceDialog} onOpenChange={setShowDataSourceDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-data-source">
                  <i className="fas fa-plus mr-2"></i>
                  Add Data Source
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Data Source</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="source-name">Source Name</Label>
                    <Input 
                      id="source-name" 
                      placeholder="My Database"
                      data-testid="input-source-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source-type">Source Type</Label>
                    <Select>
                      <SelectTrigger data-testid="select-source-type">
                        <SelectValue placeholder="Select data source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="rest_api">REST API</SelectItem>
                        <SelectItem value="graphql">GraphQL</SelectItem>
                        <SelectItem value="google_sheets">Google Sheets</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="connection-string">Connection String/URL</Label>
                    <Input 
                      id="connection-string" 
                      placeholder="postgresql://user:pass@host:port/db"
                      data-testid="input-connection-string"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => setShowDataSourceDialog(false)}
                    data-testid="button-save-data-source"
                  >
                    Add Data Source
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataSources.map((source) => (
              <div key={source.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <i className={getSourceIcon(source.type)}></i>
                  <div>
                    <div className="font-medium">{source.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.type.replace('_', ' ').toUpperCase()} • 
                      {source.tables && ` ${source.tables} tables`}
                      {source.endpoints && ` ${source.endpoints} endpoints`}
                      {source.rows && ` ${source.rows} rows`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(source.status)}`}>
                      {source.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last sync: {source.lastSync}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-test-connection-${source.id}`}>
                    <i className="fas fa-plug"></i>
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-edit-source-${source.id}`}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-delete-source-${source.id}`}>
                    <i className="fas fa-trash text-destructive"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-link text-primary"></i>
              Data Connections
            </CardTitle>
            <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-data-connection">
                  <i className="fas fa-plus mr-2"></i>
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Data Connection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="select-source">Data Source</Label>
                    <Select>
                      <SelectTrigger data-testid="select-connection-source">
                        <SelectValue placeholder="Choose data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="context-key">Context Key</Label>
                    <Input 
                      id="context-key" 
                      placeholder="customer_data"
                      data-testid="input-context-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data-query">Data Query/Filter</Label>
                    <Textarea
                      id="data-query"
                      placeholder="SELECT * FROM customers WHERE active = true"
                      rows={3}
                      data-testid="textarea-data-query"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval</Label>
                    <Select>
                      <SelectTrigger data-testid="select-refresh-interval">
                        <SelectValue placeholder="How often to sync" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real-time">Real-time</SelectItem>
                        <SelectItem value="1m">Every minute</SelectItem>
                        <SelectItem value="5m">Every 5 minutes</SelectItem>
                        <SelectItem value="15m">Every 15 minutes</SelectItem>
                        <SelectItem value="1h">Every hour</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => setShowMappingDialog(false)}
                    data-testid="button-save-data-connection"
                  >
                    Create Connection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataConnections.map((connection) => (
              <div key={connection.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="fas fa-arrow-right text-muted-foreground"></i>
                  <div>
                    <div className="font-medium">{connection.sourceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {connection.mapping}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <Badge 
                    variant="outline" 
                    className="font-mono text-xs"
                    data-testid={`context-key-${connection.id}`}
                  >
                    {connection.contextKey}
                  </Badge>
                  <Switch 
                    checked={connection.isActive}
                    data-testid={`switch-connection-active-${connection.id}`}
                  />
                  <Button variant="ghost" size="sm" data-testid={`button-edit-connection-${connection.id}`}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-delete-connection-${connection.id}`}>
                    <i className="fas fa-trash text-destructive"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Context Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-eye text-primary"></i>
            Agent Context Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Preview of how data will be injected into your agent's context:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <div className="text-green-600">// Agent Context Data</div>
              <div>{`{`}</div>
              {dataConnections.filter(c => c.isActive).map((connection, index) => (
                <div key={connection.id} className="ml-4">
                  <span className="text-blue-600">"{connection.contextKey}"</span>: {`{`}
                  <div className="ml-4 text-muted-foreground">
                    // Data from {connection.sourceName}
                  </div>
                  <div className="ml-4">
                    "data": [...],
                  </div>
                  <div className="ml-4">
                    "last_updated": "2024-01-15T10:30:00Z"
                  </div>
                  {`}`}{index < dataConnections.filter(c => c.isActive).length - 1 ? ',' : ''}
                </div>
              ))}
              <div>{`}`}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Transformation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-code text-primary"></i>
            Data Transformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Data Transformation</Label>
              <p className="text-sm text-muted-foreground">
                Transform data before injecting into agent context
              </p>
            </div>
            <Switch data-testid="switch-data-transformation" />
          </div>

          <div>
            <Label htmlFor="transformation-script">Transformation Script (JavaScript)</Label>
            <Textarea
              id="transformation-script"
              placeholder="// Transform the data before injection
function transform(data) {
  return data.map(item => ({
    id: item.id,
    name: item.full_name,
    status: item.is_active ? 'active' : 'inactive'
  }));
}"
              rows={8}
              className="font-mono text-sm"
              data-testid="textarea-transformation-script"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Cache Transformed Data</Label>
              <p className="text-sm text-muted-foreground">
                Cache results to improve performance
              </p>
            </div>
            <Switch data-testid="switch-cache-data" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}