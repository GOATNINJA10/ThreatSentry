import { useUser, UserButton } from "@clerk/clerk-react";
import { Shield, Target, Database, Eye, Key, BarChart3, Settings, Bell, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const dashboardStats = [
    {
      title: "Threat Scans",
      value: "24/7",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Models Protected",
      value: "12",
      icon: Shield,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Vulnerabilities Found",
      value: "3",
      icon: Database,
      color: "text-threat",
      bgColor: "bg-threat/10"
    },
    {
      title: "Security Score",
      value: "94%",
      icon: BarChart3,
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "Evasion Attack Detected",
      model: "Image Classifier v2.1",
      severity: "high",
      time: "2 minutes ago"
    },
    {
      id: 2,
      type: "Model Performance Drop",
      model: "Text Analyzer v1.3",
      severity: "medium",
      time: "15 minutes ago"
    },
    {
      id: 3,
      type: "Data Drift Detected",
      model: "Fraud Detection v3.0",
      severity: "low",
      time: "1 hour ago"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-threat bg-threat/10 border-threat/30";
      case "medium": return "text-accent bg-accent/10 border-accent/30";
      case "low": return "text-success bg-success/10 border-success/30";
      default: return "text-muted-foreground bg-secondary/10 border-border";
    }
  };

  return (
    <div className="min-h-screen bg-secondary/5 pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-sm text-muted-foreground">
              <span>Signed in as</span>
              <span className="font-medium text-foreground">{user?.emailAddresses?.[0]?.emailAddress}</span>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12",
                  userButtonPopoverCard: "bg-background border-border",
                  userButtonPopoverActionButton: "hover:bg-secondary"
                }
              }}
              showName={false}
            />
          </div>
        </div>

        {/* Welcome Header */}
        <div className="mb-8 ">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Monitor your ML models and protect them from adversarial threats.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="threat-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{stat.title}</h3>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Alerts */}
          <div className="threat-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-threat" />
                Recent Alerts
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{alert.type}</h4>
                    <p className="text-sm text-muted-foreground">{alert.model}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="threat-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-4">
              <Button 
                className="w-full justify-start gap-3 h-12"
                onClick={() => navigate('/threat-assessment')}
              >
                <Target className="w-5 h-5" />
                Run Threat Assessment
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Shield className="w-5 h-5" />
                Add New Model
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Eye className="w-5 h-5" />
                View Security Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Key className="w-5 h-5" />
                Configure Defenses
              </Button>
            </div>
          </div>
        </div>

        {/* Protected Models Section */}
        <div className="mt-8">
          <div className="threat-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Protected Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Image Classifier v2.1", status: "Active", threats: 0 },
                { name: "Text Analyzer v1.3", status: "Monitoring", threats: 1 },
                { name: "Fraud Detection v3.0", status: "Active", threats: 0 },
                { name: "Recommendation Engine v1.5", status: "Updating", threats: 2 },
              ].map((model, index) => (
                <div key={index} className="p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                  <h4 className="font-medium mb-2">{model.name}</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      model.status === 'Active' ? 'bg-success/20 text-success' :
                      model.status === 'Monitoring' ? 'bg-accent/20 text-accent' :
                      'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {model.status}
                    </span>
                    <span className="text-muted-foreground">
                      {model.threats} threats
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
