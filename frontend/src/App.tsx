import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Navbar from "./pages/Navbar";
import Homepage from "./pages/Homepage";
import Home from "./pages/Home";
import FileSearch from "./pages/FileSearch";
import SignUp from "./pages/SignUp";
import StorageOverview from "./pages/profile/StorageOverview";
import Settings from "./pages/profile/Settings";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Footer from "./pages/Footer";
import HelpChatbot from "./HelpChatbot";
import "./assets/index.css";

const AppContent: React.FC = () => {
  const location = useLocation();

  // Pages that should NOT show the public navbar/footer
  const hideChrome = ["/login", "/file-search", "/storage-overview", "/settings", "/home"].includes(
    location.pathname
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      {!hideChrome && <Navbar />}
      <main className={hideChrome ? "" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/file-search"
            element={
              <ProtectedRoute>
                <FileSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storage-overview"
            element={
              <ProtectedRoute>
                <StorageOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
        <HelpChatbot />
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;