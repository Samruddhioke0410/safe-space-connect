import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertTriangle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "user1" | "user2";
  timestamp: Date;
  flagged?: boolean;
}

const DualChatDemo = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user1Input, setUser1Input] = useState("");
  const [user2Input, setUser2Input] = useState("");
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // PII detection patterns
  const detectPII = (text: string): { hasPII: boolean; type?: string } => {
    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    // Phone number patterns (various formats)
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/;
    // Address pattern (simple - number followed by street)
    const addressPattern = /\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/i;
    // SSN pattern
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    // Credit card pattern (simple)
    const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
    // Full name pattern (first and last name capitalized)
    const fullNamePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;

    if (emailPattern.test(text)) {
      return { hasPII: true, type: "email address" };
    }
    if (phonePattern.test(text)) {
      return { hasPII: true, type: "phone number" };
    }
    if (addressPattern.test(text)) {
      return { hasPII: true, type: "physical address" };
    }
    if (ssnPattern.test(text)) {
      return { hasPII: true, type: "Social Security Number" };
    }
    if (creditCardPattern.test(text)) {
      return { hasPII: true, type: "credit card number" };
    }
    if (fullNamePattern.test(text)) {
      return { hasPII: true, type: "full name" };
    }

    return { hasPII: false };
  };

  const sendMessage = (sender: "user1" | "user2", content: string) => {
    if (!content.trim()) return;

    const piiCheck = detectPII(content);
    
    if (piiCheck.hasPII) {
      setPiiWarning(`⚠️ Warning: Potential ${piiCheck.type} detected! For your safety, avoid sharing personal information.`);
      setTimeout(() => setPiiWarning(null), 5000);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      flagged: piiCheck.hasPII,
    };

    setMessages((prev) => [...prev, newMessage]);

    if (sender === "user1") {
      setUser1Input("");
    } else {
      setUser2Input("");
    }
  };

  const renderChatSide = (
    side: "user1" | "user2",
    label: string,
    input: string,
    setInput: (value: string) => void
  ) => (
    <div className="flex flex-col h-full">
      <div className="bg-primary/10 p-3 rounded-t-lg flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">{label}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card/50 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Start the conversation...
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender === side;
            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <div className={`flex-1 max-w-[80%]`}>
                  <div
                    className={`rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    } ${message.flagged ? "ring-2 ring-destructive" : ""}`}
                  >
                    {message.flagged && (
                      <div className="flex items-center gap-1 text-xs mb-1 opacity-90">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Flagged content</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-card border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(side, input);
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(side, input)}
            size="icon"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {piiWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{piiWarning}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          {renderChatSide("user1", "You", user1Input, setUser1Input)}
        </Card>

        <Card className="overflow-hidden">
          {renderChatSide("user2", "Anonymous Peer", user2Input, setUser2Input)}
        </Card>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Demo Mode:</strong> This is a simulation showing both sides of the conversation. 
          In the real app, you'd only see your own interface. The system automatically detects and 
          flags personal information like emails, phone numbers, addresses, and names.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DualChatDemo;
