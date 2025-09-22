import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface TriggersTabProps {
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function TriggersTab({ agentData, setAgentData }: TriggersTabProps) {
  const [triggers, setTriggers] = useState([
    {
      id: "daily-report",
      name: "Daily Report Generation",
      type: "schedule",
      status: "active",
      lastTriggered: "2 hours ago",
      config: { schedule: "0 9 * * *", timezone: "UTC" }
    },
    {
      id: "webhook-crm",
      name: "CRM Lead Webhook",
      type: "webhook",
      status: "active",
      lastTriggered: "15 minutes ago",
      config: { url: "/webhook/crm-leads" }
    },
    {
      id: "email-monitor",
      name: "Email Monitoring",
      type: "event",
      status: "paused",
      lastTriggered: "1 day ago",
      config: { event: "email_received", conditions: ["from contains 'support'"] }
    }
  ]);

  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [selectedTriggerType, setSelectedTriggerType] = useState("schedule");

  const triggerTypes = [
    {
      id: "schedule",
      name: "Scheduled Trigger",
      description: "Run agent at specific times or intervals",
      icon: "fas fa-clock",
      color: "bg-blue-500"
    },
    {
      id: "webhook",
      name: "Webhook Trigger",
      description: "Trigger via HTTP webhook calls",
      icon: "fas fa-link",
      color: "bg-green-500"
    },
    {
      id: "event",
      name: "Event Trigger",
      description: "React to system or external events",
      icon: "fas fa-bolt",
      color: "bg-yellow-500"
    },
    {
      id: "condition",
      name: "Conditional Trigger",
      description: "Execute when conditions are met",
      icon: "fas fa-code-branch",
      color: "bg-purple-500"
    },
    {
      id: "api",
      name: "API Trigger",
      description: "Monitor API endpoints for changes",
      icon: "fas fa-server",
      color: "bg-red-500"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-500";
      case "paused": return "text-yellow-500";
      case "error": return "text-red-500";
      case "inactive": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const getTriggerIcon = (type: string) => {
    const triggerType = triggerTypes.find(t => t.id === type);
    return triggerType ? triggerType.icon : "fas fa-question";
  };

  const toggleTrigger = (id: string) => {
    setTriggers(triggers.map(trigger => 
      trigger.id === id 
        ? { ...trigger, status: trigger.status === "active" ? "paused" : "active" }
        : trigger
    ));
  };

  const deleteTrigger = (id: string) => {
    setTriggers(triggers.filter(trigger => trigger.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Triggers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-bolt text-primary"></i>
            Autonomous Triggers Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="total-triggers-count">
                {triggers.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Triggers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="active-triggers-count">
                {triggers.filter(t => t.status === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500" data-testid="executions-today">
                23
              </div>
              <div className="text-sm text-muted-foreground">Executions Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500" data-testid="success-rate">
                98%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-plus text-primary"></i>
            Add New Trigger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {triggerTypes.map((type) => (
              <Dialog key={type.id} open={showTriggerDialog && selectedTriggerType === type.id} onOpenChange={setShowTriggerDialog}>
                <DialogTrigger asChild>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedTriggerType(type.id);
                      setShowTriggerDialog(true);
                    }}
                    data-testid={`trigger-type-${type.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center text-white mx-auto mb-3`}>
                        <i className={type.icon}></i>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{type.name}</h3>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create {type.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="trigger-name">Trigger Name</Label>
                      <Input 
                        id="trigger-name" 
                        placeholder="My Trigger"
                        data-testid="input-trigger-name"
                      />
                    </div>
                    
                    {type.id === "schedule" && (
                      <>
                        <div>
                          <Label htmlFor="schedule-type">Schedule Type</Label>
                          <Select>
                            <SelectTrigger data-testid="select-schedule-type">
                              <SelectValue placeholder="Choose schedule" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="interval">Every N minutes/hours</SelectItem>
                              <SelectItem value="daily">Daily at specific time</SelectItem>
                              <SelectItem value="weekly">Weekly on specific days</SelectItem>
                              <SelectItem value="monthly">Monthly on specific date</SelectItem>
                              <SelectItem value="cron">Custom Cron Expression</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cron-expression">Cron Expression</Label>
                          <Input 
                            id="cron-expression" 
                            placeholder="0 9 * * *"
                            data-testid="input-cron-expression"
                          />
                        </div>
                      </>
                    )}

                    {type.id === "webhook" && (
                      <>
                        <div>
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <Input 
                            id="webhook-url" 
                            placeholder="/webhook/my-trigger"
                            data-testid="input-webhook-url"
                          />
                        </div>
                        <div>
                          <Label htmlFor="webhook-method">HTTP Method</Label>
                          <Select>
                            <SelectTrigger data-testid="select-webhook-method">
                              <SelectValue placeholder="Choose method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {type.id === "event" && (
                      <>
                        <div>
                          <Label htmlFor="event-source">Event Source</Label>
                          <Select>
                            <SelectTrigger data-testid="select-event-source">
                              <SelectValue placeholder="Choose source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email System</SelectItem>
                              <SelectItem value="database">Database Changes</SelectItem>
                              <SelectItem value="file">File System</SelectItem>
                              <SelectItem value="api">API Calls</SelectItem>
                              <SelectItem value="user">User Actions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="event-type">Event Type</Label>
                          <Input 
                            id="event-type" 
                            placeholder="email_received, file_uploaded, etc."
                            data-testid="input-event-type"
                          />
                        </div>
                      </>
                    )}

                    {type.id === "condition" && (
                      <div>
                        <Label htmlFor="condition-logic">Condition Logic</Label>
                        <Textarea
                          id="condition-logic"
                          placeholder="data.temperature > 30 AND data.humidity < 40"
                          rows={3}
                          data-testid="textarea-condition-logic"
                        />
                      </div>
                    )}

                    <Button 
                      className="w-full"
                      onClick={() => setShowTriggerDialog(false)}
                      data-testid="button-save-trigger"
                    >
                      Create Trigger
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-list text-primary"></i>
            Active Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div key={trigger.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <i className={`${getTriggerIcon(trigger.type)} text-muted-foreground`}></i>
                  <div>
                    <div className="font-medium">{trigger.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {trigger.type.charAt(0).toUpperCase() + trigger.type.slice(1)} • 
                      Last triggered: {trigger.lastTriggered}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <Badge 
                    variant={trigger.status === "active" ? "default" : "secondary"}
                    className={trigger.status === "active" ? "bg-green-500" : ""}
                  >
                    {trigger.status}
                  </Badge>
                  <Switch 
                    checked={trigger.status === "active"}
                    onCheckedChange={() => toggleTrigger(trigger.id)}
                    data-testid={`switch-trigger-${trigger.id}`}
                  />
                  <Button variant="ghost" size="sm" data-testid={`button-edit-trigger-${trigger.id}`}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-test-trigger-${trigger.id}`}>
                    <i className="fas fa-play"></i>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteTrigger(trigger.id)}
                    data-testid={`button-delete-trigger-${trigger.id}`}
                  >
                    <i className="fas fa-trash text-destructive"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-history text-primary"></i>
            Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { trigger: "Daily Report Generation", time: "2 hours ago", status: "success", duration: "1.2s" },
              { trigger: "CRM Lead Webhook", time: "15 minutes ago", status: "success", duration: "0.8s" },
              { trigger: "Email Monitoring", time: "3 hours ago", status: "success", duration: "2.1s" },
              { trigger: "Daily Report Generation", time: "1 day ago", status: "success", duration: "1.5s" },
              { trigger: "CRM Lead Webhook", time: "1 day ago", status: "error", duration: "5.0s" }
            ].map((execution, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  execution.status === "success" ? "bg-green-500" : "bg-red-500"
                }`}></div>
                <div className="flex-1">
                  <div className="font-medium">{execution.trigger}</div>
                  <div className="text-sm text-muted-foreground">
                    {execution.time} • Duration: {execution.duration}
                  </div>
                </div>
                <Badge 
                  variant={execution.status === "success" ? "default" : "destructive"}
                  className={execution.status === "success" ? "bg-green-500" : ""}
                >
                  {execution.status}
                </Badge>
                <Button variant="ghost" size="sm" data-testid={`button-view-execution-${index}`}>
                  <i className="fas fa-eye"></i>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Global Trigger Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-primary"></i>
            Global Trigger Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable All Triggers</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all autonomous triggers
              </p>
            </div>
            <Switch data-testid="switch-enable-all-triggers" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Retry Failed Executions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically retry failed trigger executions
              </p>
            </div>
            <Switch data-testid="switch-retry-executions" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Execution Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Maximum time to wait for trigger execution
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue="60" 
                className="w-20"
                data-testid="input-execution-timeout"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Maximum trigger executions per minute
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue="10" 
                className="w-20"
                data-testid="input-rate-limit"
              />
              <span className="text-sm text-muted-foreground">per minute</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Notification on Failures</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts when triggers fail
              </p>
            </div>
            <Switch data-testid="switch-failure-notifications" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}