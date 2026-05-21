import { Dialog, DialogContent } from "@/components/ui/dialog";
import { proxyUrl } from "./content-card";

interface ContentLightboxProps {
  url: string | null;
  onClose: () => void;
}

export function ContentLightbox({ url, onClose }: ContentLightboxProps) {
  return (
    <Dialog
      open={!!url}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center" onClick={onClose}>
          <img
            src={url ? proxyUrl(url) : ""}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
