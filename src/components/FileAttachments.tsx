import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Image, File, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileAttachmentsProps {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileAttachments = ({
  attachments,
  onChange,
  disabled = false,
}: FileAttachmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewName, setPreviewName] = useState<string>("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image, PDF, or document file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the signed URL for the file
      const { data: urlData, error: urlError } = await supabase.storage
        .from("event-attachments")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (urlError) throw urlError;

      const attachmentData: FileAttachment = {
        name: file.name,
        url: urlData.signedUrl,
        type: file.type,
        size: file.size,
      };

      onChange([...attachments, JSON.stringify(attachmentData)]);

      toast({
        title: "File uploaded",
        description: `${file.name} has been attached.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onChange(newAttachments);
  };

  const handlePreview = (attachmentJson: string) => {
    try {
      const attachment: FileAttachment = JSON.parse(attachmentJson);
      setPreviewUrl(attachment.url);
      setPreviewType(attachment.type);
      setPreviewName(attachment.name);
    } catch {
      toast({
        title: "Preview error",
        description: "Could not preview this file.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    if (type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseAttachment = (attachmentJson: string): FileAttachment | null => {
    try {
      return JSON.parse(attachmentJson);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="w-full gap-2 bg-muted border-border"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload Files
          </>
        )}
      </Button>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((attachmentJson, index) => {
            const attachment = parseAttachment(attachmentJson);
            if (!attachment) return null;

            const isImage = attachment.type.startsWith("image/");

            return (
              <div
                key={index}
                className="relative group rounded-lg border border-border bg-muted/30 overflow-hidden"
              >
                {/* Thumbnail */}
                <div 
                  className="aspect-square cursor-pointer"
                  onClick={() => handlePreview(attachmentJson)}
                >
                  {isImage ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 p-2">
                      {attachment.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-destructive/70" />
                      ) : (
                        <File className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground mt-1 uppercase">
                        {attachment.name.split('.').pop()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => handlePreview(attachmentJson)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-background/90 to-transparent">
                  <p className="text-[10px] font-medium truncate text-foreground">
                    {attachment.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewType.startsWith("image/") && previewUrl && (
              <img
                src={previewUrl}
                alt={previewName}
                className="max-w-full h-auto rounded-md"
              />
            )}
            {previewType === "application/pdf" && previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-md"
                title={previewName}
              />
            )}
            {!previewType.startsWith("image/") &&
              previewType !== "application/pdf" &&
              previewUrl && (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <Button asChild>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      Download File
                    </a>
                  </Button>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
