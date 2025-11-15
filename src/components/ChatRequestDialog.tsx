import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userId: string;
  onRequestAccepted: () => void;
}

const ChatRequestDialog = ({
  open,
  onOpenChange,
  userName,
  userId,
  onRequestAccepted,
}: ChatRequestDialogProps) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendChatRequest = () => {
    setIsSending(true);
    
    toast({
      title: "Chat request sent",
      description: `Waiting for ${userName} to accept...`,
    });

    // Simulate acceptance after 1.5 seconds for demo
    setTimeout(() => {
      setIsSending(false);
      onOpenChange(false);
      
      toast({
        title: "Request accepted!",
        description: `${userName} accepted your chat request`,
      });
      
      onRequestAccepted();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div>Connect with {userName}</div>
              <div className="text-sm font-normal text-muted-foreground">
                Send a 1:1 chat request
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="pt-4">
            Start a private, anonymous conversation with this peer. Both of you will
            remain anonymous, and the system will automatically flag any personal
            information to keep you safe.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm">Safety Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Complete anonymity maintained</li>
            <li>• Automatic PII detection and blocking</li>
            <li>• Safe, supportive environment</li>
            <li>• You can end the chat at any time</li>
          </ul>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button onClick={sendChatRequest} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              "Send Chat Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRequestDialog;
