import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { uploadToStorage } from "@/lib/storage-utils";

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (url: string | null, file?: File | null) => void;
  traineeCode: string;
  /** If true, only preview the photo locally without uploading to Supabase */
  previewOnly?: boolean;
}

export function PhotoUpload({ currentPhotoUrl, onPhotoChange, traineeCode, previewOnly = false }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update preview when currentPhotoUrl changes (e.g., when loading existing trainee)
  useEffect(() => {
    if (currentPhotoUrl && !pendingFile) {
      setPreviewUrl(currentPhotoUrl);
    }
  }, [currentPhotoUrl, pendingFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chỉ chấp nhận file ảnh",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File quá lớn (tối đa 5MB)",
        variant: "destructive",
      });
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);

    if (previewOnly) {
      // Just pass the file back without uploading
      onPhotoChange(null, file);
      return;
    }

    // Upload immediately (for edit mode)
    setIsUploading(true);
    try {
      const fileName = `${traineeCode || "new"}_${Date.now()}.${file.name.split(".").pop()}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trainee-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("trainee-photos")
        .getPublicUrl(filePath);

      onPhotoChange(publicUrl);
      setPreviewUrl(publicUrl);
      setPendingFile(null);
      toast({ title: "Tải ảnh thành công" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Lỗi khi tải ảnh",
        description: error.message,
        variant: "destructive",
      });
      setPreviewUrl(currentPhotoUrl || null);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    // Revoke object URL to free memory
    if (pendingFile && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingFile(null);
    onPhotoChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        {previewUrl ? (
          <div className="relative w-24 h-32 rounded-lg overflow-hidden group">
            <img
              src={previewUrl}
              alt="Ảnh học viên"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowFullImage(true)}
            />
            {pendingFile && previewOnly && (
              <div className="absolute top-1 right-1">
                <span className="bg-yellow-500 text-white text-[10px] px-1 rounded">Chưa lưu</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setShowFullImage(true)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleRemovePhoto}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-24 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="h-8 w-8 mb-1" />
                <span className="text-xs">Ảnh 3x4</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full Image Dialog */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <img
            src={previewUrl || ""}
            alt="Ảnh học viên"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to upload a pending photo file
export async function uploadPhoto(file: File, traineeCode: string): Promise<string> {
  const fileName = `${traineeCode}_${Date.now()}.${file.name.split(".").pop()}`;
  const filePath = `photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("trainee-photos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("trainee-photos")
    .getPublicUrl(filePath);

  return publicUrl;
}
