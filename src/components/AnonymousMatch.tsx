import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shuffle, Loader2 } from "lucide-react";

interface AnonymousMatchProps {
  userId: string;
  onMatchFound: (matchId: string) => void;
}

const topics = [
  "Career Stress",
  "Relationship Issues",
  "Grief & Loss",
  "Coming Out",
  "Addiction Recovery",
  "Depression",
  "Anxiety",
  "Life Transitions",
];

const supportStyles = [
  { value: "listener", label: "Someone to listen" },
  { value: "empathy", label: "Empathy & understanding" },
  { value: "advice", label: "Practical advice" },
  { value: "shared-experience", label: "Shared experience" },
  { value: "encouragement", label: "Encouragement" },
  { value: "acceptance", label: "Acceptance" },
];

const AnonymousMatch = ({ userId, onMatchFound }: AnonymousMatchProps) => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [seekingSupport, setSeekingSupport] = useState(true);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const { toast } = useToast();

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const startMatching = async () => {
    if (!topic || selectedStyles.length === 0) return;
    
    setIsMatching(true);
    
    const { data, error } = await supabase.functions.invoke("match-users", {
      body: { 
        userId, 
        topic,
        seekingSupport,
        supportStyles: selectedStyles
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Matching failed",
        description: error.message,
      });
      setIsMatching(false);
      return;
    }

    if (data.matched) {
      toast({
        title: "Match found!",
        description: "You've been connected with a peer. Stay anonymous and be supportive.",
      });
      setOpen(false);
      onMatchFound(data.matchId);
    } else {
      toast({
        title: "Searching for a match...",
        description: "You'll be notified when someone joins",
      });
      
      // Poll for match every 3 seconds
      const pollInterval = setInterval(async () => {
        const { data: match } = await supabase
          .from("anonymous_matches")
          .select("*")
          .eq("id", data.matchId)
          .single();

        if (match?.status === "active") {
          clearInterval(pollInterval);
          toast({
            title: "Match found!",
            description: "You've been connected with a peer",
          });
          setOpen(false);
          onMatchFound(match.id);
          setIsMatching(false);
        }
      }, 3000);

      // Stop polling after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsMatching(false);
      }, 60000);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full">
        <Shuffle className="h-4 w-4 mr-2" />
        Anonymous Match
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find Anonymous Support</DialogTitle>
            <DialogDescription>
              You'll be matched with someone experiencing similar challenges. Both of you remain completely anonymous.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>What are you looking for?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={seekingSupport ? "default" : "outline"}
                  onClick={() => setSeekingSupport(true)}
                  className="flex-1"
                >
                  Seeking Support
                </Button>
                <Button
                  type="button"
                  variant={!seekingSupport ? "default" : "outline"}
                  onClick={() => setSeekingSupport(false)}
                  className="flex-1"
                >
                  Offering Support
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic..." />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Support Style Preferences</Label>
              <div className="space-y-2">
                {supportStyles.map((style) => (
                  <div key={style.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={style.value}
                      checked={selectedStyles.includes(style.value)}
                      onCheckedChange={() => toggleStyle(style.value)}
                    />
                    <label
                      htmlFor={style.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {style.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={startMatching} 
              disabled={!topic || selectedStyles.length === 0 || isMatching}
              className="w-full"
            >
              {isMatching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Match...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Start Matching
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Safety tip: Never share personal information. Stay anonymous for your protection.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnonymousMatch;
