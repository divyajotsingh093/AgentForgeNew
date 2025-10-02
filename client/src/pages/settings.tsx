import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  
  const [profileSettings, setProfileSettings] = useState({
    name: "Demo User",
    email: "demo@vortic.com",
    organization: "Vortic Demo",
    timezone: "UTC",
    language: "en",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    runCompletions: true,
    errorAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    allowApiAccess: true,
    ipWhitelist: "",
  });

  const [platformSettings, setPlatformSettings] = useState({
    theme: "system",
    defaultWorkspace: "",
    autoSave: true,
    showTutorials: true,
    compactMode: false,
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile settings have been saved successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications updated", 
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Security settings updated",
      description: "Your security configuration has been saved.",
    });
  };

  const handleSavePlatform = () => {
    toast({
      title: "Platform settings updated",
      description: "Your platform preferences have been saved.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Data export initiated",
      description: "Your data export will be available for download shortly.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion requested",
      description: "Please check your email for confirmation instructions.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account, security, and platform preferences
              </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
                <TabsTrigger value="platform" data-testid="tab-platform">Platform</TabsTrigger>
              </TabsList>

              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input
                          id="profile-name"
                          value={profileSettings.name}
                          onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                          data-testid="input-profile-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-email">Email Address</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={profileSettings.email}
                          onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                          data-testid="input-profile-email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="profile-organization">Organization</Label>
                      <Input
                        id="profile-organization"
                        value={profileSettings.organization}
                        onChange={(e) => setProfileSettings({...profileSettings, organization: e.target.value})}
                        data-testid="input-profile-organization"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-timezone">Timezone</Label>
                        <Select
                          value={profileSettings.timezone}
                          onValueChange={(value) => setProfileSettings({...profileSettings, timezone: value})}
                        >
                          <SelectTrigger data-testid="select-timezone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="profile-language">Language</Label>
                        <Select
                          value={profileSettings.language}
                          onValueChange={(value) => setProfileSettings({...profileSettings, language: value})}
                        >
                          <SelectTrigger data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                      Save Profile Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, emailNotifications: checked})
                          }
                          data-testid="switch-email-notifications"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Push Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, pushNotifications: checked})
                          }
                          data-testid="switch-push-notifications"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Run Completions</h4>
                          <p className="text-sm text-muted-foreground">Notify when agent runs complete</p>
                        </div>
                        <Switch
                          checked={notificationSettings.runCompletions}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, runCompletions: checked})
                          }
                          data-testid="switch-run-completions"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Error Alerts</h4>
                          <p className="text-sm text-muted-foreground">Notify when errors occur</p>
                        </div>
                        <Switch
                          checked={notificationSettings.errorAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, errorAlerts: checked})
                          }
                          data-testid="switch-error-alerts"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Weekly Reports</h4>
                          <p className="text-sm text-muted-foreground">Receive weekly usage summaries</p>
                        </div>
                        <Switch
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, weeklyReports: checked})
                          }
                          data-testid="switch-weekly-reports"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Marketing Emails</h4>
                          <p className="text-sm text-muted-foreground">Receive product updates and tips</p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, marketingEmails: checked})
                          }
                          data-testid="switch-marketing-emails"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleSaveNotifications} data-testid="button-save-notifications">
                      Save Notification Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                        <Switch
                          checked={securitySettings.twoFactorEnabled}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({...securitySettings, twoFactorEnabled: checked})
                          }
                          data-testid="switch-two-factor"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Select
                          value={securitySettings.sessionTimeout}
                          onValueChange={(value) => setSecuritySettings({...securitySettings, sessionTimeout: value})}
                        >
                          <SelectTrigger data-testid="select-session-timeout">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">API Access</h4>
                          <p className="text-sm text-muted-foreground">Allow programmatic access to your account</p>
                        </div>
                        <Switch
                          checked={securitySettings.allowApiAccess}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({...securitySettings, allowApiAccess: checked})
                          }
                          data-testid="switch-api-access"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="ip-whitelist">IP Whitelist (Optional)</Label>
                        <Textarea
                          id="ip-whitelist"
                          placeholder="Enter IP addresses or ranges, one per line"
                          value={securitySettings.ipWhitelist}
                          onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                          data-testid="textarea-ip-whitelist"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleSaveSecurity} data-testid="button-save-security">
                      Save Security Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Platform Settings */}
              <TabsContent value="platform" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={platformSettings.theme}
                          onValueChange={(value) => setPlatformSettings({...platformSettings, theme: value})}
                        >
                          <SelectTrigger data-testid="select-theme">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="default-workspace">Default Workspace</Label>
                        <Select
                          value={platformSettings.defaultWorkspace}
                          onValueChange={(value) => setPlatformSettings({...platformSettings, defaultWorkspace: value})}
                        >
                          <SelectTrigger data-testid="select-default-workspace">
                            <SelectValue placeholder="Select default workspace" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal Workspace</SelectItem>
                            <SelectItem value="team">Team Workspace</SelectItem>
                            <SelectItem value="enterprise">Enterprise Workspace</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-save</h4>
                          <p className="text-sm text-muted-foreground">Automatically save changes</p>
                        </div>
                        <Switch
                          checked={platformSettings.autoSave}
                          onCheckedChange={(checked) => 
                            setPlatformSettings({...platformSettings, autoSave: checked})
                          }
                          data-testid="switch-auto-save"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Show Tutorials</h4>
                          <p className="text-sm text-muted-foreground">Display helpful tutorials and tips</p>
                        </div>
                        <Switch
                          checked={platformSettings.showTutorials}
                          onCheckedChange={(checked) => 
                            setPlatformSettings({...platformSettings, showTutorials: checked})
                          }
                          data-testid="switch-show-tutorials"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Compact Mode</h4>
                          <p className="text-sm text-muted-foreground">Use a more compact interface</p>
                        </div>
                        <Switch
                          checked={platformSettings.compactMode}
                          onCheckedChange={(checked) => 
                            setPlatformSettings({...platformSettings, compactMode: checked})
                          }
                          data-testid="switch-compact-mode"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleSavePlatform} data-testid="button-save-platform">
                      Save Platform Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-muted-foreground">Download a copy of your data</p>
                      </div>
                      <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
                        <i className="fas fa-download mr-2"></i>
                        Export
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-600">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive" onClick={handleDeleteAccount} data-testid="button-delete-account">
                        <i className="fas fa-trash mr-2"></i>
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}