import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "./ui/button";
import { X, Download, Smartphone, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const PWAInstallPrompt = () => {
  const { canInstall, isOnline, needsUpdate, promptInstall, updateApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  // Show offline toast when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineToast(true);
      const timer = setTimeout(() => setShowOfflineToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  return (
    <>
      {/* Install Banner */}
      {canInstall && !isDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Install Synapflow</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add to your home screen for quick access and offline use
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstall} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsDismissed(true)}
                  >
                    Not now
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setIsDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Toast */}
      {showOfflineToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-warning text-warning-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {needsUpdate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-primary" />
            <span className="text-sm">New version available</span>
            <Button size="sm" onClick={updateApp} className="gap-1.5">
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Persistent Offline Indicator */}
      {!isOnline && !showOfflineToast && (
        <div className="fixed bottom-4 right-4 z-40">
          <div
            className={cn(
              "bg-warning/90 text-warning-foreground px-3 py-1.5 rounded-full",
              "flex items-center gap-1.5 text-xs font-medium shadow-md"
            )}
          >
            <WifiOff className="h-3 w-3" />
            Offline
          </div>
        </div>
      )}
    </>
  );
};
