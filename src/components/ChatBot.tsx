import React, { useState } from "react";

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Read API key from .env.local
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // ✅ switched to gpt-4o-mini
          messages: [
            { role: "system", content: "You are a helpful assistant for VetCare+." },
            { role: "user", content: userMessage },
          ],
          max_tokens: 150,
        }),
      });

      // ✅ Handle rate limit error
      if (response.status === 429) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Rate limit hit. Please wait a few seconds and try again." }
        ]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("🔎 OpenAI raw response:", data);

      const botReply =
        data.choices?.[0]?.message?.content?.trim() ||
        `⚠️ OpenAI error: ${data.error?.message || "Unknown issue"}`;

      // Add bot message
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error connecting to AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot window */}
      {isOpen && (
        <div className="bg-white border rounded-lg shadow-lg w-80 h-96 flex flex-col">
          <div className="bg-blue-600 text-white p-2 rounded-t-lg">ChatBot</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-right"
                    : "bg-gray-100 text-left"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-2 text-gray-500 text-sm">Bot is typing...</div>
            )}
          </div>
          <div className="p-2 flex">
            <input
              type="text"
              className="flex-1 border rounded p-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
            />
            <button
              className="ml-2 bg-blue-600 text-white px-3 rounded"
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>
    </div>
  );
};

export default ChatBot;
