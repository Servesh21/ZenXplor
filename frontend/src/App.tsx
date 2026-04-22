import { BACKEND_URL } from "./api";
import React, { useEffect, useState } from "react";
import Navbar from "./pages/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import FileSearch from "./pages/FileSearch";
import SignUp from "./pages/SignUp";
import StorageOverview from "./pages/profile/StorageOverview";
import SignInCallback from "./SignInCallback";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/profile/Settings";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Footer from "./pages/Footer";
import { ClerkProvider } from "@clerk/clerk-react";
import "./assets/index.css";
import HelpChatbot from "./HelpChatbot";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const App: React.FC = () => {
  interface User {
    username: string;
    email: string;
    profile_picture?: string;
  }
  const [user, setUser] = useState<User | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem("darkMode") || "false");
  });

  useEffect(() => {
    const syncAgent = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/check-auth`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.token) {
            if (!user) setUser(data.user);
            // Push fresh token to the local agent every time this runs.
            // The agent saves it to config.ini and uses it for all sync operations.
            await fetch("http://127.0.0.1:7832/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jwt_token: data.token, backend_url: `${BACKEND_URL}` })
            }).catch(() => console.log("Agent not running — token push skipped."));
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    // Run immediately on mount, then every 5 minutes to keep the agent token fresh.
    syncAgent();
    const tokenRefreshInterval = setInterval(syncAgent, 5 * 60 * 1000);
    return () => clearInterval(tokenRefreshInterval);
  }, []);


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
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} user={user} setUser={setUser} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/file-search" element={<FileSearch />} />
              <Route path="/login" element={<SignUp user={user} setUser={setUser} />} />
              <Route path="/storage-overview" element={<StorageOverview />} />
              <Route path="/oauth-callback" element={<SignInCallback />} />
              <Route path="/profile" element={<Profile darkMode={darkMode} user={user} setUser={setUser} />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<TermsOfService darkMode={darkMode} />} />
              <Route path="/privacy" element={<PrivacyPolicy darkMode={darkMode} />} />

            </Routes>
            <HelpChatbot />
          </main>
          <Footer />
        </div>
      </Router>
    </ClerkProvider>
  );
};

export default App;