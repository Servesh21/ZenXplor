import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Fuse from "fuse.js";

const helpTopics: Record<string, Record<string, string>> = {
  default: {
    "how to search for a file": "Navigate to the 'File Search' page and type in the file name. Results will update in real-time.",
    "how does the file search work": "The app scans the selected directory and lists files matching your query. Partial matches are supported.",
    "how to switch to dark mode": "Click the dark/light toggle in the top navbar to switch themes. It remembers your preference.",
    "how to report bugs or feedback": "Reach out through GitHub Issues or the contact info in the footer section."
  },
  "/file-search": {
    "how to search for a file": "Type the file name in the input field and results will update instantly.",
    "how to change the search directory": "Click the folder icon to choose a new directory to search in.",
    "what types of files can i search": "You can search for any file types—filters may be added soon!"
  },
  "/profile": {
    "what does the profile page show": "The profile page displays your name, email, and storage usage.",
    "how to update my profile": "Click on 'Profile' from the navbar and you’ll see options to update your details."
  },
  "/login": {
    "how do I sign in": "Go to the Login page and authenticate via Clerk. Your session will be saved.",
    "how to sign out": "Use the dropdown in the navbar to find the Sign Out option."
  },
  "/storage-overview": {
    "what is the storage overview": "It shows how much disk space is used by files in your selected directory."
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
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden flex flex-col">
          <div className="bg-blue-600 text-white px-4 py-2 font-semibold">Help Chatbot</div>
          <div className="flex-grow overflow-y-auto px-4 py-2 space-y-2 max-h-96">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${msg.sender === "user" ? "bg-blue-100 dark:bg-blue-800 self-end" : "bg-gray-200 dark:bg-gray-700 self-start"}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-2 border-t dark:border-gray-700 flex">
            <input
              className="flex-grow p-2 rounded-l-lg border border-gray-300 dark:bg-gray-800 dark:text-white"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700">Send</button>
          </form>
        </div>
      )}
    </>
  );
};

export default HelpChatbot;
