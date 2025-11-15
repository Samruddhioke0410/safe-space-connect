import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Moderating content:", { title, content });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderator for a positive mental health social feed. Analyze if the content is positive, uplifting, encouraging, or inspiring.

APPROVE content that is:
- Motivational quotes or messages
- Personal growth stories
- Expressions of gratitude
- Encouraging messages
- Celebration of achievements
- Helpful mental health tips
- Inspirational stories
- Acts of kindness

REJECT content that is:
- Negative, depressing, or discouraging
- Contains crisis language or self-harm mentions
- Bullying, harassment, or mean-spirited
- Political or divisive content
- Spam or promotional
- Contains personal information
- Inappropriate or explicit

Respond with ONLY valid JSON (no markdown):
{
  "isPositive": boolean,
  "reason": "brief explanation",
  "sentiment": "positive" | "negative" | "neutral"
}`
          },
          {
            role: "user",
            content: `Title: ${title || "No title"}\n\nContent: ${content}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Default to rejecting if AI fails
      return new Response(
        JSON.stringify({ 
          isPositive: false, 
          reason: "Unable to verify content positivity" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response
    let analysis;
    try {
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysis = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      // Default to rejecting if parsing fails
      return new Response(
        JSON.stringify({ 
          isPositive: false, 
          reason: "Unable to analyze content" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Moderation result:", analysis);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error moderating content:", error);
    return new Response(
      JSON.stringify({ 
        isPositive: false, 
        reason: "Moderation error",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
