import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Palette, Bell, Layout, Shield, HelpCircle, Moon, Sun, Monitor, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HolidayManagementDialog } from "@/components/HolidayManagementDialog";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { cn } from "@/lib/utils";

interface UserProfile {
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateSetting, isLoading } = useCloudSettings();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl py-6 px-4">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your account information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10">
                      {profile ? getInitials(profile.display_name, profile.email) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Profile Picture</p>
                    <Button variant="outline" size="sm" disabled>
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Profile Fields */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed.
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving || displayName === profile?.display_name}
                    className="w-fit"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium">Log out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleLogout}>
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Customize the appearance of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateSetting("theme", "light")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        settings.theme === "light"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center">
                        <Sun className="h-6 w-6 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      onClick={() => updateSetting("theme", "dark")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        settings.theme === "dark"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-900 border flex items-center justify-center">
                        <Moon className="h-6 w-6 text-slate-200" />
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-3">
                  <Label>Font Size</Label>
                  <RadioGroup
                    value={settings.fontSize}
                    onValueChange={(value) => updateSetting("fontSize", value as any)}
                    className="grid grid-cols-3 gap-4"
                  >
                    {["small", "medium", "large"].map((size) => (
                      <Label
                        key={size}
                        htmlFor={`font-${size}`}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          settings.fontSize === size
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={size} id={`font-${size}`} className="sr-only" />
                        <span className={cn(
                          "font-medium capitalize",
                          size === "small" && "text-sm",
                          size === "medium" && "text-base",
                          size === "large" && "text-lg"
                        )}>
                          Aa
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{size}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Display Density */}
                <div className="space-y-3">
                  <Label>Display Density</Label>
                  <RadioGroup
                    value={settings.displayDensity}
                    onValueChange={(value) => updateSetting("displayDensity", value as any)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="density-compact"
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        settings.displayDensity === "compact"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value="compact" id="density-compact" className="sr-only" />
                      <div className="w-full space-y-1">
                        <div className="h-2 bg-muted rounded w-full"></div>
                        <div className="h-2 bg-muted rounded w-3/4"></div>
                        <div className="h-2 bg-muted rounded w-1/2"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">Compact</span>
                    </Label>
                    <Label
                      htmlFor="density-spacious"
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        settings.displayDensity === "spacious"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value="spacious" id="density-spacious" className="sr-only" />
                      <div className="w-full space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">Spacious</span>
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-master" className="font-medium">
                      Enable Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Master toggle for all notifications
                    </p>
                  </div>
                  <Switch
                    id="notifications-master"
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => updateSetting("notificationsEnabled", checked)}
                  />
                </div>

                <Separator />

                {/* Individual Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="event-reminders"
                        className={cn(
                          "font-medium",
                          !settings.notificationsEnabled && "text-muted-foreground"
                        )}
                      >
                        Event Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded before your events start
                      </p>
                    </div>
                    <Switch
                      id="event-reminders"
                      checked={settings.eventReminders}
                      onCheckedChange={(checked) => updateSetting("eventReminders", checked)}
                      disabled={!settings.notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="daily-summary"
                        className={cn(
                          "font-medium",
                          !settings.notificationsEnabled && "text-muted-foreground"
                        )}
                      >
                        Daily Summary
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a summary of your day each morning
                      </p>
                    </div>
                    <Switch
                      id="daily-summary"
                      checked={settings.dailySummary}
                      onCheckedChange={(checked) => updateSetting("dailySummary", checked)}
                      disabled={!settings.notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="task-deadlines"
                        className={cn(
                          "font-medium",
                          !settings.notificationsEnabled && "text-muted-foreground"
                        )}
                      >
                        Task Deadlines
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks are approaching their deadline
                      </p>
                    </div>
                    <Switch
                      id="task-deadlines"
                      checked={settings.taskDeadlines}
                      onCheckedChange={(checked) => updateSetting("taskDeadlines", checked)}
                      disabled={!settings.notificationsEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>
                  Configure your default calendar view and layout preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default View */}
                <div className="space-y-3">
                  <Label>Default Calendar View</Label>
                  <RadioGroup
                    value={settings.defaultView}
                    onValueChange={(value) => updateSetting("defaultView", value as any)}
                    className="grid grid-cols-3 gap-4"
                  >
                    {[
                      { value: "daily", label: "Day" },
                      { value: "weekly", label: "Week" },
                      { value: "monthly", label: "Month" },
                    ].map((view) => (
                      <Label
                        key={view.value}
                        htmlFor={`view-${view.value}`}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          settings.defaultView === view.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={view.value} id={`view-${view.value}`} className="sr-only" />
                        <span className="text-sm font-medium">{view.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Sidebar Settings */}
                <div className="space-y-4">
                  <Label>Sidebar</Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sidebar-collapsed" className="font-medium">
                        Start Collapsed
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sidebar will be collapsed by default
                      </p>
                    </div>
                    <Switch
                      id="sidebar-collapsed"
                      checked={settings.sidebarCollapsed}
                      onCheckedChange={(checked) => updateSetting("sidebarCollapsed", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="preview-visible" className="font-medium">
                        Show Preview Pane
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Display event details in a side panel
                      </p>
                    </div>
                    <Switch
                      id="preview-visible"
                      checked={settings.previewPaneVisible}
                      onCheckedChange={(checked) => updateSetting("previewPaneVisible", checked)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Holiday Management */}
                <div className="space-y-3">
                  <Label>Holidays</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage which holidays are displayed on your calendar.
                  </p>
                  <HolidayManagementDialog />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Integrations</CardTitle>
                <CardDescription>
                  Connect external calendars to sync your events across platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <GoogleCalendarSync
                  isConnected={false}
                  onConnect={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Google Calendar OAuth integration requires additional setup. Use iCal import/export for now.",
                    });
                  }}
                  onDisconnect={() => {}}
                  onSync={() => {}}
                />

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">iCal Import/Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the Import/Export button in the main dashboard to manually sync events 
                    with any calendar application that supports the iCal (.ics) format, including 
                    Apple Calendar, Outlook, and Google Calendar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Synapflow</CardTitle>
                <CardDescription>
                  Your intelligent productivity companion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">S</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Synapflow</h3>
                    <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Synapflow is a modern productivity app designed to help you manage your time,
                    tasks, and schedule with the power of AI. Stay organized, focused, and productive.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open("https://docs.lovable.dev", "_blank")}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help & Documentation
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Send Feedback",
                        description: "Thank you for your interest! Feedback form coming soon.",
                      });
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Send Feedback
                  </Button>
                </div>

                <Separator />

                <div className="text-center text-xs text-muted-foreground">
                  <p>Made with ❤️ using Lovable</p>
                  <p className="mt-1">© 2025 Synapflow. All rights reserved.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
