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
import Footer from "./pages/Footer";
import { ClerkProvider } from "@clerk/clerk-react";
import "./assets/index.css";

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
              <Route path="/login" element={<SignUp setUser={setUser} />} /> 
              <Route path="/storage-overview" element={<StorageOverview />} />
              <Route path="/oauth-callback" element={<SignInCallback />} />
              <Route path="/profile" element={<Profile darkMode={darkMode} user={user} setUser={setUser} />} />
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