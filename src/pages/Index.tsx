import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Link2, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Linkzy
            </span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Shorten Links,
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {" "}Maximize Earnings
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your links into revenue streams. Linkzy combines powerful URL shortening with intelligent ad monetization and detailed analytics.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Start Earning Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help you earn more from every click
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Link Shortening</h3>
              <p className="text-muted-foreground">
                Create custom short links with our advanced URL shortener. Easy to share, easy to track.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track impressions, clicks, and earnings in real-time with beautiful dashboards.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ad Monetization</h3>
              <p className="text-muted-foreground">
                Earn revenue through our 4-page ad funnel integrated with Google AdSense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of users already monetizing their links
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Linkzy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
