import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";

interface WindowControlsProps {
  onClose?: () => void;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

export const WindowControls = ({ onClose, onMaximize, onMinimize }: WindowControlsProps) => {
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      console.log("Minimize clicked - handler not implemented");
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else {
      console.log("Maximize clicked - handler not implemented");
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      console.log("Close clicked - handler not implemented");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMinimize}
        className="h-8 w-8 hover:bg-muted"
        title="Minimize"
      >
        <Minimize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMaximize}
        className="h-8 w-8 hover:bg-muted"
        title="Maximize"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
