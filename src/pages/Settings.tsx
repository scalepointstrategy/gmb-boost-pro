import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Chrome, 
  Download, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Shield,
  Bell,
  Mail,
  Globe,
  User,
  LogOut,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ConnectionSetup from "@/components/GoogleBusinessProfile/ConnectionSetup";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    newReviews: true,
    scheduledPosts: true,
    weeklyReports: false,
    accountAlerts: true,
  });
  const [autoReply, setAutoReply] = useState({
    enabled: false,
    positiveReviews: true,
    neutralReviews: true,
    negativeReviews: false,
  });
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleExportProfile = async (profileId: string) => {
    console.log("Exporting profile:", profileId);
    toast({
      title: "Export Started",
      description: "Your profile data export will be ready for download shortly.",
    });
  };

  const handleExportAll = async () => {
    console.log("Exporting all data...");
    toast({
      title: "Export Started", 
      description: "All profile data will be exported and sent to your email.",
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your account preferences and business profile settings
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="connections" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Connections</span>
            <span className="sm:hidden">Connect</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notify</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <ConnectionSetup />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-reviews">New Reviews</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new customer reviews
                    </p>
                  </div>
                  <Switch
                    id="new-reviews"
                    checked={notifications.newReviews}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, newReviews: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="scheduled-posts">Scheduled Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive confirmations when posts are published
                    </p>
                  </div>
                  <Switch
                    id="scheduled-posts"
                    checked={notifications.scheduledPosts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, scheduledPosts: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly performance summaries via email
                    </p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="account-alerts">Account Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important account and billing notifications
                    </p>
                  </div>
                  <Switch
                    id="account-alerts"
                    checked={notifications.accountAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, accountAlerts: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto Reply Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Auto Reply Settings
              </CardTitle>
              <CardDescription>
                Configure automatic responses to customer reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reply">Enable Auto Reply</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically respond to reviews using AI-generated responses
                  </p>
                </div>
                <Switch
                  id="auto-reply"
                  checked={autoReply.enabled}
                  onCheckedChange={(checked) =>
                    setAutoReply(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {autoReply.enabled && (
                <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="positive-reviews">Positive Reviews (4-5 stars)</Label>
                    <Switch
                      id="positive-reviews"
                      checked={autoReply.positiveReviews}
                      onCheckedChange={(checked) =>
                        setAutoReply(prev => ({ ...prev, positiveReviews: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="neutral-reviews">Neutral Reviews (3 stars)</Label>
                    <Switch
                      id="neutral-reviews"
                      checked={autoReply.neutralReviews}
                      onCheckedChange={(checked) =>
                        setAutoReply(prev => ({ ...prev, neutralReviews: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="negative-reviews">Negative Reviews (1-2 stars)</Label>
                    <Switch
                      id="negative-reviews"
                      checked={autoReply.negativeReviews}
                      onCheckedChange={(checked) =>
                        setAutoReply(prev => ({ ...prev, negativeReviews: checked }))
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Manage your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    defaultValue={currentUser?.displayName || ''}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={currentUser?.email || ''}
                    placeholder="your@email.com"
                    disabled
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Account Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Your account is active and verified
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sign Out</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Download your business profile data and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Individual Profile Export</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export data for a specific business profile
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExportProfile("sample-profile")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Profile
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Complete Data Export</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export all your business profile data
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportAll}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;