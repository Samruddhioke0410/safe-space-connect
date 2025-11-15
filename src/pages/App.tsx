import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, LogOut, MessageCircle, Sparkles, Users, ShoppingBag, MessageSquare, AlertTriangle, Shuffle } from "lucide-react";
import ChannelList from "@/components/ChannelList";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import PeerRequestsList from "@/components/PeerRequestsList";
import AnonymousMatch from "@/components/AnonymousMatch";
import Marketplace from "@/components/Marketplace";
import PrivateChat from "@/components/PrivateChat";
import DirectChatWithAI from "@/components/DirectChatWithAI";
import ChatRequestDialog from "@/components/ChatRequestDialog";
import PositiveFeed from "@/components/PositiveFeed";
import { useToast } from "@/hooks/use-toast";

const AppPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<{ id: string; name: string } | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<{ id: string; name: string } | null>(null);
  const [chatRequestDialog, setChatRequestDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: "",
  });
  const [activeTab, setActiveTab] = useState("channels");

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

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been safely signed out.",
    });
  };

  const handleUserClick = (clickedUserId: string, userName: string) => {
    if (clickedUserId === userId) return;
    
    setChatRequestDialog({
      open: true,
      userId: clickedUserId,
      userName: userName,
    });
  };

  const handleChatRequestAccepted = () => {
    setActiveChatUser({
      id: chatRequestDialog.userId,
      name: chatRequestDialog.userName,
    });
    setActiveTab("connect");
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    <div className="border-b p-4 bg-card">
                      <h3 className="font-semibold">Channel Chat</h3>
                      <p className="text-sm text-muted-foreground">Click on any user to start a 1:1 chat</p>
                    </div>
                    <MessageList channelId={selectedChannelId} onUserClick={handleUserClick} />
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
              {activeChatUser ? (
                <DirectChatWithAI 
                  userName={activeChatUser.name}
                  onBack={() => setActiveChatUser(null)}
                />
              ) : selectedMatch ? (
                <Card className="p-6">
                  <PrivateChat
                    userId={userId}
                    peerId={selectedMatch}
                    peerName="Anonymous Match"
                  />
                </Card>
              ) : selectedPeer ? (
                <Card className="p-6">
                  <PrivateChat
                    userId={userId}
                    peerId={selectedPeer.id}
                    peerName={selectedPeer.name}
                  />
                </Card>
              ) : (
                <>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Connect 1:1</h2>
                    <p className="text-muted-foreground mb-6">
                      Three ways to connect with peers for private support
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <MessageCircle className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold mb-1">From Group Chat</h3>
                        <p className="text-sm text-muted-foreground">
                          Click any user in channels to send a support request
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <Shuffle className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold mb-1">Anonymous Match</h3>
                        <p className="text-sm text-muted-foreground">
                          Match with someone facing similar challenges
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <Users className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold mb-1">Peer Requests</h3>
                        <p className="text-sm text-muted-foreground">
                          See and respond to incoming support requests
                        </p>
                      </div>
                    </div>

                    <PeerRequestsList userId={userId} />
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Find Anonymous Support</h3>
                    <p className="text-muted-foreground mb-4">
                      Get matched with someone who understands what you're going through
                    </p>
                    <AnonymousMatch 
                      userId={userId} 
                      onMatchFound={(matchId) => setSelectedMatch(matchId)} 
                    />
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <PositiveFeed userId={userId} />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-0">
            <div className="max-w-6xl mx-auto">
              <Marketplace />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Request Dialog */}
      <ChatRequestDialog
        open={chatRequestDialog.open}
        onOpenChange={(open) =>
          setChatRequestDialog({ ...chatRequestDialog, open })
        }
        userName={chatRequestDialog.userName}
        userId={chatRequestDialog.userId}
        onRequestAccepted={handleChatRequestAccepted}
      />
    </div>
  );
};

export default AppPage;
