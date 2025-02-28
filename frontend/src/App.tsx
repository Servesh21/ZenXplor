import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";
import FileSearch from "./components/FileSearch";
import SignUp from "./components/SignUp";
import StorageOverview from "./components/StorageOverview";
import SignInCallback from "./SignInCallback";
import Profile from "./components/profile/Profile";
import Settings from "./components/profile/Settings";
import Footer from "./components/Footer";
import { ClerkProvider } from "@clerk/clerk-react";
import "./assets/index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App: React.FC = () => {
  // Load dark mode state from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem("darkMode") || "false");
  });

  // Apply dark mode class to <html> on change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className={`flex flex-col min-h-screen ${darkMode ? "bg-gray-800 text-white" : ""}`}>
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/file-search" element={<FileSearch />} />
              <Route path="/login" element={<SignUp />} />
              <Route path="/storage-overview" element={<StorageOverview />} />
              <Route path="/oauth-callback" element={<SignInCallback />} />
              <Route path="/profile" element={<Profile  darkMode={darkMode}  />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ClerkProvider>
  );
};

export default App;