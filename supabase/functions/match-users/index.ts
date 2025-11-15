import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, topic, seekingSupport, supportStyles } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user's profile to understand their preferences
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Find compatible waiting users
    const { data: waitingMatches } = await supabase
      .from("anonymous_matches")
      .select("*, profiles!anonymous_matches_user1_id_fkey(*)")
      .eq("status", "waiting")
      .eq("topic", topic)
      .neq("user1_id", userId);

    let bestMatch = null;
    let bestScore = 0;

    // Score each potential match based on compatibility
    if (waitingMatches) {
      for (const match of waitingMatches) {
        const otherUser = match.profiles;
        if (!otherUser) continue;

        let score = 0;
        
        // Prefer complementary roles (seeker with supporter)
        if (seekingSupport !== otherUser.seeking_support) {
          score += 10;
        } else {
          score += 3; // Two seekers can still match
        }

        // Check for overlapping support styles
        const otherStyles = otherUser.support_preferences?.styles || [];
        const commonStyles = supportStyles.filter((style: string) => 
          otherStyles.includes(style)
        );
        score += commonStyles.length * 2;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
        }
      }
    }

    if (bestMatch) {
      // Match found - update existing match
      const { data: match, error: updateError } = await supabase
        .from("anonymous_matches")
        .update({
          user2_id: userId,
          status: "active"
        })
        .eq("id", bestMatch.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`Match found! User ${userId} matched with ${bestMatch.user1_id}, score: ${bestScore}`);

      return new Response(JSON.stringify({ 
        matched: true, 
        matchId: match.id,
        partnerId: bestMatch.user1_id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // No match found - create waiting match
      const { data: match, error: createError } = await supabase
        .from("anonymous_matches")
        .insert({
          user1_id: userId,
          user2_id: userId,
          topic,
          status: "waiting"
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log(`User ${userId} waiting for match on topic: ${topic}`);

      return new Response(JSON.stringify({ 
        matched: false, 
        matchId: match.id,
        waiting: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in match-users:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
