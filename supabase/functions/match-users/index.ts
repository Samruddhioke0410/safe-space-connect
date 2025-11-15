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
    const { userId, topic } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find another user waiting for a match with the same topic
    const { data: waitingUser, error: findError } = await supabase
      .from("anonymous_matches")
      .select("*")
      .eq("status", "waiting")
      .eq("topic", topic)
      .neq("user1_id", userId)
      .limit(1)
      .single();

    if (waitingUser) {
      // Match found - update existing match
      const { data: match, error: updateError } = await supabase
        .from("anonymous_matches")
        .update({
          user2_id: userId,
          status: "active"
        })
        .eq("id", waitingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ 
        matched: true, 
        matchId: match.id,
        partnerId: waitingUser.user1_id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // No match found - create waiting match
      const { data: match, error: createError } = await supabase
        .from("anonymous_matches")
        .insert({
          user1_id: userId,
          user2_id: userId, // Temporary, will be updated when matched
          topic,
          status: "waiting"
        })
        .select()
        .single();

      if (createError) throw createError;

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
