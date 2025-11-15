import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface MessageListProps {
  channelId: string;
  onUserClick?: (userId: string, userName: string) => void;
}

const MessageList = ({ channelId, onUserClick }: MessageListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!channelId) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
    }
  };

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.user_id === currentUserId;
          const displayName = isOwnMessage ? "You" : "Anonymous User";
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
            >
              <div 
                className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${
                  !isOwnMessage && onUserClick ? "cursor-pointer hover:bg-primary/20 transition-colors" : ""
                }`}
                onClick={() => {
                  if (!isOwnMessage && onUserClick) {
                    onUserClick(message.user_id, displayName);
                  }
                }}
              >
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className={`flex-1 max-w-[70%] ${isOwnMessage ? "items-end" : ""}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span 
                    className={`text-sm font-medium ${
                      !isOwnMessage && onUserClick ? "cursor-pointer hover:underline" : ""
                    }`}
                    onClick={() => {
                      if (!isOwnMessage && onUserClick) {
                        onUserClick(message.user_id, displayName);
                      }
                    }}
                  >
                    {displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-card"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
