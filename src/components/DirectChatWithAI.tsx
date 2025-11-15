import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertTriangle, User, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPII, detectCrisis } from "@/utils/safetyChecks";
import CrisisModal from "./CrisisModal";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  flagged?: boolean;
}

interface DirectChatWithAIProps {
  userName: string;
  onBack: () => void;
}

const DirectChatWithAI = ({ userName, onBack }: DirectChatWithAIProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hi! I'm ${userName}. Thanks for connecting with me!`,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'high' | 'medium' | 'low'>('low');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAIResponse = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: { 
          message: userMessage,
          userName: userName,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content
          }))
        },
      });

      if (error) throw error;
      return data.response;
    } catch (error) {
      console.error("AI response error:", error);
      return "I'm here to listen and support you. Please tell me more about what's on your mind.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    console.log("=== DIRECT CHAT SEND ===");
    console.log("Input:", input);

    // Use utility function for PII detection
    const piiCheck = detectPII(input);
    console.log("PII Check:", piiCheck);
    
    if (piiCheck.hasPII) {
      const typesText = piiCheck.types.join(', ');
      setPiiWarning(`⚠️ Warning: Potential ${typesText} detected! For your safety, this message cannot be sent. Please remove personal information.`);
      setTimeout(() => setPiiWarning(null), 5000);
      return;
    }

    // Check for crisis
    const crisisCheck = detectCrisis(input);
    console.log("Crisis Check:", crisisCheck);
    
    if (crisisCheck.isCrisis && crisisCheck.level !== 'none') {
      setCrisisLevel(crisisCheck.level);
      setCrisisModalOpen(true);
      
      toast({
        title: "Support resources available",
        description: "We've noticed you might be in distress. Please check the resources that appeared.",
      });
      
      if (crisisCheck.level === 'high') {
        console.log("HIGH CRISIS - Blocking send");
        return;
      }
      console.log("CRISIS DETECTED - Showing modal but allowing message");
    }

    // AI safety check
    console.log("Calling AI safety check...");
    const { data: safetyResult, error: safetyError } = await supabase.functions.invoke("ai-safety-check", {
      body: { message: input, context: { type: "direct_chat", userName } }
    });

    console.log("AI Safety Result:", safetyResult);
    console.log("AI Safety Error:", safetyError);

    if (safetyResult?.recommendation === "block") {
      toast({
        variant: "destructive",
        title: "Message blocked for safety",
        description: safetyResult.explanation,
      });
      return;
    }

    if (safetyResult?.recommendation === "resources" || safetyResult?.crisisLevel !== "none") {
      const detectedLevel = safetyResult.crisisLevel === "high" ? "high" : 
                           safetyResult.crisisLevel === "medium" ? "medium" : "low";
      setCrisisLevel(detectedLevel);
      setCrisisModalOpen(true);
      
      toast({
        title: "Support resources available",
        description: "We're here for you. Check the resources that appeared.",
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Get AI response
    const aiResponse = await getAIResponse(input);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {piiWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{piiWarning}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col h-[600px]">
          <div className="bg-primary/10 p-4 border-b flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{userName}</h3>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map((message) => {
              const isOwnMessage = message.sender === "user";
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className={`flex-1 max-w-[70%]`}>
                    <div
                      className={`rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-card"
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
            })}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-card border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message... (personal info will be blocked)"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                size="icon"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Demo Mode:</strong> This is an AI-powered peer responding to you. 
          The system automatically blocks messages containing personal information like emails, 
          phone numbers, addresses, SSNs, and credit cards.
        </AlertDescription>
      </Alert>

      <CrisisModal
        open={crisisModalOpen}
        onClose={() => setCrisisModalOpen(false)}
        level={crisisLevel}
      />
    </div>
  );
};

export default DirectChatWithAI;
