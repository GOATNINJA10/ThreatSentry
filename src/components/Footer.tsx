import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Footer = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const footerLinks = {
    Product: [
      { label: "Features", href: "#solutions" },
      { label: "Security", href: "#threats" },
      { label: "Pricing", href: "#pricing" },
      { label: "Enterprise", href: "#enterprise" }
    ],
    Resources: [
      { label: "Documentation", href: "#docs" },
      { label: "Guides", href: "#guides" },
      { label: "Research", href: "#research" },
      { label: "Community", href: "#community" }
    ],
    Company: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" }
    ]
  };

  const socialLinks = [
    { icon: Github, href: "#github", label: "GitHub" },
    { icon: Twitter, href: "#twitter", label: "Twitter" },
    { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
    { icon: Mail, href: "#contact", label: "Contact" }
  ];

  return (
    <footer className="bg-secondary/20 border-t border-border/50" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <motion.div 
            className="md:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-8 h-8 text-primary" />
              </motion.div>
              <span className="text-xl font-bold">
                <span className="heading-gradient">Threat</span>
                <span className="text-foreground">Sentry</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Protecting machine learning systems from adversarial threats. 
              Building the future of secure AI.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                    aria-label={social.label}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.1 + categoryIndex * 0.1 }}
            >
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-muted-foreground text-sm">
            © 2025 ThreatSentry. Securing the future of AI.
          </div>
          <div className="flex gap-6 text-sm">
            <motion.a 
              href="#privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Privacy Policy
            </motion.a>
            <motion.a 
              href="#terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Terms of Service
            </motion.a>
            <motion.a 
              href="#security" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Security
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
