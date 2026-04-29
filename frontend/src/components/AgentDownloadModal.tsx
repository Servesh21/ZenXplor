import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_DOWNLOAD_URL =
  "https://github.com/Servesh21/file_search1/releases/latest/download/zenxplor-agent.exe";

const DISMISS_KEY = "zenxplor_agent_modal_dismissed";

interface AgentDownloadModalProps {
  agentRunning: boolean;
}

const AgentDownloadModal: React.FC<AgentDownloadModalProps> = ({ agentRunning }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if agent isn't running AND user hasn't dismissed before
    if (!agentRunning && !localStorage.getItem(DISMISS_KEY)) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [agentRunning]);

  // If agent becomes running, auto-close
  useEffect(() => {
    if (agentRunning && visible) {
      setVisible(false);
    }
  }, [agentRunning, visible]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  const handleDownload = () => {
    window.open(AGENT_DOWNLOAD_URL, "_blank");
    // Don't auto-dismiss — they might still need instructions
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-surface-container border border-outline-variant/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Glow accent */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-[#8781ff] to-primary" />

              <div className="p-8">
                {/* Icon + Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span
                      className="material-symbols-outlined text-primary text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      desktop_windows
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface mb-1">
                      Desktop Agent Required
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      ZenXplor needs a lightweight desktop agent to index and search your local
                      files. It runs quietly in the background.
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <div className="bg-surface-container-low rounded-xl p-5 mb-6 border border-outline-variant/10">
                  <div className="space-y-3">
                    {[
                      { icon: "folder_open", text: "Index local files across all drives" },
                      { icon: "search", text: "Lightning-fast local file search" },
                      { icon: "shield", text: "Privacy-first — data stays on your machine" },
                    ].map(({ icon, text }) => (
                      <div key={icon} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {icon}
                        </span>
                        <span className="text-sm text-on-surface-variant">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] text-[#1a1b23] font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-[0_6px_20px_rgba(196,192,255,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download Agent
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-6 py-3.5 rounded-xl border border-outline-variant/20 text-on-surface-variant text-sm font-medium hover:bg-surface-container-high hover:text-on-surface transition-all"
                  >
                    Skip for now
                  </button>
                </div>

                <p className="text-[10px] text-on-surface-variant/50 text-center mt-4 font-mono uppercase tracking-widest">
                  Windows 10+ · ~15 MB · Auto-updates
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentDownloadModal;
