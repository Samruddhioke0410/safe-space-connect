import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface PeerRequestModalProps {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

const PeerRequestModal = ({ open, onClose, recipientId, recipientName }: PeerRequestModalProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendRequest = async () => {
    setIsSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to send peer requests",
      });
      setIsSending(false);
      return;
    }

    const { error } = await supabase.from("peer_requests").insert({
      requester_id: user.id,
      recipient_id: recipientId,
      message: message || "I'd like to connect with you for peer support",
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: error.message,
      });
    } else {
      toast({
        title: "Request sent!",
        description: `Your support request has been sent to ${recipientName}`,
      });
      setMessage("");
      onClose();
    }

    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Request 1:1 Support
          </DialogTitle>
          <DialogDescription>
            Send a peer support request to {recipientName}. They can accept or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Add a brief message about what kind of support you're looking for..."
            className="min-h-[100px]"
          />
          
          <p className="text-xs text-muted-foreground">
            Remember: Keep your message anonymous. Don't share personal information.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={sendRequest} disabled={isSending}>
            {isSending ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PeerRequestModal;
