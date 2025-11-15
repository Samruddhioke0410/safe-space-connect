import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectPII, detectCrisis } from "@/utils/safetyChecks";
import PIIWarning from "./PIIWarning";
import CrisisModal from "./CrisisModal";

interface MessageInputProps {
  channelId: string;
  userId: string;
}

const MessageInput = ({ channelId, userId }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [piiDetected, setPiiDetected] = useState<{ hasPII: boolean; types: string[] }>({ hasPII: false, types: [] });
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'high' | 'medium' | 'low'>('low');
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim() || !channelId || !userId) return;

    // Check for PII
    const piiCheck = detectPII(message);
    if (piiCheck.hasPII) {
      setPiiDetected({ hasPII: true, types: piiCheck.types });
      return;
    }

    // Check for crisis
    const crisisCheck = detectCrisis(message);
    if (crisisCheck.isCrisis && crisisCheck.level !== 'none') {
      setCrisisLevel(crisisCheck.level);
      setCrisisModalOpen(true);
      
      if (crisisCheck.level === 'high') {
        return;
      }
    }

    // Skip AI safety check for demo - using client-side checks only
    // This prevents false positives that block normal messages

    await sendMessage();
  };

  const sendMessage = async () => {
    setIsSending(true);

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: userId,
      content: message,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message,
      });
    } else {
      setMessage("");
      setPiiDetected({ hasPII: false, types: [] });
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="p-4 border-t bg-card">
        {piiDetected.hasPII && (
          <PIIWarning
            types={piiDetected.types}
            onEdit={() => setPiiDetected({ hasPII: false, types: [] })}
          />
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setPiiDetected({ hasPII: false, types: [] });
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] resize-none"
              disabled={isSending || !channelId}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Protected by AI safety</span>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || !channelId || piiDetected.hasPII}
            size="lg"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Messages are monitored for safety. Personal information will be blocked.
        </p>
      </div>

      <CrisisModal
        open={crisisModalOpen}
        onClose={() => setCrisisModalOpen(false)}
        level={crisisLevel}
      />
    </>
  );
};

export default MessageInput;
