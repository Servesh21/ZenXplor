import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";


const sources = [
  "Local Files",
  "Google Drive",
  "Gmail Attachments",
  "OneDrive",
  "Dropbox",
];

const features = [
  { title: "Smart Search", desc: "AI-powered search helps you find files instantly, even across cloud storage.", icon: "🔍" },
  { title: "Cloud Sync", desc: "Securely access and manage your files from anywhere, on any device.", icon: "☁️" },
  { title: "Blazing Fast", desc: "Lightning-fast indexing ensures no delay in retrieving files.", icon: "⚡" },
  { title: "Privacy First", desc: "Your data remains safe with industry-standard encryption.", icon: "🔒" },
  { title: "Cross-Platform", desc: "Seamlessly works on desktop, mobile, and web.", icon: "💻" },
  { title: "User-Friendly", desc: "Minimalist UI designed for maximum productivity.", icon: "✨" },
];

const Homepage: React.FC = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [typingForward, setTypingForward] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (typingForward) {
        if (charIndex < sources[index].length) {
          setDisplayedText((prev) => prev + sources[index][charIndex]);
          setCharIndex((prev) => prev + 1);
        } else {
          setTimeout(() => setTypingForward(false), 1000);
        }
      } else {
        if (charIndex > 0) {
          setDisplayedText((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        } else {
          setTypingForward(true);
          setIndex((prevIndex) => (prevIndex + 1) % sources.length);
        }
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, [charIndex, typingForward, index]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-white text-gray-900 flex flex-col overflow-hidden">
      <div className="aurora absolute inset-0 pointer-events-none" />
      
      <header className="relative flex flex-col items-center justify-center text-center h-screen px-6">
      
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-bold leading-tight text-gray-800"
        >
          Find Files Instantly
        </motion.h1>

        <motion.p
          className="text-3xl text-gray-700 mt-4 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Instantly locate any file from
          <span className="text-blue-600 font-bold ml-2">{displayedText}</span>
          {cursorVisible && <span className="text-blue-600">|</span>}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl text-gray-600 mt-6"
        >
          A simple, fast, and secure way to locate your files.
        </motion.p>

        <Link
          to="/login"
          className="mt-6 px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition duration-300 rounded-full shadow-md"
        >
          Get Started
        </Link>
        
      </header>
    
      <section className="w-full py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800">Key Features</h2>
          <p className="text-center text-gray-600 mt-2">Everything you need for effortless file searching.</p>

          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center w-64"
              >
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-gray-600 mt-2">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Homepage;
