import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Shield, Users, MessageCircle, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/app");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-primary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-12 w-12 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              I Can't Tell Anyone
            </h1>
          </div>
          
          <p className="text-2xl text-muted-foreground">
            A safe, anonymous space for peer support
          </p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with others facing similar challenges. Share your story anonymously.
            Get support from peers who understand. Protected by AI-powered safety.
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI-Powered Safety</h3>
            <p className="text-muted-foreground">
              Real-time monitoring blocks personal information and detects crisis situations,
              connecting you to immediate help when needed.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Group Support</h3>
            <p className="text-muted-foreground">
              Join channels around specific challenges like career stress, grief, coming out,
              or addiction recovery. Find your community.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Complete Anonymity</h3>
            <p className="text-muted-foreground">
              Your identity stays private. No real names required. Share what you need without fear
              of judgment or exposure.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-3xl my-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create an Anonymous Account</h3>
                <p className="text-muted-foreground">
                  Sign up with just an email - no personal details required. Your identity stays protected.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Join Support Channels</h3>
                <p className="text-muted-foreground">
                  Browse channels by topic and join the ones that resonate with your situation.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect and Share</h3>
                <p className="text-muted-foreground">
                  Chat with others who understand. AI safety ensures your conversations stay anonymous and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-secondary" />
            <h2 className="text-3xl font-bold">More Ways to Connect</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <Card className="p-6 space-y-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">1:1 Peer Support</h3>
              <p className="text-muted-foreground text-sm">
                Request private conversations with peers who've experienced similar challenges.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <Users className="h-8 w-8 text-secondary" />
              <h3 className="text-lg font-semibold">Anonymous Matching</h3>
              <p className="text-muted-foreground text-sm">
                Get instantly matched with someone facing similar struggles for immediate support.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <Sparkles className="h-8 w-8 text-accent" />
              <h3 className="text-lg font-semibold">Positive Feed</h3>
              <p className="text-muted-foreground text-sm">
                Browse uplifting stories and mental health content curated by our community.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <Heart className="h-8 w-8 text-destructive" />
              <h3 className="text-lg font-semibold">Crisis Resources</h3>
              <p className="text-muted-foreground text-sm">
                Immediate access to hotlines and crisis support when you need help right now.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">You're Not Alone</h2>
          <p className="text-xl text-muted-foreground">
            Join a community that understands. Start your journey to connection and support today.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-12">
            Join Now - It's Free
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
