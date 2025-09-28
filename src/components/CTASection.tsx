import { ArrowRight, Shield, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-secondary/20 via-background to-secondary/10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main CTA */}
        <div className="threat-card glow-effect mb-12">
          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-6">
              <Shield className="w-8 h-8 text-success" />
              <Zap className="w-8 h-8 text-primary" />
              <Lock className="w-8 h-8 text-accent" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="heading-gradient">Secure</span> Your AI?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't wait for an attack to happen. Start protecting your machine learning systems today 
              with ThreatSentry's comprehensive security solutions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button variant="hero" size="lg" className="group">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Free 30-day trial • No credit card required • Enterprise support available
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="threat-card text-center card-hover">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Vulnerability Assessment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Free security scan of your ML models
            </p>
            <Button variant="ghost" size="sm" className="w-full">
              Start Assessment
            </Button>
          </div>

          <div className="threat-card text-center card-hover">
            <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Quick Setup</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy protection in under 5 minutes
            </p>
            <Button variant="ghost" size="sm" className="w-full">
              Quick Start
            </Button>
          </div>

          <div className="threat-card text-center card-hover">
            <Lock className="w-8 h-8 text-success mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Expert Consultation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Talk to our security specialists
            </p>
            <Button variant="ghost" size="sm" className="w-full">
              Book Call
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;