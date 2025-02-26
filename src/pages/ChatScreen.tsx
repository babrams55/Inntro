
import { useState, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface ChatState {
  matchId: string;
  currentPairId: string;
  otherPairNames: string;
  otherPairId: string;
}

const ChatScreen = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { matchId, currentPairId, otherPairNames } = (location.state as ChatState) || {
    matchId: '',
    currentPairId: '',
    otherPairNames: '',
    otherPairId: ''
  };

  useEffect(() => {
    if (!matchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No chat selected. Redirecting to home screen..."
      });
      navigate('/');
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load messages"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, toast, navigate]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          match_id: matchId,
          sender_pair_id: currentPairId,
          content: message.trim()
        });

      if (error) throw error;
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-white text-xl font-bold">{otherPairNames}</h1>
          <p className="text-gray-400 text-sm">Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_pair_id === currentPairId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender_pair_id === currentPairId
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-white"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">{formatTimestamp(msg.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
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
