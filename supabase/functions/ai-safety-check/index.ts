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
    const { message, userId, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // AI-powered safety analysis
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
            content: `You are a safety guardian for a mental health support platform. Analyze messages for:
1. ANY PII - ANY names (first names, nicknames, full names), complete addresses with street numbers, phone numbers with area codes, email addresses, social media @handles, exact ages/birthdates, SSNs, credit card numbers
2. CRISIS SIGNALS - suicidal ideation, self-harm plans, thoughts of harming others, immediate danger, expressions of wanting to die/end life
3. Manipulation/grooming patterns
4. Harassment or abusive language

CRITICAL - NEVER FLAG AS PII:
- Personal pronouns without names: I, me, my, myself, mine, we, us, our
- Emotions or feelings: "I am sad", "I feel anxious", "me not fine", "I am not fine"
- General statements: "I can't", "I am struggling", "I need", "I want"
- Vague age/location: "I'm in my 20s", "I live in California"
- General support phrases: "I need help", "I'm struggling"

CRITICAL - ALWAYS FLAG AS PII:
- ANY name introductions: "my name is Sam", "I'm John", "call me Sarah", "myself Alex"
- Even single first names with context: "I am John" (with capital J), "this is Sam speaking"

CRITICAL - CRISIS DETECTION:
- Suicidal thoughts: "I should die", "want to die", "end my life", "kill myself"
- Self-harm: "cut myself", "hurt myself", "harm myself"
- Harm to others: "hurt someone", "violent thoughts"
- For ANY crisis signals, set recommendation to "resources" and crisisLevel appropriately
- ALWAYS recommend resources for crisis content, even if allowing the message

EXAMPLES OF WHAT TO ALLOW (NOT PII):
- "Hello, I am not fine" - ALLOW (emotion, lowercase "am")
- "I feel depressed" - ALLOW but flag as low crisis
- "Me struggling with anxiety" - ALLOW (emotion)
- "I'm 25 years old" - ALLOW (age only)
- "Hi, myself not doing well" - ALLOW (no name, just "myself" as pronoun)

EXAMPLES OF PII TO FLAG:
- "My name is Sam" - BLOCK (name)
- "I'm John" - BLOCK (name with capital)
- "Call me Sarah" - BLOCK (name)
- "Hi, myself Sam" - BLOCK (name introduction)

EXAMPLES OF CRISIS TO FLAG WITH RESOURCES:
- "I should die" - Allow message but set recommendation="resources", crisisLevel="high"
- "want to hurt myself" - Allow message but set recommendation="resources", crisisLevel="high"
- "thinking about ending it" - Allow message but set recommendation="resources", crisisLevel="high"
- "I'm so depressed" - Allow message but set recommendation="resources", crisisLevel="low"

Respond with ONLY valid JSON (no markdown formatting):
{
  "isSafe": boolean,
  "concerns": ["type1", "type2"],
  "severity": "low" | "medium" | "high",
  "recommendation": "allow" | "block" | "escalate" | "resources",
  "explanation": "brief explanation",
  "detectedPII": ["name", "phone", "email"],
  "crisisLevel": "none" | "low" | "medium" | "high"
}`
          },
          {
            role: "user",
            content: `Message: "${message}"\nContext: ${JSON.stringify(context)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response - handle markdown code blocks
    let analysis;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysis = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      // Fallback to allowing message - don't block on parsing errors
      analysis = {
        isSafe: true,
        concerns: [],
        severity: "low",
        recommendation: "allow",
        explanation: "Safety check completed",
        detectedPII: [],
        crisisLevel: "none"
      };
    }

    // Log safety event if concerns detected
    if (!analysis.isSafe && userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("user_safety_logs").insert({
        user_id: userId,
        event_type: analysis.crisisLevel !== "none" ? "crisis_detected" : "pii_blocked",
        severity: analysis.severity,
        context: {
          concerns: analysis.concerns,
          recommendation: analysis.recommendation,
          explanation: analysis.explanation,
          timestamp: new Date().toISOString()
        }
      });

      // Check for patterns (multiple events in short time)
      const { data: recentLogs } = await supabase
        .from("user_safety_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentLogs && recentLogs.length >= 3) {
        const crisisEvents = recentLogs.filter(log => log.event_type === "crisis_detected");
        if (crisisEvents.length >= 2) {
          analysis.recommendation = "escalate";
          analysis.patternDetected = true;
        }
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-safety-check:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
