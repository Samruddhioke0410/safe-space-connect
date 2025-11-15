import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Clock } from "lucide-react";

interface PeerRequest {
  id: string;
  requester_id: string;
  message: string;
  created_at: string;
}

interface PeerRequestsListProps {
  userId: string;
}

const PeerRequestsList = ({ userId }: PeerRequestsListProps) => {
  const [requests, setRequests] = useState<PeerRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("peer_requests_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peer_requests",
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("peer_requests")
      .select("*")
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) setRequests(data);
  };

  const handleRequest = async (requestId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("peer_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: status === "accepted" ? "Request accepted" : "Request declined",
        description: status === "accepted" 
          ? "You can now chat with this peer privately" 
          : "Request has been declined",
      });
      fetchRequests();
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Pending Requests ({requests.length})
      </h3>
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <p className="text-sm mb-3">{request.message}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleRequest(request.id, "accepted")}
              className="flex-1"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRequest(request.id, "rejected")}
              className="flex-1"
            >
              <UserX className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PeerRequestsList;
