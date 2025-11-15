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

      setChannels(
        channelsData.map((channel) => ({
          ...channel,
          isMember: memberChannelIds.has(channel.id),
        }))
      );
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

    const { error } = await supabase
      .from("channel_members")
      .insert({ channel_id: channelId, user_id: userId });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to join channel",
        description: error.message,
      });
    } else {
      toast({
        title: "Joined channel!",
        description: "You can now participate in this channel",
      });
      fetchChannels();
      onSelectChannel(channelId);
    }
  };

  return (
    <div className="space-y-3">
      {channels.map((channel) => (
        <Card
          key={channel.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-soft ${
            selectedChannelId === channel.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => channel.isMember && onSelectChannel(channel.id)}
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
            {channel.isMember ? (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <Check className="h-4 w-4" />
                Joined
              </div>
            ) : (
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
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ChannelList;
