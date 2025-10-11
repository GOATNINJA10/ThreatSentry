import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, user } = useUser();

  const navItems = [
    { label: "Threats", href: "#threats" },
    { label: "Solutions", href: "#solutions" },
    { label: "Resources", href: "#resources" },
    { label: "About", href: "#about" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">
              <span className="heading-gradient">Threat</span>
              <span className="text-foreground">Sentry</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="default">Get Started</Button>
                </SignUpButton>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.firstName || 'User'}!
                </span>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                {!isSignedIn ? (
                  <>
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button variant="default" className="w-full">Get Started</Button>
                    </SignUpButton>
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Welcome, {user?.firstName || 'User'}!
                    </span>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8"
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;