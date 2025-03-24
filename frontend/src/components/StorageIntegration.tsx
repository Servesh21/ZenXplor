
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageOption {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

interface StorageIntegrationProps {
  className?: string;
}

const StorageIntegration: React.FC<StorageIntegrationProps> = ({ className }) => {
  const storageOptions: StorageOption[] = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
      connected: true
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "https://www.svgrepo.com/show/305282/dropbox.svg",
      connected: false
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Microsoft_One_Drive.svg/2048px-Microsoft_One_Drive.svg.png",
      connected: true
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: "https://www.svgrepo.com/show/349338/gmail.svg",
      connected: false
    },
    {
      id: "local",
      name: "Local Storage",
      icon: "https://www.svgrepo.com/show/499153/folder.svg",
      connected: true
    }
  ];
  
  return (
    <div className={className}>
      <h3 className="text-lg font-medium mb-4">Connected Storage</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {storageOptions.map((storage, index) => (
          <motion.div
            key={storage.id}
            className={cn(
              "relative overflow-hidden rounded-xl p-4 backdrop-blur-md",
              "border border-white/20 dark:border-white/5",
              storage.connected ? 
                "bg-white/60 dark:bg-white/5" : 
                "bg-secondary/60 dark:bg-white/5"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center">
              <div className="size-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-3">
                <img src={storage.icon} alt={storage.name} className="w-5 h-5" />
              </div>
              
              <div>
                <h4 className="font-medium">{storage.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {storage.connected ? "Connected" : "Not connected"}
                </p>
              </div>
              
              <div className="ml-auto">
                {storage.connected ? (
                  <div className="size-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="size-8 p-0 rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {storage.connected && (
              <div className="absolute bottom-0 left-0 right-0 h-1">
                <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 w-[85%]"></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StorageIntegration;
