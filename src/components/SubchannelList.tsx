import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Hash } from "lucide-react";

interface Subchannel {
  id: string;
  name: string;
  description: string | null;
}

interface SubchannelListProps {
  channelId: string;
  onSelect: (subchannelId: string) => void;
  selectedSubchannelId: string | null;
}

const SubchannelList = ({ channelId, onSelect, selectedSubchannelId }: SubchannelListProps) => {
  const [subchannels, setSubchannels] = useState<Subchannel[]>([]);

  useEffect(() => {
    fetchSubchannels();
  }, [channelId]);

  const fetchSubchannels = async () => {
    const { data } = await supabase
      .from("subchannels")
      .select("*")
      .eq("channel_id", channelId)
      .order("name");

    if (data) setSubchannels(data);
  };

  if (subchannels.length === 0) return null;

  return (
    <div className="pl-4 space-y-1">
      {subchannels.map((subchannel) => (
        <Button
          key={subchannel.id}
          variant={selectedSubchannelId === subchannel.id ? "secondary" : "ghost"}
          className="w-full justify-start text-sm h-9"
          onClick={() => onSelect(subchannel.id)}
        >
          <Hash className="h-3 w-3 mr-2" />
          {subchannel.name}
        </Button>
      ))}
    </div>
  );
};

export default SubchannelList;
