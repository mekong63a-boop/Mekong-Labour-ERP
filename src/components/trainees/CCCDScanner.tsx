import { useState, useRef } from "react";
import { CreditCard, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CCCDData {
  full_name?: string;
  birth_date?: string;
  gender?: string;
  cccd_number?: string;
  cccd_date?: string;
  cccd_place?: string;
  permanent_address?: string;
  ethnicity?: string;
}

interface CCCDScannerProps {
  onDataExtracted: (data: CCCDData) => void;
}

export function CCCDScanner({ onDataExtracted }: CCCDScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<"front" | "back" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleOpenScanner = (type: "front" | "back") => {
    setScanType(type);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setScanType(null);
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    setIsScanning(true);
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Call edge function for OCR
      const { data, error } = await supabase.functions.invoke("scan-cccd", {
        body: {
          image: base64,
          side: scanType,
        },
      });

      if (error) throw error;

      if (data?.extracted) {
        onDataExtracted(data.extracted);
        toast({
          title: `Quét ${scanType === "front" ? "mặt trước" : "mặt sau"} thành công`,
          description: "Thông tin đã được điền vào form",
        });
      } else {
        toast({
          title: "Không thể đọc thông tin từ ảnh",
          description: "Vui lòng thử lại với ảnh rõ hơn",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      toast({
        title: "Lỗi khi quét CCCD",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setPreviewImage(null);
      setScanType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
      />

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleOpenScanner("front")}
          disabled={isScanning}
        >
          {isScanning && scanType === "front" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Mặt trước
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleOpenScanner("back")}
          disabled={isScanning}
        >
          {isScanning && scanType === "back" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Mặt sau
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Đang quét {scanType === "front" ? "mặt trước" : "mặt sau"} CCCD...
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {previewImage && (
              <img
                src={previewImage}
                alt="CCCD Preview"
                className="w-full rounded-lg"
              />
            )}
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Đang nhận dạng...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
