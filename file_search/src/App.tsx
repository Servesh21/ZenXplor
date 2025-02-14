import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
 import HomePage from "./components/Homepage";
import FileSearch from "./components/FileSearch";
import SignUp from "./components/SignUp";
import StorageOverview from "./components/StorageOverview";
import "./assets/index.css";

const App: React.FC = () => {
  return (
    <Router>
      {/* Wrapper div for the entire page layout */}
      <div className="flex flex-col min-h-screen">
        <Navbar />

        {/* Main content wrapper with flex-grow to push footer down */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/file-search" element={<FileSearch />} />
            <Route path="/login" element={<SignUp />} />
            <Route path="/storage-overview" element={<StorageOverview />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
