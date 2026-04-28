import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Fuse from "fuse.js";

const helpTopics: Record<string, Record<string, string>> = {
  default: {
    "how to search for a file": "Navigate to the 'File Search' page and type in the file name. Results will update in real-time.",
    "how does the file search work": "The app scans the selected directory and lists files matching your query. Partial matches are supported.",
    "how to report bugs or feedback": "Reach out through GitHub Issues or the contact info in the footer section."
  },
  "/file-search": {
    "how to search for a file": "Type the file name in the input field and results will update instantly.",
    "how to change the search directory": "Click the folder icon to choose a new directory to search in.",
    "what types of files can i search": "You can search for any file types—filters may be added soon!"
  },
  "/storage-overview": {
    "what is the integrations page": "It lets you connect cloud providers like Google Drive and Dropbox to centralize your file search.",
    "how to add multiple accounts": "Click 'Connect Another' on the integration card to add more accounts."
  },
  "/settings": {
    "how to update my profile": "Update your name, email, avatar or password in the Settings page and click 'Save changes'.",
    "how to change search preferences": "Use the Search Preferences section on the Settings page."
  }
};

const HelpChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const routePath = location.pathname;
  const faq = helpTopics[routePath] || helpTopics["default"];
  const fuse = new Fuse(Object.keys(faq), { includeScore: true, threshold: 0.4 });

  useEffect(() => {
    const saved = localStorage.getItem("helpChatHistory");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("helpChatHistory", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim().toLowerCase();
    const result = fuse.search(query);
    const answer = result.length ? faq[result[0].item] : "Sorry, I couldn't find a match. Try rephrasing your question.";

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      { sender: "bot", text: answer }
    ]);
    setInput("");
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(45deg, #c4c0ff 0%, #8781ff 100%)",
        }}
      >
        {open ? (
          <span className="material-symbols-outlined text-[#1a1b23] text-xl">close</span>
        ) : (
          <span className="material-symbols-outlined text-[#1a1b23] text-xl">help</span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-22 right-6 z-50 w-[340px] bg-surface-container border border-outline-variant/20 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl"
          style={{ maxHeight: "500px", animation: "slideUp 0.25s ease-out" }}
        >
          {/* Header */}
          <div className="bg-surface-container-high px-5 py-4 flex items-center gap-3 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary">support_agent</span>
            <div>
              <p className="text-sm font-semibold text-on-surface">ZenXplor Help</p>
              <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Always Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar" style={{ maxHeight: "340px" }}>
            {messages.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant/50 text-xs">
                <span className="material-symbols-outlined text-3xl text-primary/30 mb-2">chat_bubble</span>
                <p>Ask me anything about ZenXplor!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-3 rounded-xl max-w-[85%] ${
                  msg.sender === "user"
                    ? "bg-primary/15 text-on-surface ml-auto border border-primary/10"
                    : "bg-surface-container-high text-on-surface-variant mr-auto border border-outline-variant/10"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-outline-variant/10 flex gap-2 bg-surface-container-low"
          >
            <input
              className="flex-grow bg-surface-container-lowest border border-outline-variant/15 px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 outline-none transition-all"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] text-[#1a1b23] font-bold px-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default HelpChatbot;
