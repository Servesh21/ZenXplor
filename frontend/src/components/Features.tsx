
import React from "react";
import { motion } from "framer-motion";
import { Search, Cloud, FileSearch, Brain, Lock, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      className="glass-card rounded-xl p-6 h-full border border-purple-200/30 dark:border-purple-500/20 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      }}
      transition={{ delay }}
    >
      <div className="size-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/40 dark:to-purple-900/30 flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2 text-indigo-950 dark:text-indigo-200">{title}</h3>
      <p className="text-muted-foreground text-balance">{description}</p>
    </motion.div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: "Universal Search",
      description: "Search across all your files regardless of where they're stored, with a single unified interface."
    },
    {
      icon: <Cloud className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      title: "Cloud Integration",
      description: "Seamlessly connect to Google Drive, Dropbox, OneDrive, and Gmail to include all your files in searches."
    },
    {
      icon: <FileSearch className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Full-Text Search",
      description: "Search within document contents, not just filenames, with support for PDFs, Word docs, spreadsheets, and more."
    },
    {
      icon: <Brain className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
      title: "AI-Powered Ranking",
      description: "Smart results ranking based on relevance, usage patterns, and content meaning using advanced AI algorithms."
    },
    {
      icon: <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />,
      title: "Secure Access",
      description: "Industry-standard encryption and secure authentication to keep your data and search history private."
    },
    {
      icon: <Cpu className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      title: "Intelligent OCR",
      description: "Extract and search text from images and scanned documents with advanced optical character recognition."
    }
  ];
  
  return (
    <section id="features" className="py-20 md:py-24 bg-gradient-to-b from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/30">
      <div className="container px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-sm font-medium mb-4">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Everything You Need in One Search
          </h2>
          <p className="text-muted-foreground text-lg text-balance">
            Search through all your files with AI-powered ranking, full-text search, and integrations with all major cloud storage providers.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            initial: { opacity: 0 },
            animate: { 
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
              }
            }
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
