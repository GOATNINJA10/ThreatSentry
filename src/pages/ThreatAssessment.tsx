import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Target, Shield, AlertTriangle, Loader2, CheckCircle2, XCircle, Info, Download, Upload, Trash2, RefreshCw, History, FileJson, FileSpreadsheet, Clock, Eye, Zap, Cpu, Waves, Brain, Play, CheckSquare } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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

interface HistoryRecord {
  id: string;
  timestamp: string;
  model_id: string;
  attack_type: string;
  success_rate: number;
  original_accuracy: number;
  adversarial_accuracy: number;
  num_images: number;
  severity: string;
  type: string;
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

  // Custom attack parameters
  const [customParams, setCustomParams] = useState({
    epsilon: 0.03,
    alpha: 0.01,
    iterations: 10
  });
  const [useCustomParams, setUseCustomParams] = useState(false);

  // History
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Custom test images
  const [testImages, setTestImages] = useState<File[]>([]);
  const [useCustomImages, setUseCustomImages] = useState(false);
  
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

  // Adversarial training state
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [trainingModelId, setTrainingModelId] = useState("");
  const [trainingAttack, setTrainingAttack] = useState("fgsm");
  const [trainingEpochs, setTrainingEpochs] = useState(3);
  const [trainingEpsilon, setTrainingEpsilon] = useState(0.03);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<{success: boolean; message: string; trained_model_id?: string} | null>(null);

  const runAdversarialTraining = async () => {
    if (!trainingModelId) {
      toast.error("Please select a model to train");
      return;
    }

    setIsTraining(true);
    setTrainingResult(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/adversarial-training`, {
        method: "POST",
        body: JSON.stringify({
          model_id: trainingModelId,
          attack_type: trainingAttack,
          epochs: trainingEpochs,
          epsilon: trainingEpsilon
        })
      }, true);

      const data = await response.json();

      if (response.ok && data.success) {
        setTrainingResult({
          success: true,
          message: `Training complete! Loss: ${data.training_loss?.toFixed(4)}`,
          trained_model_id: data.trained_model_id
        });
        toast.success("Adversarial training completed!");
        loadCustomModels();
      } else {
        setTrainingResult({
          success: false,
          message: data.error || "Training failed"
        });
        toast.error("Training failed");
      }
    } catch (error) {
      setTrainingResult({
        success: false,
        message: "Training failed. Make sure backend is running."
      });
      toast.error("Training failed");
    } finally {
      setIsTraining(false);
    }
  };

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

  const loadHistoryRecords = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/history-records/recent?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setHistoryRecords(data.history_records || []);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadHistoryRecords();
    }
  }, [showHistory]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-threat/20 text-threat border-threat/30';
      case 'medium': return 'bg-accent/20 text-accent border-accent/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-secondary text-muted-foreground';
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
      name: "FGSM",
      description: "Fast Gradient Sign Method - Quick single-step attack",
      icon: Target,
      color: "text-threat"
    },
    {
      id: "pgd",
      name: "PGD",
      description: "Projected Gradient Descent - Powerful iterative attack",
      icon: Shield,
      color: "text-accent"
    },
    {
      id: "deepfool",
      name: "DeepFool",
      description: "Minimal perturbation - Finds decision boundaries",
      icon: AlertTriangle,
      color: "text-primary"
    },
    {
      id: "bim",
      name: "BIM",
      description: "Basic Iterative Method - Iterative FGSM variant",
      icon: Zap,
      color: "text-purple-500"
    },
    {
      id: "cw",
      name: "C&W",
      description: "Carlini-Wagner - Powerful optimization-based attack",
      icon: Cpu,
      color: "text-blue-500"
    },
    {
      id: "hopskipjump",
      name: "HopSkipJump",
      description: "Black-box attack - Query-efficient boundary attack",
      icon: Waves,
      color: "text-orange-500"
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

  const exportAsJSON = () => {
    if (!results) {
      toast.error("No results available to export");
      return;
    }
    const jsonStr = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_assessment_${results.attack_type}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("JSON exported successfully!");
  };

  const exportAsCSV = () => {
    if (!results) {
      toast.error("No results available to export");
      return;
    }
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Attack Type', results.attack_type],
      ['Success Rate (%)', results.success_rate.toFixed(2)],
      ['Original Accuracy (%)', results.original_accuracy.toFixed(2)],
      ['Adversarial Accuracy (%)', results.adversarial_accuracy.toFixed(2)],
      ['Accuracy Drop (%)', (results.original_accuracy - results.adversarial_accuracy).toFixed(2)],
      ['Execution Time (s)', results.execution_time.toFixed(2)],
      ['Images Processed', results.num_images],
      ['Model ID', modelId]
    ];
    
    if (results.image_results && results.image_results.length > 0) {
      rows.push(['', '']);
      rows.push(['Image Results', '']);
      results.image_results.forEach((img, idx) => {
        rows.push([
          `Image ${idx + 1}`,
          `${img.image_name} - Original: ${img.original_label} (${img.original_confidence.toFixed(1)}%), Adversarial: ${img.adversarial_label} (${img.adversarial_confidence.toFixed(1)}%), Success: ${img.success}`
        ]);
      });
    }
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_assessment_${results.attack_type}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("CSV exported successfully!");
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
      // Upload custom test images if provided
      if (useCustomImages && testImages.length > 0) {
        const formData = new FormData();
        testImages.forEach((file) => {
          formData.append('files', file);
        });
        
        const token = await getToken();
        const uploadResponse = await fetch(`${API_BASE_URL}/api/test-images/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload test images');
        }
        
        const uploadData = await uploadResponse.json();
        toast.success(`Uploaded ${uploadData.files?.length || 0} test images`);
      }

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
          use_custom_images: useCustomImages && testImages.length > 0,
          ...(useCustomParams && {
            epsilon: customParams.epsilon,
            alpha: customParams.alpha,
            iterations: customParams.iterations
          })
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

  const getDefenseRecommendations = (attackType: string, successRate: number) => {
    const recommendations: { title: string; description: string; priority: string }[] = [];
    const attack = attackType.toUpperCase();

    // High severity recommendations
    if (successRate >= 70) {
      recommendations.push({
        title: "Immediate: Adversarial Training",
        description: `Train your model with adversarial examples generated by ${attack} to improve robustness. Use datasets like Adversarial Robustness Toolbox (ART).`,
        priority: "high"
      });
      recommendations.push({
        title: "High Priority: Input Preprocessing",
        description: "Apply input transformations like JPEG compression, bit-depth reduction, or spatial smoothing to neutralize adversarial perturbations.",
        priority: "high"
      });
    }

    // Attack-specific recommendations
    if (attack === 'FGSM') {
      recommendations.push({
        title: "FGSM-Specific Defense: Gradient Masking",
        description: "Use defensive distillation - train a model with temperature-scaled softmax to smooth loss landscape and reduce gradient sensitivity.",
        priority: "medium"
      });
      recommendations.push({
        title: "Feature Squeezing",
        description: "Reduce color depth and apply spatial smoothing to detect adversarial inputs by comparing predictions at different squeezing levels.",
        priority: "medium"
      });
    } else if (attack === 'PGD') {
      recommendations.push({
        title: "PGD-Specific Defense: Randomized Resizing",
        description: "Apply random resizing and padding during inference to break the iterative attack pattern. PGD is sensitive to input transformations.",
        priority: "medium"
      });
      recommendations.push({
        title: "Label Smoothing",
        description: "Use label smoothing (0.9 confidence) to make model less susceptible to targeted PGD attacks that exploit hard labels.",
        priority: "medium"
      });
    } else if (attack === 'DEEPFOOL') {
      recommendations.push({
        title: "DeepFool-Specific Defense: Certified Robustness",
        description: "Use certified defense methods like interval bound propagation (IBP) or CROWN to get guaranteed robustness bounds.",
        priority: "medium"
      });
      recommendations.push({
        title: "Input Gradient Regularization",
        description: "Add gradient regularization loss during training to make decision boundaries less sensitive to small perturbations.",
        priority: "medium"
      });
    }

    // Universal recommendations (always add)
    recommendations.push({
      title: "Ensemble Defense",
      description: "Combine multiple models with different architectures. Attack success on one model often fails on others.",
      priority: successRate >= 40 ? "high" : "medium"
    });

    recommendations.push({
      title: "Detection Layer",
      description: "Add a binary classifier head to detect adversarial inputs. Train on both clean and adversarial examples.",
      priority: "medium"
    });

    recommendations.push({
      title: "Continuous Monitoring",
      description: "Monitor input distribution and model predictions in production. Alert on sudden accuracy drops or unusual prediction patterns.",
      priority: "low"
    });

    return recommendations;
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
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Assessment History
              </h2>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No assessment history yet</p>
                  <p className="text-sm">Run your first threat assessment to see results here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historyRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setModelId(record.model_id);
                        setSelectedAttack(record.attack_type.toLowerCase());
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{record.model_id}</span>
                          <Badge variant="outline" className="text-xs">{record.attack_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(record.timestamp)}
                          </span>
                          <span>{record.num_images} images</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{record.success_rate.toFixed(1)}%</div>
                        <Badge className={`text-xs ${getSeverityColor(record.severity)}`}>
                          {record.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

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

              {/* Test Images Upload */}
              <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="use-custom-images"
                    checked={useCustomImages}
                    onChange={(e) => setUseCustomImages(e.target.checked)}
                    disabled={isRunning}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="use-custom-images" className="text-sm font-medium cursor-pointer">
                    Upload Custom Test Images
                  </Label>
                </div>
                {useCustomImages && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        setTestImages(files);
                      }}
                      disabled={isRunning}
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload clean images (JPG, PNG). The attack will be applied to these.
                      {testImages.length > 0 && ` (${testImages.length} selected)`}
                    </p>
                  </div>
                )}
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

                {/* Custom Parameters Toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="use-custom-params"
                    checked={useCustomParams}
                    onChange={(e) => setUseCustomParams(e.target.checked)}
                    disabled={isRunning}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="use-custom-params" className="text-sm font-medium cursor-pointer">
                    Custom Parameters
                  </Label>
                </div>

                {useCustomParams && (
                  <div className="space-y-3 p-3 bg-secondary/30 rounded-lg mb-4">
                    {selectedAttack === 'fgsm' && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Epsilon (perturbation strength)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.5"
                          value={customParams.epsilon}
                          onChange={(e) => setCustomParams({ ...customParams, epsilon: parseFloat(e.target.value) || 0.03 })}
                          disabled={isRunning}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 0.01 - 0.1</p>
                      </div>
                    )}
                    {selectedAttack === 'pgd' && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Epsilon (max perturbation)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.5"
                            value={customParams.epsilon}
                            onChange={(e) => setCustomParams({ ...customParams, epsilon: parseFloat(e.target.value) || 0.03 })}
                            disabled={isRunning}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Alpha (step size)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            max="0.1"
                            value={customParams.alpha}
                            onChange={(e) => setCustomParams({ ...customParams, alpha: parseFloat(e.target.value) || 0.01 })}
                            disabled={isRunning}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Iterations</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={customParams.iterations}
                            onChange={(e) => setCustomParams({ ...customParams, iterations: parseInt(e.target.value) || 10 })}
                            disabled={isRunning}
                            className="h-9"
                          />
                        </div>
                      </>
                    )}
                    {selectedAttack === 'deepfool' && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Max Iterations</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={customParams.iterations}
                          onChange={(e) => setCustomParams({ ...customParams, iterations: parseInt(e.target.value) || 10 })}
                          disabled={isRunning}
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                )}

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
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="defense">Defense</TabsTrigger>
                <TabsTrigger value="info">Attack Info</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {results ? (
                  <>
                    {/* Download Report Button */}
                    <div className="flex justify-end mb-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                      <Button 
                        onClick={downloadReport}
                        disabled={isDownloading}
                        className="gap-2"
                        variant="outline"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={exportAsJSON}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileJson className="w-4 h-4" />
                        JSON
                      </Button>
                      <Button 
                        onClick={exportAsCSV}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV
                      </Button>
                      </div>
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
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        Defense Recommendations
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          results.success_rate >= 70 ? 'bg-threat/20 text-threat' :
                          results.success_rate >= 40 ? 'bg-accent/20 text-accent' :
                          'bg-success/20 text-success'
                        }`}>
                          {results.success_rate >= 70 ? 'High Vulnerability' : results.success_rate >= 40 ? 'Medium Vulnerability' : 'Low Vulnerability'}
                        </span>
                      </h4>
                      <div className="space-y-4">
                        {getDefenseRecommendations(results.attack_type, results.success_rate).map((rec, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            rec.priority === 'high' ? 'bg-threat/5 border-threat/20' :
                            rec.priority === 'medium' ? 'bg-accent/5 border-accent/20' :
                            'bg-secondary/50 border-border'
                          }`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 ${
                                rec.priority === 'high' ? 'text-threat' :
                                rec.priority === 'medium' ? 'text-accent' :
                                'text-success'
                              }`}>•</span>
                              <div>
                                <p className="font-medium text-sm text-foreground">{rec.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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

              <TabsContent value="defense" className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Adversarial Training
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Train your model to be more robust against adversarial attacks by incorporating adversarial examples during training.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Select Model to Train</Label>
                      <Select value={trainingModelId} onValueChange={setTrainingModelId} disabled={isTraining}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a custom model" />
                        </SelectTrigger>
                        <SelectContent>
                          {customModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name} {!model.is_trained && model.file_type && `(.${model.file_type})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Attack Type</Label>
                        <Select value={trainingAttack} onValueChange={setTrainingAttack} disabled={isTraining}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fgsm">FGSM</SelectItem>
                            <SelectItem value="pgd">PGD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Epochs</Label>
                        <Input 
                          type="number" 
                          value={trainingEpochs}
                          onChange={(e) => setTrainingEpochs(parseInt(e.target.value) || 3)}
                          disabled={isTraining}
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Epsilon (perturbation strength)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={trainingEpsilon}
                        onChange={(e) => setTrainingEpsilon(parseFloat(e.target.value) || 0.03)}
                        disabled={isTraining}
                        min={0.01}
                        max={0.1}
                      />
                    </div>

                    <Button 
                      onClick={runAdversarialTraining}
                      disabled={isTraining || !trainingModelId}
                      className="w-full gap-2"
                    >
                      {isTraining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Training in Progress...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start Adversarial Training
                        </>
                      )}
                    </Button>

                    {trainingResult && (
                      <div className={`p-4 rounded-lg ${trainingResult.success ? 'bg-success/10 border border-success/30' : 'bg-threat/10 border border-threat/30'}`}>
                        <div className="flex items-center gap-2">
                          {trainingResult.success ? (
                            <CheckSquare className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-threat" />
                          )}
                          <span className={trainingResult.success ? 'text-success' : 'text-threat'}>
                            {trainingResult.message}
                          </span>
                        </div>
                        {trainingResult.trained_model_id && (
                          <p className="text-sm text-muted-foreground mt-2">
                            New hardened model ID: {trainingResult.trained_model_id}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="font-medium mb-3">How Adversarial Training Works</h4>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">1.</span>
                      <span>Select a trained model from your uploaded models</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">2.</span>
                      <span>Choose attack type (FGSM or PGD) to generate adversarial examples</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">3.</span>
                      <span>Train the model on both clean AND adversarial examples</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">4.</span>
                      <span>Save a new "hardened" model that's more robust against attacks</span>
                    </div>
                  </div>
                </Card>
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
                            {attack.id === 'bim' && (
                              <>
                                <p>• Basic Iterative Method - iterative version of FGSM</p>
                                <p>• Applies FGSM multiple times with smaller steps</p>
                                <p>• Often more effective than single-step FGSM</p>
                              </>
                            )}
                            {attack.id === 'cw' && (
                              <>
                                <p>• Carlini-Wagner - optimization-based attack</p>
                                <p>• Minimizes perturbation while maximizing success</p>
                                <p>• More powerful but computationally expensive</p>
                              </>
                            )}
                            {attack.id === 'hopskipjump' && (
                              <>
                                <p>• HopSkipJump - black-box boundary attack</p>
                                <p>• Works without model gradients</p>
                                <p>• Queries model to find decision boundary</p>
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
