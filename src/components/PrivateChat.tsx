import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectPII, detectCrisis } from "@/utils/safetyChecks";
import PIIWarning from "./PIIWarning";
import CrisisModal from "./CrisisModal";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface PrivateChatProps {
  userId: string;
  peerId: string;
  peerName: string;
}

const PrivateChat = ({ userId, peerId, peerName }: PrivateChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [piiDetected, setPiiDetected] = useState<{ hasPII: boolean; types: string[] }>({ hasPII: false, types: [] });
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'high' | 'medium' | 'low'>('low');
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("private_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, peerId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const piiCheck = detectPII(message);
    if (piiCheck.hasPII) {
      setPiiDetected({ hasPII: true, types: piiCheck.types });
      return;
    }

    const crisisCheck = detectCrisis(message);
    if (crisisCheck.isCrisis && crisisCheck.level !== 'none') {
      setCrisisLevel(crisisCheck.level);
      setCrisisModalOpen(true);
      if (crisisCheck.level === 'high') return;
    }

    // AI safety check
    const { data: safetyResult } = await supabase.functions.invoke("ai-safety-check", {
      body: { message, userId, context: { type: "private_chat", peerId } }
    });

    if (safetyResult?.recommendation === "block") {
      toast({
        variant: "destructive",
        title: "Message blocked",
        description: safetyResult.explanation,
      });
      return;
    }

    if (safetyResult?.recommendation === "escalate") {
      setCrisisLevel("high");
      setCrisisModalOpen(true);
      return;
    }

    setIsSending(true);
    const { error } = await supabase.from("private_messages").insert({
      sender_id: userId,
      recipient_id: peerId,
      content: message,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: error.message,
      });
    } else {
      setMessage("");
      setPiiDetected({ hasPII: false, types: [] });
    }
    setIsSending(false);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-card">
          <h3 className="font-semibold">Private Chat with {peerName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Shield className="h-3 w-3" />
            AI-monitored for safety
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`p-3 ${
                msg.sender_id === userId
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto"
              } max-w-[80%]`}
            >
              <p className="text-sm">{msg.content}</p>
            </Card>
          ))}
        </div>

        <div className="p-4 border-t bg-card">
          {piiDetected.hasPII && (
            <PIIWarning
              types={piiDetected.types}
              onEdit={() => setPiiDetected({ hasPII: false, types: [] })}
            />
          )}

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setPiiDetected({ hasPII: false, types: [] });
              }}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={!message.trim() || isSending} size="lg">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CrisisModal
        open={crisisModalOpen}
        onClose={() => setCrisisModalOpen(false)}
        level={crisisLevel}
      />
    </>
  );
};

export default PrivateChat;
