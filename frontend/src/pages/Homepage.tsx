import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TypingAnimation from "./TypingAnimation";
import { 
  Search, 
  FileText, 
  Cloud, 
  Shield, 
  Zap, 
  Layers,
  ArrowRight,
  ChevronDown
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
}

const features: Feature[] = [
  { 
    title: "Smart Search", 
    desc: "AI-powered search helps you find files instantly, even across cloud storage.", 
    icon: <Search className="text-blue-500" size={24} />
  },
  { 
    title: "Cloud Sync", 
    desc: "Securely access and manage your files from anywhere, on any device.", 
    icon: <Cloud className="text-blue-500" size={24} />
  },
  { 
    title: "Blazing Fast", 
    desc: "Lightning-fast indexing ensures no delay in retrieving files.", 
    icon: <Zap className="text-blue-500" size={24} />
  },
  { 
    title: "Privacy First", 
    desc: "Your data remains safe with industry-standard encryption.", 
    icon: <Shield className="text-blue-500" size={24} />
  },
  { 
    title: "Cross-Platform", 
    desc: "Seamlessly works on desktop, mobile, and web.", 
    icon: <Layers className="text-blue-500" size={24} />
  },
  { 
    title: "User-Friendly", 
    desc: "Minimalist UI designed for maximum productivity.", 
    icon: <FileText className="text-blue-500" size={24} />
  },
];


const Homepage: React.FC = () => {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white flex flex-col overflow-hidden transition duration-300">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      
      {/* Floating icons in the background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <motion.div 
          initial={{ y: -20, x: "10%", opacity: 0 }}
          animate={{ y: 0, opacity: 0.4 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/4 left-1/4"
        >
          <FileText size={48} className="text-blue-400/30" />
        </motion.div>
        <motion.div 
          initial={{ y: -15, x: "70%", opacity: 0 }}
          animate={{ y: 10, opacity: 0.3 }}
          transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/3 right-1/4"
        >
          <Cloud size={40} className="text-indigo-400/30" />
        </motion.div>
        <motion.div 
          initial={{ y: 10, x: "20%", opacity: 0 }}
          animate={{ y: -10, opacity: 0.2 }}
          transition={{ duration: 2.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-2/3 left-1/3"
        >
          <Search size={36} className="text-cyan-400/30" />
        </motion.div>
        <motion.div 
          initial={{ y: 5, x: "80%", opacity: 0 }}
          animate={{ y: -5, opacity: 0.3 }}
          transition={{ duration: 3.5, delay: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/2 right-1/5"
        >
          <Zap size={32} className="text-blue-500/30" />
        </motion.div>
      </motion.div>

      <header className="relative flex flex-col items-center justify-center text-center h-screen px-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 dark:bg-blue-600/30 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Logo icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg"
          >
            <Search size={40} className="text-white" />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Find Files Instantly
          </h1>
        </motion.div>

        <motion.div
          className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mt-6 font-medium flex items-center justify-center flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <span>Instantly locate any file from</span>
          <TypingAnimation textList={sources} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex items-center gap-6 mt-8"
        >
          {features.slice(0, 3).map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md mb-2">
                {feature.icon}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl text-gray-600 dark:text-gray-400 mt-6 max-w-lg"
        >
          A simple, fast, and secure way to locate your files across all your storage solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10"
        >
          <Link
            to="/login"
            className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-full shadow-lg"
          >
            <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-full group-hover:h-full opacity-10"></span>
            <span className="relative">Get Started</span>
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          whileHover={{ y: 5 }}
          className="absolute bottom-8 w-full flex justify-center cursor-pointer"
        >
          <ChevronDown className="w-8 h-8 text-gray-500 dark:text-gray-400 animate-bounce" />
        </motion.div>
      </header>

      <section className="w-full py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Background design elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full" />
          <div className="absolute top-40 -left-20 w-60 h-60 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full" />
          <div className="absolute -bottom-40 right-20 w-72 h-72 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="inline-block text-sm font-semibold py-1 px-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-3">
              POWERFUL FEATURES
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
              Everything you need for <br className="hidden sm:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                effortless file searching
              </span>
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl p-6 transition duration-300 border border-gray-100 dark:border-gray-700 group"
              >
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl mb-4 transition duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
export default Homepage;