import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2, Send, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CreatePostProps {
  userId: string;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 5MB",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please add some content or an image to your post",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // AI moderation check
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        "moderate-positive-content",
        { body: { content, title } }
      );

      if (moderationError) {
        throw new Error("Failed to moderate content");
      }

      if (!moderationResult.isPositive) {
        toast({
          variant: "destructive",
          title: "Content not approved",
          description: "Your post must contain positive, uplifting content. Please try again with more encouraging words.",
        });
        setIsSubmitting(false);
        return;
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('positive-posts')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('positive-posts')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Create post
      const { error: insertError } = await supabase
        .from("positive_feed")
        .insert({
          user_id: userId,
          title: title.trim() || "Untitled",
          content: content.trim(),
          image_url: imageUrl,
          post_type: imageUrl ? "image" : "text",
          is_ai_approved: true,
          author: "Community Member",
        });

      if (insertError) throw insertError;

      toast({
        title: "Post created!",
        description: "Your positive message has been shared with the community",
      });

      setContent("");
      setTitle("");
      removeImage();
      onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Share Something Positive</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            placeholder="Give your post a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="content">Your Message</Label>
          <Textarea
            id="content"
            placeholder="Share something uplifting, inspiring, or positive..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {content.length}/1000 characters
          </p>
        </div>

        {imagePreview && (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
            disabled={isSubmitting}
          />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting}
              asChild
            >
              <span>
                <Image className="h-4 w-4 mr-2" />
                Add Image
              </span>
            </Button>
          </Label>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !imageFile)}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;
