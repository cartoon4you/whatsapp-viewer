"use client";

import React from "react";
import { X, Download, ZoomIn } from "lucide-react";

interface MediaModalProps {
  mediaSrc: string | null;
  title?: string;
  onClose: () => void;
}

export default function MediaModal({ mediaSrc, title, onClose }: MediaModalProps) {
  if (!mediaSrc) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = mediaSrc;
    a.download = `whatsapp_media_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-950/80 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="text-xs font-semibold truncate text-slate-200">
            {title || "Image Preview"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)]">
          <img
            src={mediaSrc}
            alt="Preview"
            className="max-h-[80vh] w-auto max-w-full object-contain rounded-md shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
