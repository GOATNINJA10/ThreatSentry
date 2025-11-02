import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Target, Shield, AlertTriangle, Loader2, CheckCircle2, XCircle, Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface AttackResult {
  attack_type: string;
  success_rate: number;
  original_accuracy: number;
  adversarial_accuracy: number;
  execution_time: number;
  num_images: number;
  image_results?: Array<{
    image_name: string;
    success: boolean;
    original_pred: number;
    adversarial_pred: number;
    original_confidence: number;
    adversarial_confidence: number;
  }>;
  details: string;
}

const ThreatAssessment = () => {
  const navigate = useNavigate();
  const [modelId, setModelId] = useState("");
  const [selectedAttack, setSelectedAttack] = useState("fgsm");
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AttackResult | null>(null);

  const attackTypes = [
    {
      id: "fgsm",
      name: "FGSM Attack",
      description: "Fast Gradient Sign Method - Fast and effective adversarial attack",
      icon: Target,
      color: "text-threat"
    },
    {
      id: "pgd",
      name: "PGD Attack",
      description: "Projected Gradient Descent - Iterative and powerful attack method",
      icon: Shield,
      color: "text-accent"
    },
    {
      id: "deepfool",
      name: "DeepFool Attack",
      description: "Minimal perturbation attack for finding decision boundaries",
      icon: AlertTriangle,
      color: "text-primary"
    }
  ];

  const downloadReport = async () => {
    if (!results) {
      toast.error("No results available to download");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch("http://localhost:5000/api/generate-report", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: results,
          model_id: modelId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat_assessment_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const runThreatAssessment = async () => {
    if (!modelId.trim()) {
      toast.error("Please enter a Hugging Face model ID");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("http://localhost:5000/api/threat-assessment", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: modelId,
          attack_type: selectedAttack,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.error === 'Invalid model type') {
          toast.error("Invalid Model Type", {
            description: errorData.message || "Please use an image classification model.",
            duration: 6000,
          });
        } else if (errorData.error === 'Model loading failed') {
          toast.error("Model Loading Failed", {
            description: errorData.message || "Failed to load the specified model.",
            duration: 5000,
          });
        } else {
          toast.error("Threat Assessment Failed", {
            description: errorData.message || "Failed to run threat assessment.",
            duration: 5000,
          });
        }
        
        throw new Error(errorData.message || "Failed to run threat assessment");
      }

      const data = await response.json();
      setResults(data);
      toast.success("Threat assessment completed successfully!");
    } catch (error) {
      console.error("Error running threat assessment:", error);
      toast.error("Failed to run threat assessment. Make sure the backend server is running.");
      
      // Mock results for development/testing
      const mockResults: AttackResult = {
        attack_type: selectedAttack.toUpperCase(),
        success_rate: Math.random() * 100,
        original_accuracy: 95 + Math.random() * 5,
        adversarial_accuracy: 20 + Math.random() * 30,
        execution_time: 2 + Math.random() * 3,
        num_images: 50,
        details: `Successfully executed ${selectedAttack.toUpperCase()} attack on model ${modelId}. The attack generated adversarial examples that fooled the model in ${(Math.random() * 100).toFixed(1)}% of cases.`
      };
      setResults(mockResults);
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityLevel = (successRate: number) => {
    if (successRate >= 70) return { level: "High", color: "text-threat bg-threat/10 border-threat/30" };
    if (successRate >= 40) return { level: "Medium", color: "text-accent bg-accent/10 border-accent/30" };
    return { level: "Low", color: "text-success bg-success/10 border-success/30" };
  };

  return (
    <div className="min-h-screen bg-secondary/5 pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Threat Assessment
          </h1>
          <p className="text-muted-foreground">
            Test your ML models against adversarial attacks (FGSM, PGD, DeepFool)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="threat-card rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-6">Configuration</h2>
              
              {/* Info Alert */}
              <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Image Models Only</p>
                    <p>Use vision models like ViT, ResNet, or ConvNeXt. Text models (BERT, GPT) won't work.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Model Input */}
                <div>
                  <Label htmlFor="model-id" className="text-sm font-medium mb-2 block">
                    Hugging Face Model ID
                  </Label>
                  <Input
                    id="model-id"
                    placeholder="e.g., google/vit-base-patch16-224"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the model ID from Hugging Face Hub
                  </p>
                  
                  {/* Quick Model Suggestions */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {["google/vit-base-patch16-224", "microsoft/resnet-50", "facebook/convnext-tiny-224"].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setModelId(suggestion)}
                        disabled={isRunning}
                        className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion.split('/')[1]?.substring(0, 15)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attack Type Selection */}
                <div>
                  <Label htmlFor="attack-type" className="text-sm font-medium mb-2 block">
                    Attack Type
                  </Label>
                  <Select value={selectedAttack} onValueChange={setSelectedAttack} disabled={isRunning}>
                    <SelectTrigger id="attack-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attackTypes.map((attack) => (
                        <SelectItem key={attack.id} value={attack.id}>
                          {attack.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Run Button */}
                <Button 
                  className="w-full gap-2 h-12" 
                  onClick={runThreatAssessment}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Assessment...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Run Threat Assessment
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isRunning && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {progress < 30 && "Loading model..."}
                      {progress >= 30 && progress < 60 && "Generating adversarial examples..."}
                      {progress >= 60 && progress < 90 && "Evaluating attack success..."}
                      {progress >= 90 && "Finalizing results..."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="info">Attack Info</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {results ? (
                  <>
                    {/* Download Report Button */}
                    <div className="flex justify-end mb-4">
                      <Button 
                        onClick={downloadReport}
                        disabled={isDownloading}
                        className="gap-2"
                        variant="outline"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download PDF Report
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Attack Success Rate</span>
                          {results.success_rate >= 50 ? (
                            <XCircle className="w-5 h-5 text-threat" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          )}
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-2">
                          {results.success_rate.toFixed(1)}%
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getSeverityLevel(results.success_rate).color}`}>
                          {getSeverityLevel(results.success_rate).level} Threat
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Accuracy Drop</span>
                          <AlertTriangle className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-2">
                          {(results.original_accuracy - results.adversarial_accuracy).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {results.original_accuracy.toFixed(1)}% → {results.adversarial_accuracy.toFixed(1)}%
                        </div>
                      </Card>
                    </div>

                    {/* Attack Details */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Attack Summary</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Attack Type</span>
                          <span className="font-medium">{results.attack_type}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Original Accuracy</span>
                          <span className="font-medium">{results.original_accuracy.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Adversarial Accuracy</span>
                          <span className="font-medium">{results.adversarial_accuracy.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Execution Time</span>
                          <span className="font-medium">{results.execution_time.toFixed(2)}s</span>
                        </div>
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card className="p-12 text-center">
                    <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your model and run a threat assessment to see results here.
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {results ? (
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Detailed Analysis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {results.details}
                    </p>
                    
                    <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Implement adversarial training to improve model robustness</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Add input validation and anomaly detection layers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Consider ensemble methods for better defense</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Monitor model performance continuously in production</span>
                        </li>
                      </ul>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-12 text-center">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Details Available</h3>
                    <p className="text-sm text-muted-foreground">
                      Run a threat assessment to view detailed analysis.
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                {attackTypes.map((attack) => {
                  const IconComponent = attack.icon;
                  return (
                    <Card key={attack.id} className={`p-6 ${selectedAttack === attack.id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className={`w-6 h-6 ${attack.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{attack.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {attack.description}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-2">
                            {attack.id === 'fgsm' && (
                              <>
                                <p>• Single-step attack using gradient sign</p>
                                <p>• Fast computation, good for testing</p>
                                <p>• Epsilon parameter controls perturbation strength</p>
                              </>
                            )}
                            {attack.id === 'pgd' && (
                              <>
                                <p>• Iterative multi-step attack method</p>
                                <p>• More powerful than FGSM</p>
                                <p>• Projects perturbations onto epsilon ball</p>
                              </>
                            )}
                            {attack.id === 'deepfool' && (
                              <>
                                <p>• Finds minimal perturbation to change prediction</p>
                                <p>• Iteratively moves toward decision boundary</p>
                                <p>• More computationally intensive</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatAssessment;
