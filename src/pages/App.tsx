import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, LogOut, MessageCircle, Sparkles, Users, ShoppingBag, MessageSquare } from "lucide-react";
import ChannelList from "@/components/ChannelList";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import PeerRequestsList from "@/components/PeerRequestsList";
import AnonymousMatch from "@/components/AnonymousMatch";
import Marketplace from "@/components/Marketplace";
import PrivateChat from "@/components/PrivateChat";
import DualChatDemo from "@/components/DualChatDemo";
import { useToast } from "@/hooks/use-toast";

const AppPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [positiveFeed, setPositiveFeed] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    fetchPositiveFeed();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPositiveFeed = async () => {
    const { data } = await supabase
      .from("positive_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setPositiveFeed(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been safely signed out.",
    });
  };

  if (!userId) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">I Can't Tell Anyone</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="channels" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="connect" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Connect
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Positive
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Market
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-0">
            <div className="grid lg:grid-cols-[350px,1fr] gap-6 h-[calc(100vh-200px)]">
              {/* Channel List */}
              <div className="overflow-y-auto pr-2">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Support Channels</h2>
                </div>
                <ChannelList
                  onSelectChannel={setSelectedChannelId}
                  selectedChannelId={selectedChannelId}
                />
              </div>

              {/* Message Area */}
              <Card className="flex flex-col h-full">
                {selectedChannelId ? (
                  <>
                    <MessageList channelId={selectedChannelId} />
                    <MessageInput channelId={selectedChannelId} userId={userId} />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <MessageCircle className="h-12 w-12 mx-auto opacity-50" />
                      <p>Select a channel to start chatting</p>
                      <p className="text-sm">Join a channel from the list to participate</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connect" className="space-y-0">
            <div className="max-w-6xl mx-auto space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Connect 1:1 - Demo</h2>
                <p className="text-muted-foreground mb-6">
                  Experience how anonymous peer support works with automatic PII detection
                </p>
                
                <DualChatDemo />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-secondary" />
                <h2 className="text-lg font-semibold">Positive Feed</h2>
              </div>

              <div className="space-y-4">
                {positiveFeed.map((post) => (
                  <Card key={post.id} className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="text-muted-foreground mb-4">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>By {post.author}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes_count}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-0">
            <div className="max-w-6xl mx-auto">
              <Marketplace />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppPage;
