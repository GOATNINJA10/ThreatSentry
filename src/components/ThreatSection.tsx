import { AlertTriangle, Target, Database, Eye, Key } from "lucide-react";
import threatIcon from "@/assets/threat-icon.png";

const threats = [
  {
    id: "evasion",
    title: "Evasion Attacks",
    description: "Malicious inputs designed to fool trained models during inference, causing misclassification or incorrect predictions.",
    icon: Target,
    severity: "high",
    examples: ["Adversarial examples", "Input perturbations", "Decision boundary manipulation"]
  },
  {
    id: "poisoning",
    title: "Data Poisoning",
    description: "Contaminating training data with malicious samples to compromise model integrity and behavior.",
    icon: Database,
    severity: "critical",
    examples: ["Training set manipulation", "Label flipping", "Backdoor injection"]
  },
  {
    id: "extraction",
    title: "Model Extraction",
    description: "Unauthorized replication of proprietary models through strategic querying and analysis techniques.",
    icon: Key,
    severity: "medium",
    examples: ["Black-box copying", "Parameter theft", "Functionality replication"]
  },
  {
    id: "inference",
    title: "Membership Inference",
    description: "Determining whether specific data points were used in model training, compromising privacy.",
    icon: Eye,
    severity: "high",
    examples: ["Training data leakage", "Privacy violations", "Sensitive information exposure"]
  }
];

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "critical":
      return "threat-card-danger border-l-4 border-l-destructive";
    case "high":
      return "threat-card-danger border-l-4 border-l-threat";
    case "medium":
      return "threat-card border-l-4 border-l-accent";
    default:
      return "threat-card";
  }
};

const ThreatSection = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <img src={threatIcon} alt="Threat Detection" className="w-20 h-20" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            <span className="text-threat">Adversarial</span> Threats in ML
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            Understanding the landscape of machine learning vulnerabilities is crucial for building secure AI systems. 
            These are the primary threat vectors targeting your models.
          </p>
        </div>

        {/* Threats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {threats.map((threat) => {
            const IconComponent = threat.icon;
            return (
              <div
                key={threat.id}
                className={`${getSeverityStyles(threat.severity)} card-hover rounded-2xl p-8`}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold">{threat.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        threat.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                        threat.severity === 'high' ? 'bg-threat/20 text-threat' :
                        'bg-accent/20 text-accent'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed text-base">
                      {threat.description}
                    </p>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4">Common Examples:</h4>
                      <ul className="space-y-3">
                        {threat.examples.map((example, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-3 font-medium py-1">
                            <AlertTriangle className="w-4 h-4 text-threat flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="threat-card max-w-2xl mx-auto rounded-2xl p-10">
            <AlertTriangle className="w-16 h-16 text-threat mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-6">Don't Let Your Models Be Vulnerable</h3>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              These threats are real and actively being exploited. Take action now to protect your AI infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-threat to-destructive text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-base">
                Assess Your Risk
              </button>
              <button className="px-8 py-4 border border-border rounded-xl font-medium hover:bg-secondary/50 transition-colors text-base">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreatSection;