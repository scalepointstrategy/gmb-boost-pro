import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        <div className="relative">
          {/* Navigation */}
          <nav className="flex items-center justify-between p-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">GMP BOOST PRO</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="px-6 py-16 lg:px-8 lg:py-24 text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
              Boost Your <span className="text-primary-glow">Business Profiles</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto animate-slide-up">
              Manage your Google Business Profiles with ease. Schedule posts, respond to reviews, 
              and grow your online presence with our powerful management tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg h-12 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to manage your business profiles</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From automated posting to intelligent review responses, we've got all the tools to boost your online presence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Profile Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple Google Business Profiles from one unified dashboard with ease.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Automated Posting</h3>
              <p className="text-sm text-muted-foreground">
                Schedule and publish posts automatically to keep your audience engaged.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Review Management</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered review responses that help you engage with customers effectively.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-background">
        <div className="text-center px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to boost your business profiles?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using GMP Boost Pro to manage their online presence.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary-hover shadow-primary h-12 px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
