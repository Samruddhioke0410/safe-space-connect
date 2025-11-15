import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CreatePost from "./CreatePost";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  likes_count: number;
  image_url: string | null;
  created_at: string;
  user_id: string | null;
}

interface PositiveFeedProps {
  userId: string;
}

const PositiveFeed = ({ userId }: PositiveFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("PositiveFeed mounted with userId:", userId);
    fetchPosts();

    const channel = supabase
      .channel("positive_feed_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "positive_feed",
        },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    console.log("Fetching posts...");
    setIsLoading(true);
    const { data, error } = await supabase
      .from("positive_feed")
      .select("*")
      .eq("is_ai_approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    console.log("Posts data:", data);
    console.log("Posts error:", error);

    if (data) setPosts(data);
    setIsLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (likedPosts.has(postId)) {
      // Unlike
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });

      await supabase
        .from("positive_feed")
        .update({ 
          likes_count: posts.find(p => p.id === postId)!.likes_count - 1 
        })
        .eq("id", postId);
    } else {
      // Like
      setLikedPosts(prev => new Set(prev).add(postId));

      await supabase
        .from("positive_feed")
        .update({ 
          likes_count: posts.find(p => p.id === postId)!.likes_count + 1 
        })
        .eq("id", postId);
    }

    fetchPosts();
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
      });
    } else {
      toast({
        title: "Share",
        description: "Copy the link to share this post!",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Positive Feed</h2>
      </div>

      <CreatePost userId={userId} onPostCreated={fetchPosts} />

      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading positive posts...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {post.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.image_url && (
                <div className="w-full">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                {post.title && post.title !== "Untitled" && (
                  <h3 className="font-semibold text-lg">{post.title}</h3>
                )}
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

                {/* Engagement Bar */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={likedPosts.has(post.id) ? "text-red-500" : ""}
                  >
                    <Heart
                      className={`h-5 w-5 mr-2 ${
                        likedPosts.has(post.id) ? "fill-current" : ""
                      }`}
                    />
                    {post.likes_count > 0 && post.likes_count}
                  </Button>

                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Comment
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Be the first to share something positive!
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PositiveFeed;
