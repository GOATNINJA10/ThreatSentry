import { BookOpen, Download, Video, ExternalLink, Users, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const resources = [
  {
    id: "guides",
    title: "Implementation Guides",
    description: "Step-by-step tutorials for implementing robust ML security measures in your existing systems.",
    icon: BookOpen,
    type: "Documentation",
    items: [
      "Adversarial Training Best Practices",
      "Model Hardening Techniques",
      "Security Testing Frameworks",
      "Incident Response Protocols"
    ]
  },
  {
    id: "tools",
    title: "Security Tools & SDKs",
    description: "Open-source tools and software development kits for building secure machine learning pipelines.",
    icon: Code,
    type: "Tools",
    items: [
      "ThreatSentry Python SDK",
      "Adversarial Attack Simulator",
      "Model Vulnerability Scanner",
      "Security Metrics Dashboard"
    ]
  },
  {
    id: "research",
    title: "Research Papers",
    description: "Latest academic research and whitepapers on ML security, adversarial attacks, and defense mechanisms.",
    icon: Download,
    type: "Research",
    items: [
      "State of ML Security 2024",
      "Adversarial Robustness Survey",
      "Privacy-Preserving ML Methods",
      "Threat Landscape Analysis"
    ]
  },
  {
    id: "training",
    title: "Video Tutorials",
    description: "Comprehensive video courses covering ML security fundamentals and advanced protection strategies.",
    icon: Video,
    type: "Training",
    items: [
      "ML Security Fundamentals",
      "Hands-on Threat Detection",
      "Building Robust Models",
      "Security Architecture Design"
    ]
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "Documentation":
      return "bg-primary/20 text-primary border-primary/30";
    case "Tools":
      return "bg-accent/20 text-accent border-accent/30";
    case "Research":
      return "bg-success/20 text-success border-success/30";
    case "Training":
      return "bg-threat/20 text-threat border-threat/30";
    default:
      return "bg-secondary/20 text-foreground border-border";
  }
};

const ResourcesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Resources & <span className="heading-gradient">Learning Center</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to build robust, secure machine learning systems. 
            From implementation guides to cutting-edge research.
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {resources.map((resource, index) => {
            const IconComponent = resource.icon;
            return (
              <motion.div 
                key={resource.id} 
                className="threat-card card-hover h-full"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{resource.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getTypeColor(resource.type)}`}>
                        {resource.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-foreground">Available Resources:</h4>
                  <div className="space-y-2">
                    {resource.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <span className="text-sm text-muted-foreground">{item}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full">
                    Access {resource.type}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Community Section */}
        <motion.div 
          className="threat-card text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Users className="w-12 h-12 text-accent mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">Join the ThreatSentry Community</h3>
            <p className="text-muted-foreground mb-6">
              Connect with security researchers, ML engineers, and industry experts. 
              Share knowledge, discuss threats, and collaborate on solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg">
                Join Community
              </Button>
              <Button variant="outline" size="lg">
                Expert Support
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResourcesSection;