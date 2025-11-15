import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  description: string;
  topic: string;
  icon: string;
  member_count: number;
  isMember?: boolean;
  latestMessage?: string;
  messageCount?: number;
}

interface ChannelListProps {
  onSelectChannel: (channelId: string) => void;
  selectedChannelId: string | null;
}

const ChannelList = ({ onSelectChannel, selectedChannelId }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });

    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data: channelsData } = await supabase
      .from("channels")
      .select("*")
      .order("name");

    if (channelsData && userId) {
      const { data: memberData } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", userId);

      const memberChannelIds = new Set(memberData?.map((m) => m.channel_id) || []);

      // Fetch latest messages for joined channels
      const channelsWithMetadata = await Promise.all(
        channelsData.map(async (channel) => {
          const isMember = memberChannelIds.has(channel.id);
          
          if (isMember) {
            const { data: messagesData } = await supabase
              .from("messages")
              .select("content")
              .eq("channel_id", channel.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id);

            return {
              ...channel,
              isMember,
              latestMessage: messagesData?.[0]?.content,
              messageCount: count || 0,
            };
          }

          return {
            ...channel,
            isMember,
          };
        })
      );

      setChannels(channelsWithMetadata);
    } else if (channelsData) {
      setChannels(channelsData);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to join channels",
      });
      return;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      // Already a member, just select the channel
      onSelectChannel(channelId);
      fetchChannels();
      return;
    }

    const { error } = await supabase
      .from("channel_members")
      .insert({ channel_id: channelId, user_id: userId });

    if (error) {
      // If it's a duplicate key error, treat as success
      if (error.code === "23505") {
        toast({
          title: "Already a member!",
          description: "You're already in this channel",
        });
        fetchChannels();
        onSelectChannel(channelId);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to join channel",
          description: error.message,
        });
      }
    } else {
      toast({
        title: "Joined channel!",
        description: "You can now participate in this channel",
      });
      fetchChannels();
      onSelectChannel(channelId);
    }
  };

  const joinedChannels = channels.filter((c) => c.isMember);
  const availableChannels = channels.filter((c) => !c.isMember);

  return (
    <div className="space-y-6">
      {/* Joined Channels Section */}
      {joinedChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Check className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Joined Channels
            </h2>
          </div>
          {joinedChannels.map((channel) => (
            <Card
              key={channel.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-soft ${
                selectedChannelId === channel.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectChannel(channel.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{channel.icon}</span>
                    <h3 className="font-semibold">{channel.name}</h3>
                    {channel.messageCount && channel.messageCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {channel.messageCount} messages
                      </span>
                    )}
                  </div>
                  {channel.latestMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {channel.latestMessage}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Available Channels Section */}
      {availableChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Available Channels
            </h2>
          </div>
          {availableChannels.map((channel) => (
            <Card
              key={channel.id}
              className="p-4 transition-all hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{channel.icon}</span>
                    <h3 className="font-semibold">{channel.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{channel.member_count} members</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinChannel(channel.id);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Join
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelList;
