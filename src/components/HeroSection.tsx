import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Brain } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Animated Background */}
      <div className="absolute inset-0 hero-3d-background">
        {/* Floating geometric shapes */}
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
        <div className="floating-shape shape-6"></div>
        
        {/* Animated grid overlay */}
        <div className="animated-grid"></div>
        
        {/* Moving particles */}
        <div className="particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 hero-gradient opacity-90" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Main Title */}
        <div className="mt-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Shield className="w-12 h-12 text-accent" />
            <Brain className="w-12 h-12 text-primary" />
            <AlertTriangle className="w-12 h-12 text-threat" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-5">
            <span className="heading-gradient">Threat</span>
            <span className="text-foreground">Sentry</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-3">
            Identifying and mitigating adversarial threats in Machine Learning systems. 
            Safeguard your AI models from vulnerabilities and build robust, reliable, and ethical AI systems.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="default" size="lg" className="glow-effect">
            Explore Solutions
          </Button>
          <Button variant="outline" size="lg">
            Learn About Threats
          </Button>
        </div>

        {/* Statistics */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="threat-card text-center">
            <div className="text-3xl font-bold text-primary mb-2">90%</div>
            <p className="text-muted-foreground">ML Models Vulnerable</p>
          </div>
          <div className="threat-card text-center">
            <div className="text-3xl font-bold text-accent mb-2">4</div>
            <p className="text-muted-foreground">Core Threat Types</p>
          </div>
          <div className="threat-card text-center">
            <div className="text-3xl font-bold text-success mb-2">100%</div>
            <p className="text-muted-foreground">Protection Coverage</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;