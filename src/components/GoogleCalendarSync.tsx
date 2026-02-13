import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Link, Unlink, RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";

interface GoogleCalendarSyncProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  lastSyncTime?: Date;
  isSyncing?: boolean;
}

export const GoogleCalendarSync = ({
  isConnected,
  onConnect,
  onDisconnect,
  onSync,
  lastSyncTime,
  isSyncing = false,
}: GoogleCalendarSyncProps) => {
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: "Google Calendar Integration",
      description: "This feature requires OAuth setup in Cloud Settings. Please configure Google OAuth credentials first.",
    });
    onConnect();
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>
                Sync your events with Google Calendar
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-green-500/20 text-green-400" : ""}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                Google Calendar sync requires OAuth configuration. You'll need to set up 
                Google OAuth credentials in your Cloud Settings to enable this feature.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnect} className="w-full gap-2">
              <Link className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last synced:</span>
              <span>
                {lastSyncTime
                  ? lastSyncTime.toLocaleString()
                  : "Never"}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onSync}
                disabled={isSyncing}
                className="flex-1 gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button
                variant="outline"
                onClick={onDisconnect}
                className="gap-2"
              >
                <Unlink className="h-4 w-4" />
                Disconnect
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Syncing will import new events from Google Calendar and export 
              your Synapflow events to your connected calendar.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open Google Calendar
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
