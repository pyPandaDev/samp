import React from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ParsedImageRef } from "../../utils/feasibilityParsers";

export interface ImageLightboxModalProps {
  selectedImage: string | null;
  images: ParsedImageRef[];
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  selectedImage,
  images,
  onClose,
  onNavigate,
}) => {
  if (!selectedImage) return null;

  const validImages = images.filter((img) => Boolean(img.url));
  const currentIndex = validImages.findIndex((img) => img.url === selectedImage);
  const activeImageRef = validImages[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview Lightbox"
      className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-smooth-backdrop select-none"
      onClick={onClose}
    >
      {/* Lightbox Top Bar */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded text-white">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${validImages.length}` : "Image"}
          </span>
          <span className="text-xs text-neutral-300 font-medium truncate max-w-sm">
            {activeImageRef?.name || "Reference Attachment"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={selectedImage}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition flex items-center gap-1.5 px-3 text-xs"
            title="Open in new tab / Download"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Original</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev / Next Navigation Arrows */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition cursor-pointer z-10"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition cursor-pointer z-10"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Image Viewport */}
      <div
        className="relative max-w-full max-h-[85vh] flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={selectedImage}
          alt={activeImageRef?.name || "Reference image"}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded shadow-2xl"
        />
      </div>
    </div>
  );
};
