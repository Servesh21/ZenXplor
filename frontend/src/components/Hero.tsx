
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SearchBar from "./SearchBar";
import { cn } from "@/lib/utils";
import { fadeIn, slideIn, typingContainer, typingCharacter } from "@/utils/animations";
import ThemeToggle from "./ThemeToggle";

const searchTypingPhrases = [
  "Search across Google Drive",
  "Find Gmail attachments",
  "Discover files in Dropbox",
  "Locate files on OneDrive",
  "Search through local storage"
];

const Hero: React.FC = () => {
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState(searchTypingPhrases[0]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingIndex((prev) => (prev + 1) % searchTypingPhrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    setDisplayText(searchTypingPhrases[typingIndex]);
  }, [typingIndex]);
  
  return (
    <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-gray-900 dark:to-gray-900 -z-10" />
      
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRjMC0yLjItMS44LTQtNC00cy00IDEuOC00IDQgMS44IDQgNCA0IDQtMS44IDQtNHptMC0zMGMwLTIuMi0xLjgtNC00LTRzLTQgMS44LTQgNCAxLjggNCA0IDQgNC0xLjggNC00em0wIDYwYzAtMi4yLTEuOC00LTQtNHMtNCAxLjgtNCA0IDEuOCA0IDQgNCA0LTEuOCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60 -z-10" />
      
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            Search All Your Files,
            <br />
            <span className="text-gradient-purple">
              Across Every Storage
            </span>
          </motion.h1>
          
          <motion.div
            className="mb-12 text-lg md:text-xl text-muted-foreground max-w-3xl"
            initial="initial"
            animate="animate"
            variants={slideIn("up")}
            transition={{ delay: 0.1 }}
          >
            <p className="text-balance">The universal search engine for all your files, powered by AI.</p>
            <div className="h-12 mt-2 flex items-center justify-center">
              <motion.div
                variants={typingContainer}
                initial="hidden"
                animate="show"
                key={typingIndex}
                className="flex overflow-hidden text-indigo-600 dark:text-indigo-400 font-medium"
              >
                {displayText.split("").map((char, index) => (
                  <motion.span
                    key={`${index}-${char}`}
                    variants={typingCharacter}
                    className={cn(
                      "inline-block",
                      char === " " ? "w-2" : ""
                    )}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SearchBar 
              expanded={true} 
              animated={true}
              className="w-full"
            />
          </motion.div>
          
          <motion.div 
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                <img src="https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" alt="Google Drive" className="w-4 h-4" />
              </div>
              <span>Google Drive</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Microsoft_One_Drive.svg/2048px-Microsoft_One_Drive.svg.png" alt="OneDrive" className="w-4 h-4" />
              </div>
              <span>OneDrive</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                <img src="https://www.svgrepo.com/show/305282/dropbox.svg" alt="Dropbox" className="w-4 h-4" />
              </div>
              <span>Dropbox</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                <img src="https://www.svgrepo.com/show/349338/gmail.svg" alt="Gmail" className="w-4 h-4" />
              </div>
              <span>Gmail</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
