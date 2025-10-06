import { Shield, Zap, Lock, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import defenseIcon from "@/assets/defense-icon.png";

const solutions = [
  {
    id: "detection",
    title: "Real-time Threat Detection",
    description: "Advanced monitoring systems that identify adversarial attacks as they happen, with instant alerts and automated responses.",
    icon: Zap,
    features: ["Anomaly detection", "Pattern analysis", "Instant alerts", "Auto-mitigation"],
    color: "primary"
  },
  {
    id: "hardening",
    title: "Model Hardening",
    description: "Strengthen your models against attacks through adversarial training, robust optimization, and defensive distillation.",
    icon: Shield,
    features: ["Adversarial training", "Robust optimization", "Defensive distillation", "Input validation"],
    color: "success"
  },
  {
    id: "privacy",
    title: "Privacy Protection",
    description: "Implement differential privacy, federated learning, and secure multi-party computation to protect sensitive data.",
    icon: Lock,
    features: ["Differential privacy", "Federated learning", "Data anonymization", "Secure computation"],
    color: "accent"
  },
  {
    id: "monitoring",
    title: "Continuous Monitoring",
    description: "24/7 surveillance of model performance, data integrity, and security metrics with comprehensive dashboards.",
    icon: RefreshCw,
    features: ["Performance tracking", "Data quality checks", "Security metrics", "Automated reports"],
    color: "secondary"
  }
];

const getColorStyles = (color: string) => {
  switch (color) {
    case "primary":
      return "text-primary border-primary/30 bg-primary/5";
    case "success":
      return "text-success border-success/30 bg-success/5";
    case "accent":
      return "text-accent border-accent/30 bg-accent/5";
    default:
      return "text-foreground border-border bg-secondary/20";
  }
};

const SolutionsSection = () => {
  return (
    <section className="py-20 px-6 bg-secondary/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <img src={defenseIcon} alt="Defense Solutions" className="w-20 h-20" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            <span className="heading-gradient">Comprehensive</span> Defense Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            ThreatSentry provides a complete suite of tools and techniques to protect your machine learning 
            systems from adversarial attacks and ensure robust, reliable AI deployment.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          {solutions.map((solution) => {
            const IconComponent = solution.icon;
            return (
              <div key={solution.id} className="threat-card card-hover rounded-2xl p-8">
                <div className="flex items-start gap-6 mb-8">
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${getColorStyles(solution.color)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4">{solution.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {solution.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-lg">Key Features:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {solution.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 py-1">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-muted-foreground font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <Button variant="ghost" className="w-full justify-between group py-3 text-base">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className="threat-card text-center glow-effect rounded-2xl p-10">
          <h3 className="text-3xl font-bold mb-8">Why Choose ThreatSentry?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-10">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h4 className="font-bold mb-3 text-lg">Enterprise-Grade Security</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Military-grade protection for your most critical AI assets</p>
            </div>
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="w-10 h-10 text-accent" />
              </div>
              <h4 className="font-bold mb-3 text-lg">Real-time Response</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Instant threat detection and automated countermeasures</p>
            </div>
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h4 className="font-bold mb-3 text-lg">Proven Results</h4>
              <p className="text-base text-muted-foreground leading-relaxed">99.9% threat detection accuracy across all attack vectors</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;