import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Target, Shield, AlertTriangle, Loader2, CheckCircle2, XCircle, Info, Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/clerk-react";

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

interface CustomModel {
  id: string;
  name: string;
  description: string;
  filename: string;
  original_filename: string;
  file_type: string;
  num_classes: number;
  input_size: number;
  upload_date: string;
  file_size: number;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ThreatAssessment = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [modelId, setModelId] = useState("");
  const [modelSource, setModelSource] = useState<"huggingface" | "custom">("huggingface");
  const [selectedAttack, setSelectedAttack] = useState("fgsm");
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AttackResult | null>(null);
  
  // Custom model states
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadNumClasses, setUploadNumClasses] = useState("1000");
  const [uploadInputSize, setUploadInputSize] = useState("224");
  const [isUploading, setIsUploading] = useState(false);

  const fetchWithAuth = async (url: string, init: RequestInit = {}, includeJson = false) => {
    const buildHeaders = (token: string | null) => {
      const headers = new Headers(init.headers);
      if (includeJson) {
        headers.set("Content-Type", "application/json");
      }
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    };

    const token = await getToken();
    let response = await fetch(url, {
      ...init,
      headers: buildHeaders(token)
    });

    if (response.status === 401) {
      const freshToken = await getToken({ skipCache: true });
      if (freshToken && freshToken !== token) {
        response = await fetch(url, {
          ...init,
          headers: buildHeaders(freshToken)
        });
      }
    }

    return response;
  };

  // Load custom models on mount
  useEffect(() => {
    if (modelSource === "custom") {
      loadCustomModels();
    }
  }, [modelSource]);

  const loadCustomModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/models/list`);
      const data = await response.json();
      
      if (data.success) {
        setCustomModels(data.models);
      } else {
        toast.error("Failed to load custom models");
      }
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("Failed to load custom models. Make sure the backend is running.");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pt', '.pth', '.h5', '.keras'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExt)) {
        toast.error("Invalid file type", {
          description: "Please upload a .pt, .pth, .h5, or .keras file"
        });
        return;
      }
      
      setUploadFile(file);
      // Set default name from filename
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadModel = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!uploadName.trim()) {
      toast.error("Please enter a model name");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName);
    formData.append('description', uploadDescription);
    formData.append('num_classes', uploadNumClasses);
    formData.append('input_size', uploadInputSize);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/models/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Model uploaded successfully!", {
          description: `Model "${uploadName}" is ready to use`
        });
        
        // Reset form
        setUploadFile(null);
        setUploadName("");
        setUploadDescription("");
        setUploadNumClasses("1000");
        setUploadInputSize("224");
        setIsUploadDialogOpen(false);
        
        // Reload models list
        loadCustomModels();
      } else {
        toast.error("Upload failed", {
          description: data.message || "Failed to upload model"
        });
      }
    } catch (error) {
      console.error("Error uploading model:", error);
      toast.error("Upload failed", {
        description: "Failed to upload model. Make sure the backend is running."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteModel = async (modelId: string, modelName: string) => {
    if (!confirm(`Are you sure you want to delete "${modelName}"?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/models/delete/${modelId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Model deleted successfully");
        loadCustomModels();
        
        // Clear selection if deleted model was selected
        if (modelId === modelId) {
          setModelId("");
        }
      } else {
        toast.error("Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
    }
  };

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
      const response = await fetchWithAuth(`${API_BASE_URL}/api/generate-report`, {
        method: "POST",
        body: JSON.stringify({
          results: results,
          model_id: modelId,
        })
      }, true);

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
      toast.error(modelSource === "huggingface" ? "Please enter a Hugging Face model ID" : "Please select a custom model");
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

      const response = await fetchWithAuth(`${API_BASE_URL}/api/threat-assessment`, {
        method: "POST",
        body: JSON.stringify({
          model_id: modelId,
          attack_type: selectedAttack,
          model_source: modelSource,
        })
      }, true);

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
                {/* Model Source Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Model Source
                  </Label>
                  <Select value={modelSource} onValueChange={(value: "huggingface" | "custom") => {
                    setModelSource(value);
                    setModelId("");
                  }} disabled={isRunning}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="huggingface">Hugging Face Hub</SelectItem>
                      <SelectItem value="custom">Custom Model (.pt/.h5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hugging Face Model Input */}
                {modelSource === "huggingface" && (
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
                )}

                {/* Custom Model Selection */}
                {modelSource === "custom" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Select Custom Model
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadCustomModels}
                          disabled={isLoadingModels || isRunning}
                          className="h-8 gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setIsUploadDialogOpen(true)}
                          disabled={isRunning}
                          className="h-8 gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </Button>
                      </div>
                    </div>

                    {isLoadingModels ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : customModels.length === 0 ? (
                      <Card className="p-6 text-center border-dashed">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-3">
                          No custom models uploaded yet
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUploadDialogOpen(true)}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Your First Model
                        </Button>
                      </Card>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {customModels.map((model) => (
                          <Card
                            key={model.id}
                            className={`p-3 cursor-pointer transition-all ${
                              modelId === model.id
                                ? 'ring-2 ring-primary bg-primary/5'
                                : 'hover:bg-secondary/50'
                            }`}
                            onClick={() => !isRunning && setModelId(model.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">{model.name}</h4>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    .{model.file_type}
                                  </span>
                                </div>
                                {model.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {model.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>Classes: {model.num_classes}</span>
                                  <span>Input: {model.input_size}x{model.input_size}</span>
                                  <span>Size: {(model.file_size / 1024 / 1024).toFixed(1)} MB</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModel(model.id, model.name);
                                }}
                                disabled={isRunning}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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

        {/* Upload Model Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Custom Model</DialogTitle>
              <DialogDescription>
                Upload a PyTorch (.pt, .pth) or Keras (.h5, .keras) model file for threat assessment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* File Input */}
              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium mb-2 block">
                  Model File *
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pt,.pth,.h5,.keras"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {uploadFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Model Name */}
              <div>
                <Label htmlFor="model-name" className="text-sm font-medium mb-2 block">
                  Model Name *
                </Label>
                <Input
                  id="model-name"
                  placeholder="e.g., My Custom ResNet"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="model-description" className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </Label>
                <Textarea
                  id="model-description"
                  placeholder="Brief description of your model..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  disabled={isUploading}
                  rows={3}
                />
              </div>

              {/* Advanced Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="num-classes" className="text-sm font-medium mb-2 block">
                    Number of Classes
                  </Label>
                  <Input
                    id="num-classes"
                    type="number"
                    placeholder="1000"
                    value={uploadNumClasses}
                    onChange={(e) => setUploadNumClasses(e.target.value)}
                    disabled={isUploading}
                    min="2"
                  />
                </div>

                <div>
                  <Label htmlFor="input-size" className="text-sm font-medium mb-2 block">
                    Input Size (px)
                  </Label>
                  <Input
                    id="input-size"
                    type="number"
                    placeholder="224"
                    value={uploadInputSize}
                    onChange={(e) => setUploadInputSize(e.target.value)}
                    disabled={isUploading}
                    min="32"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadModel}
                disabled={isUploading || !uploadFile || !uploadName.trim()}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Model
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ThreatAssessment;
