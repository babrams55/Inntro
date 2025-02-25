
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

// Temporary mock data
const mockMessages = [
  {
    id: 1,
    sender: "Mia & Zoe",
    content: "Hey! We're excited to meet up!",
    timestamp: "2:30 PM"
  },
  {
    id: 2,
    sender: "You",
    content: "Us too! How about pizza at Giordano's?",
    timestamp: "2:32 PM"
  }
];

const ChatScreen = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const navigate = useNavigate();

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "You",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => navigate('/swipe')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-white text-xl font-bold">Mia & Zoe</h1>
          <p className="text-gray-400 text-sm">Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.sender === "You"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-white"
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="icon"
            className="bg-pink-500 hover:bg-pink-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
