import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TypingAnimation from "./TypingAnimation";
import { 
  Search, 
  FileText, 
  Cloud, 
  Shield, 
  Zap, 
  Layers,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun
} from "lucide-react";

const sources: string[] = [
  "Local Files",
  "Google Drive",
  "Gmail Attachments",
  "Google Photos",
  "Dropbox",
];

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const features: Feature[] = [
  { 
    title: "Smart Search", 
    desc: "Elasticsearch helps you find files instantly, even across cloud storage.", 
    icon: <Search className="w-full h-full" />,
    color: "from-blue-500 to-cyan-400"
  },
  { 
    title: "Cloud Sync", 
    desc: "Securely access and manage your files from anywhere, on any device.", 
    icon: <Cloud className="w-full h-full" />,
    color: "from-indigo-500 to-purple-400"
  },
  { 
    title: "Blazing Fast", 
    desc: "Lightning-fast indexing ensures no delay in retrieving files.", 
    icon: <Zap className="w-full h-full" />,
    color: "from-amber-500 to-yellow-400"
  },
  { 
    title: "Privacy First", 
    desc: "Your data remains safe with industry-standard encryption.", 
    icon: <Shield className="w-full h-full" />,
    color: "from-green-500 to-emerald-400"
  },
  { 
    title: "Advanced Filtering", 
    desc: "Filter Files By Type, Storage Platfroms.", 
    icon: <Layers className="w-full h-full" />,
    color: "from-fuchsia-500 to-pink-400"
  },
  { 
    title: "User-Friendly", 
    desc: "Minimalist UI designed for maximum productivity.", 
    icon: <FileText className="w-full h-full" />,
    color: "from-blue-500 to-sky-400"
  },
];

const Homepage: React.FC = () => {

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white flex flex-col overflow-hidden transition duration-300">
     
      
      

      {/* Background elements - made more subtle and modern */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-400/5 to-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-400/5 to-blue-500/5 rounded-full blur-3xl" />
      
      {/* Updated abstract shapes */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 dark:opacity-10" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d="M0,0 C200,100 300,200 400,100 C500,0 600,100 1000,50 L1000,0 Z" fill="url(#grad1)" />
        <path d="M0,1000 C150,900 350,850 500,950 C650,1050 750,900 1000,950 L1000,1000 Z" fill="url(#grad1)" />
      </svg>
      
      {/* Animated floating icons with improved visual style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 - 50 + "%", 
              y: Math.random() * 100 - 50 + "%", 
              opacity: 0,
              rotate: Math.random() * 30 - 15
            }}
            animate={{ 
              y: [`${Math.random() * 10 - 5}%`, `${Math.random() * 10 - 5}%`], 
              opacity: Math.random() * 0.2 + 0.05,
              rotate: [Math.random() * 10 - 5, Math.random() * 10 - 5]
            }}
            transition={{ 
              y: { duration: Math.random() * 5 + 8, repeat: Infinity, repeatType: "reverse" },
              rotate: { duration: Math.random() * 5 + 10, repeat: Infinity, repeatType: "reverse" },
              delay: Math.random() * 2
            }}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            {i % 5 === 0 && <FileText size={Math.random() * 24 + 16} className="text-blue-400/20 dark:text-blue-400/10" />}
            {i % 5 === 1 && <Cloud size={Math.random() * 24 + 16} className="text-indigo-400/20 dark:text-indigo-400/10" />}
            {i % 5 === 2 && <Search size={Math.random() * 24 + 16} className="text-cyan-400/20 dark:text-cyan-400/10" />}
            {i % 5 === 3 && <Zap size={Math.random() * 24 + 16} className="text-amber-400/20 dark:text-amber-400/10" />}
            {i % 5 === 4 && <Shield size={Math.random() * 24 + 16} className="text-green-400/20 dark:text-green-400/10" />}
          </motion.div>
        ))}
      </motion.div>

      {/* Hero section with refined layout and transitions */}
      <header className="relative flex flex-col items-center justify-center text-center min-h-screen pt-20 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center max-w-4xl mx-auto"
        >
          {/* Modern badge design */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full font-medium text-sm flex items-center gap-2"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>Next-Gen File Search Technology</span>
          </motion.div>

          {/* Glass effect on logo container */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-8 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <Search size={48} className="text-white" />
          </motion.div>

          {/* Modern typography with enhanced gradient */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="text-gray-900 dark:text-white">Find</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500">
              Files Instantly
            </span>
          </motion.h1>
        </motion.div>

        <motion.div
          className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mt-2 font-medium flex items-center justify-center flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span>Instantly locate any file from</span>
          <span className="relative">
            <span className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/30 rounded-md -z-10 blur"></span>
            <TypingAnimation textList={sources} />
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mt-6 max-w-2xl"
        >
          A simple, fast, and secure way to locate your files across all your storage solutions with AI-powered search capabilities.
        </motion.p>

        {/* Feature icons with glass morphism effect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mt-10"
        >
          {features.slice(0, 3).map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="flex flex-col items-center group"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-xl backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-lg border border-white/20 dark:border-gray-700/30 p-3 mb-3 overflow-hidden">
                <div className={`w-8 h-8 text-white bg-gradient-to-br ${feature.color} rounded-lg`}>
                  {feature.icon}
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Modern call-to-action buttons with enhanced visual effects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link
            to="/login"
            className="mb-3 group relative inline-flex items-center justify-center px-8 py-3.5 text-lg font-medium overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-xl shadow-lg"
          >
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-white/30 to-blue-500/0 -translate-x-full transform transition-transform duration-700 ease-in-out group-hover:translate-x-full"></span>
            <span className="relative flex items-center">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          

        </motion.div>

        {/* Modernized scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          whileHover={{ y: 5 }}
          className="absolute bottom-8 w-full flex justify-center cursor-pointer"
        >
          
        </motion.div>
      </header>

      {/* Features section with modern card design */}
      <section id="features" className="w-full py-24 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="inline-block text-sm font-semibold py-1 px-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mb-4">
              POWERFUL FEATURES
            </h2>
            <h3 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need for <br className="hidden sm:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                effortless file searching
              </span>
            </h3>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
              Our platform combines powerful technology with an intuitive interface to deliver the best file finding experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 dark:border-gray-700 group transition duration-300 overflow-hidden relative"
              >
                {/* Background gradient effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${feature.color} rounded-full opacity-5 -mr-10 -mt-10 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className={`w-14 h-14 flex items-center justify-center text-white rounded-xl mb-5 bg-gradient-to-br ${feature.color} shadow-md transition duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
                

              </motion.div>
            ))}
          </div>
          
          {/* Extra call-to-action at the bottom of features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
            >
              Explore all features
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;