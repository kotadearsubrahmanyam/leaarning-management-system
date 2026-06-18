import React from "react";
import { motion } from "framer-motion";
import { FileText, Video, Download, CheckCircle, Eye } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
 
export interface Material {
  id: string;
  courseId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  size: string;
  createdAt: string;
  isCompleted?: boolean;
}
 
interface MaterialCardProps {
  material: Material;
  index: number;
  onToggleComplete?: (id: string) => void;
}
 
export function MaterialCard({ material, index, onToggleComplete }: MaterialCardProps) {
  const isVideo = material.fileType.toLowerCase().includes("video");
 
  const trackDownload = useMutation({
    mutationFn: async () => {
      await fetch("/api/student/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: material.id }),
      });
    }
  });
 
  const handleView = () => {
    window.open(material.fileUrl, "_blank", "noopener,noreferrer");
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleView}
      className="glass p-4 rounded-xl flex items-center justify-between group hover:shadow-[0_15px_30px_rgba(var(--primary),0.1)] transition-all cursor-pointer border border-white/5"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${isVideo ? "bg-primary/20 text-primary" : "bg-sky-500/20 text-sky-400"}`}>
          {isVideo ? <Video size={24} /> : <FileText size={24} />}
        </div>
        <div>
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {material.title}
          </h4>
          <div className="flex items-center space-x-3 text-xs text-foreground/50 mt-1">
            <span className="uppercase">{material.fileType.split('/')[1] || material.fileType}</span>
            <span>•</span>
            <span>{material.size}</span>
            <span>•</span>
            <span>{new Date(material.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
 
      <div className="flex items-center space-x-2">
        {onToggleComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(material.id);
            }}
            className={`p-2 rounded-full transition-all ${
              material.isCompleted 
                ? "bg-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                : "bg-white/5 text-foreground/50 hover:bg-green-500/10 hover:text-green-500"
            }`}
          >
            <CheckCircle size={20} />
          </button>
        )}
        
        {/* View Button */}
        <a 
          href={material.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          title="View Material"
          className="p-2 rounded-full bg-white/5 hover:bg-sky-500/20 text-foreground/70 hover:text-sky-400 transition-all md:opacity-0 md:group-hover:opacity-100 opacity-100"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Eye size={20} />
        </a>
 
        {/* Download Button */}
        <a 
          href={material.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          download
          title="Download Material"
          className="p-2 rounded-full bg-white/5 hover:bg-primary/20 text-foreground/70 hover:text-primary transition-all md:opacity-0 md:group-hover:opacity-100 opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            trackDownload.mutate();
          }}
        >
          <Download size={20} />
        </a>
      </div>
    </motion.div>
  );
}

