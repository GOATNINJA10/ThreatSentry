import { useAuth, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show protected content if user is signed in
  if (isSignedIn) {
    return <>{children}</>;
  }

  // Show custom fallback or default authentication required message
  return (
    fallback || (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <Lock className="w-16 h-16 text-threat mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access this content. Please sign in or create an account to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="default">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="outline">Create Account</Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    )
  );
};

export default ProtectedRoute;
