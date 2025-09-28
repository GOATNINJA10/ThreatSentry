import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ThreatSection from "@/components/ThreatSection";
import SolutionsSection from "@/components/SolutionsSection";
import ResourcesSection from "@/components/ResourcesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <div id="threats">
          <ThreatSection />
        </div>
        <div id="solutions">
          <SolutionsSection />
        </div>
        <div id="resources">
          <ResourcesSection />
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
