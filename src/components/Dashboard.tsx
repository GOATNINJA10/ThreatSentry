import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { Shield, Target, Database, Eye, Key, BarChart3, Settings, Bell, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type Severity = "high" | "medium" | "low";
type ModelStatus = "Active" | "Monitoring" | "Updating";
type StatIcon = "target" | "shield" | "database" | "barchart";

interface DashboardStat {
  title: string;
  value: string;
  icon: StatIcon;
  color: string;
  bgColor: string;
}

interface DashboardAlert {
  id: number;
  type: string;
  model: string;
  severity: Severity;
  time: string;
}

interface DashboardModel {
  name: string;
  status: ModelStatus;
  threats: number;
}

interface DashboardData {
  stats: DashboardStat[];
  alerts: DashboardAlert[];
  models: DashboardModel[];
}

interface BackendModel {
  id: string;
  name: string;
  description?: string;
  file_type?: string;
  num_classes?: number;
  input_size?: number;
  upload_date?: string;
  file_size?: number;
}

type DashboardMetadataOverride = Partial<DashboardData>;

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const iconMap: Record<StatIcon, typeof Target> = {
  target: Target,
  shield: Shield,
  database: Database,
  barchart: BarChart3
};

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  stats: [
    {
      title: "Threat Scans",
      value: "24/7",
      icon: "target",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Models Protected",
      value: "12",
      icon: "shield",
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Vulnerabilities Found",
      value: "3",
      icon: "database",
      color: "text-threat",
      bgColor: "bg-threat/10"
    },
    {
      title: "Security Score",
      value: "94%",
      icon: "barchart",
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ],
  alerts: [
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
  ],
  models: [
    { name: "Image Classifier v2.1", status: "Active", threats: 0 },
    { name: "Text Analyzer v1.3", status: "Monitoring", threats: 1 },
    { name: "Fraud Detection v3.0", status: "Active", threats: 0 },
    { name: "Recommendation Engine v1.5", status: "Updating", threats: 2 }
  ]
};

const isDashboardData = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.stats) && Array.isArray(record.alerts) && Array.isArray(record.models);
};

const hashToNumber = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const formatTimeAgo = (isoDate?: string) => {
  if (!isoDate) return "Recently";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const computeThreats = (seed: string, modelId: string, index: number) => {
  return hashToNumber(`${seed}-${modelId}-${index}`) % 3;
};

const computeModelStatus = (threats: number): ModelStatus => {
  if (threats >= 2) return "Updating";
  if (threats === 1) return "Monitoring";
  return "Active";
};

const buildAlerts = (models: BackendModel[], seed: string): DashboardAlert[] => {
  const sorted = [...models].sort((a, b) => {
    const aTime = a.upload_date ? new Date(a.upload_date).getTime() : 0;
    const bTime = b.upload_date ? new Date(b.upload_date).getTime() : 0;
    return bTime - aTime;
  });

  return sorted.slice(0, 3).map((model, index) => {
    const threats = computeThreats(seed, model.id, index);
    const severity: Severity = threats >= 2 ? "high" : threats === 1 ? "medium" : "low";
    const type = threats >= 2
      ? "Evasion Attack Detected"
      : threats === 1
        ? "Model Performance Drop"
        : "Data Drift Detected";
    return {
      id: index + 1,
      type,
      model: model.name || model.id,
      severity,
      time: formatTimeAgo(model.upload_date)
    };
  });
};

const buildModels = (models: BackendModel[], seed: string): DashboardModel[] => {
  return models.slice(0, 6).map((model, index) => {
    const threats = computeThreats(seed, model.id, index);
    return {
      name: model.name || model.id,
      status: computeModelStatus(threats),
      threats
    };
  });
};

const buildStats = (models: BackendModel[], seed: string): DashboardStat[] => {
  const modelsProtected = models.length;
  const vulnerabilities = models.reduce((sum, model, index) => sum + computeThreats(seed, model.id, index), 0);
  const securityScore = Math.max(70, Math.min(99, 98 - vulnerabilities * 2));

  return [
    { ...DEFAULT_DASHBOARD_DATA.stats[0] },
    {
      ...DEFAULT_DASHBOARD_DATA.stats[1],
      value: String(modelsProtected)
    },
    {
      ...DEFAULT_DASHBOARD_DATA.stats[2],
      value: String(vulnerabilities)
    },
    {
      ...DEFAULT_DASHBOARD_DATA.stats[3],
      value: `${securityScore}%`
    }
  ];
};

const applyMetadataOverrides = (data: DashboardData, metadataOverride?: unknown): DashboardData => {
  if (!metadataOverride || typeof metadataOverride !== "object") {
    return data;
  }

  if (isDashboardData(metadataOverride)) {
    return metadataOverride;
  }

  const metadata = metadataOverride as DashboardMetadataOverride;
  return {
    stats: Array.isArray(metadata.stats) ? metadata.stats : data.stats,
    alerts: Array.isArray(metadata.alerts) ? metadata.alerts : data.alerts,
    models: Array.isArray(metadata.models) ? metadata.models : data.models
  };
};

const deriveDashboardData = (seed: string, metadataOverride?: unknown, models?: BackendModel[]): DashboardData => {
  if (models && models.length > 0) {
    const computed: DashboardData = {
      stats: buildStats(models, seed),
      alerts: buildAlerts(models, seed),
      models: buildModels(models, seed)
    };
    return applyMetadataOverrides(computed, metadataOverride);
  }

  // Purely dynamic mode:
  // - No backend data = show empty dashboard (no mock fallback).
  // - Keep mock logic below for future use, but it is intentionally disabled.
  // return applyMetadataOverrides(DEFAULT_DASHBOARD_DATA, metadataOverride);

  return {
    stats: buildStats([], seed),
    alerts: [],
    models: []
  };

  // const fallback = applyMetadataOverrides(DEFAULT_DASHBOARD_DATA, metadataOverride);
  // if (fallback !== DEFAULT_DASHBOARD_DATA) {
  //   return fallback;
  // }
  //
  // const hash = hashToNumber(seed);
  // const modelsProtected = 6 + (hash % 9);
  // const vulnerabilities = hash % 5;
  // const securityScore = 86 + (hash % 12);
  // const alertCount = 2 + (hash % 3);
  //
  // const stats: DashboardStat[] = [
  //   { ...DEFAULT_DASHBOARD_DATA.stats[0] },
  //   {
  //     ...DEFAULT_DASHBOARD_DATA.stats[1],
  //     value: String(modelsProtected)
  //   },
  //   {
  //     ...DEFAULT_DASHBOARD_DATA.stats[2],
  //     value: String(vulnerabilities)
  //   },
  //   {
  //     ...DEFAULT_DASHBOARD_DATA.stats[3],
  //     value: `${securityScore}%`
  //   }
  // ];
  //
  // const alerts = DEFAULT_DASHBOARD_DATA.alerts.slice(0, alertCount);
  //
  // const fallbackModels = DEFAULT_DASHBOARD_DATA.models.map((model, index) => ({
  //   ...model,
  //   threats: (hash + index) % 3
  // })).slice(0, modelsProtected > 10 ? 5 : 4);
  //
  // return {
  //   stats,
  //   alerts,
  //   models: fallbackModels
  // };
};

const Dashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const displayName = user?.firstName || user?.username || primaryEmail?.split("@")[0] || "User";
  const metadataDashboard = (user?.publicMetadata as Record<string, unknown> | undefined)?.dashboard;
  const seed = useMemo(() => (user?.id || primaryEmail || "default").toLowerCase(), [user?.id, primaryEmail]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: buildStats([], seed),
    alerts: [],
    models: []
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsLoadingDashboard(true);
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/models/list`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const data = await response.json();
        if (isActive && data.success && Array.isArray(data.models)) {
          setDashboardData(deriveDashboardData(seed, metadataDashboard, data.models));
        }
      } catch (error) {
        if (isActive) {
          setDashboardData({
            stats: buildStats([], seed),
            alerts: [],
            models: []
          });
        }
      } finally {
        if (isActive) {
          setIsLoadingDashboard(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [getToken, metadataDashboard, seed]);

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
              <span className="font-medium text-foreground">{primaryEmail}</span>
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
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Monitor your ML models and protect them from adversarial threats.
          </p>
          {isLoadingDashboard && (
            <p className="text-xs text-muted-foreground mt-2">Loading live dashboard data...</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardData.stats.map((stat, index) => {
            const IconComponent = iconMap[stat.icon] || Target;
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
              {dashboardData.alerts.map((alert) => (
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
              {dashboardData.models.map((model, index) => (
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
