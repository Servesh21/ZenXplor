
import React from "react";
import { motion } from "framer-motion";
import { File, FileText, Image, FileSpreadsheet, FileVideo, Download, ExternalLink, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: string;
    modified: string;
    source: string;
    previewUrl?: string;
  };
  className?: string;
  index?: number;
}

const FileCard: React.FC<FileCardProps> = ({ file, className, index = 0 }) => {
  const getFileIcon = () => {
    switch (file.type) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "image":
        return <Image className="h-8 w-8 text-blue-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case "video":
        return <FileVideo className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };
  
  const getSourceIcon = () => {
    switch (file.source) {
      case "google-drive":
        return (
          <div className="size-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <img src="https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" alt="Google Drive" className="w-3.5 h-3.5" />
          </div>
        );
      case "dropbox":
        return (
          <div className="size-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <img src="https://www.svgrepo.com/show/305282/dropbox.svg" alt="Dropbox" className="w-3.5 h-3.5" />
          </div>
        );
      case "onedrive":
        return (
          <div className="size-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Microsoft_One_Drive.svg/2048px-Microsoft_One_Drive.svg.png" alt="OneDrive" className="w-3.5 h-3.5" />
          </div>
        );
      case "gmail":
        return (
          <div className="size-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <img src="https://www.svgrepo.com/show/349338/gmail.svg" alt="Gmail" className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="size-6 rounded-full bg-secondary flex items-center justify-center">
            <File className="w-3.5 h-3.5" />
          </div>
        );
    }
  };
  
  return (
    <motion.div 
      className={cn(
        "glass-card rounded-xl overflow-hidden flex flex-col",
        "transition-all duration-300",
        "hover:shadow-md hover:scale-[1.01] hover:bg-white/90 dark:hover:bg-black/30",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {file.type === "image" && file.previewUrl && (
        <div className="w-full aspect-video bg-gray-100 overflow-hidden">
          <img 
            src={file.previewUrl} 
            alt={file.name} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-4">
          {getFileIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate">{file.name}</h3>
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            <span>{file.size}</span>
            <span className="mx-2">•</span>
            <span>{file.modified}</span>
            <span className="mx-2">•</span>
            <div className="flex items-center">
              {getSourceIcon()}
              <span className="ml-1">{file.source}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto flex items-center p-3 border-t border-border/30 bg-secondary/40">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only">Open</span>
        </Button>
        
        <div className="flex-1"></div>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default FileCard;
