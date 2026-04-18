from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from functools import wraps
from dotenv import load_dotenv
import jwt
from jwt import PyJWKClient
from PIL import Image
import io
import time
import numpy as np
import os
import random
import warnings
from datetime import datetime
from werkzeug.utils import secure_filename
import json
import textwrap

# Suppress specific transformers warnings
warnings.filterwarnings('ignore', message='Could not find image processor class')

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

torch = None
nn = None
F = None
AutoImageProcessor = None
AutoModelForImageClassification = None
transforms = None
plt = None
sns = None
PdfPages = None
device = None


def ensure_ml_dependencies():
    """Import heavy ML and plotting dependencies only when they are needed."""
    global torch, nn, F, AutoImageProcessor, AutoModelForImageClassification
    global transforms, plt, sns, PdfPages, device

    if torch is not None:
        return

    import matplotlib
    matplotlib.use('Agg')

    import torch as _torch
    import torch.nn as _nn
    import torch.nn.functional as _F
    from transformers import AutoImageProcessor as _AutoImageProcessor, AutoModelForImageClassification as _AutoModelForImageClassification
    from torchvision import transforms as _transforms
    import matplotlib.pyplot as _plt
    import seaborn as _sns
    from matplotlib.backends.backend_pdf import PdfPages as _PdfPages

    torch = _torch
    nn = _nn
    F = _F
    AutoImageProcessor = _AutoImageProcessor
    AutoModelForImageClassification = _AutoModelForImageClassification
    transforms = _transforms
    plt = _plt
    sns = _sns
    PdfPages = _PdfPages
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Clerk JWT verification settings
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_ISSUER = os.getenv("CLERK_ISSUER")
CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE")
CLERK_JWKS_CLIENT = PyJWKClient(CLERK_JWKS_URL) if CLERK_JWKS_URL else None

# Directories
ATTACK_IMAGES_FOLDER = os.path.join(os.path.dirname(__file__), 'attack')
MODELS_FOLDER = os.path.join(os.path.dirname(__file__), 'models')
MODELS_METADATA_FILE = os.path.join(MODELS_FOLDER, 'models_metadata.json')

# Ensure directories exist
os.makedirs(MODELS_FOLDER, exist_ok=True)

# Allowed model file extensions
ALLOWED_EXTENSIONS = {'pt', 'pth', 'h5', 'keras'}

# Allowed model file extensions
ALLOWED_EXTENSIONS = {'pt', 'pth', 'h5', 'keras'}

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verify_clerk_jwt(token):
    if not CLERK_JWKS_CLIENT:
        raise Exception("CLERK_JWKS_URL is not configured")

    signing_key = CLERK_JWKS_CLIENT.get_signing_key_from_jwt(token).key
    options = {
        "verify_aud": bool(CLERK_AUDIENCE),
        "verify_iss": bool(CLERK_ISSUER)
    }

    return jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        audience=CLERK_AUDIENCE,
        issuer=CLERK_ISSUER,
        options=options
    )

def require_clerk_auth(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized", "message": "Missing Bearer token"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Unauthorized", "message": "Empty Bearer token"}), 401

        try:
            request.clerk_claims = verify_clerk_jwt(token)
        except Exception as exc:
            return jsonify({"error": "Unauthorized", "message": str(exc)}), 401

        return handler(*args, **kwargs)

    return wrapper

def load_models_metadata():
    """Load models metadata from JSON file"""
    if os.path.exists(MODELS_METADATA_FILE):
        try:
            with open(MODELS_METADATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_models_metadata(metadata):
    """Save models metadata to JSON file"""
    with open(MODELS_METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def load_custom_pytorch_model(model_path, num_classes=1000, input_size=224):
    """Load a custom PyTorch model (.pt or .pth file)"""
    ensure_ml_dependencies()
    try:
        # Try to load the model directly
        loaded = torch.load(model_path, map_location=device, weights_only=False)
        
        # Check what type of object was loaded
        if isinstance(loaded, nn.Module):
            # It's a complete model object
            model = loaded
            print(f"✅ Loaded complete model object: {type(model).__name__}")
        elif isinstance(loaded, dict):
            # It could be a state dict or a checkpoint dict
            if 'state_dict' in loaded:
                # It's a checkpoint with state_dict key
                state_dict = loaded['state_dict']
            elif 'model_state_dict' in loaded:
                # Common checkpoint format
                state_dict = loaded['model_state_dict']
            elif 'model' in loaded and isinstance(loaded['model'], nn.Module):
                # Checkpoint contains actual model
                model = loaded['model']
                model.to(device)
                model.eval()
                
                # Wrap to ensure correct output format
                class ModelWrapper(nn.Module):
                    def __init__(self, base_model):
                        super(ModelWrapper, self).__init__()
                        self.base_model = base_model
                    
                    def forward(self, x):
                        out = self.base_model(x)
                        if hasattr(out, 'logits'):
                            return out
                        return type('Output', (), {'logits': out})()
                
                return ModelWrapper(model)
            else:
                # Assume it's a raw state dict
                state_dict = loaded
            
            # Try to infer model architecture from state dict
            print(f"📋 Loaded state dict with {len(state_dict)} keys")
            
            # Check for common model architectures based on key patterns
            keys = list(state_dict.keys())
            first_keys = [k.split('.')[0] for k in keys[:10]]
            
            model = None
            
            # Try torchvision models
            try:
                from torchvision import models as tv_models
                
                # Check for ResNet patterns
                if any('layer1' in k or 'layer2' in k for k in keys):
                    if any('layer4.2' in k for k in keys):
                        print("🔍 Detected ResNet-like architecture, trying resnet50...")
                        model = tv_models.resnet50(weights=None, num_classes=num_classes)
                    elif any('layer4.1' in k for k in keys):
                        print("🔍 Detected ResNet-like architecture, trying resnet34...")
                        model = tv_models.resnet34(weights=None, num_classes=num_classes)
                    else:
                        print("🔍 Detected ResNet-like architecture, trying resnet18...")
                        model = tv_models.resnet18(weights=None, num_classes=num_classes)
                
                # Check for VGG patterns
                elif any('features' in k and 'classifier' in k for k in keys):
                    print("🔍 Detected VGG-like architecture...")
                    model = tv_models.vgg16(weights=None, num_classes=num_classes)
                
                # Check for MobileNet patterns
                elif any('features.0.0' in k for k in keys):
                    print("🔍 Detected MobileNet-like architecture...")
                    model = tv_models.mobilenet_v2(weights=None, num_classes=num_classes)
                
                if model:
                    try:
                        model.load_state_dict(state_dict, strict=False)
                        print("✅ State dict loaded into detected architecture")
                    except Exception as e:
                        print(f"⚠️ Could not load state dict into detected architecture: {e}")
                        model = None
            except Exception as e:
                print(f"⚠️ torchvision architecture detection failed: {e}")
            
            # If no architecture detected, create a flexible wrapper
            if model is None:
                print("🔧 Creating flexible model wrapper...")
                
                # Create a flexible model that works with the state dict
                class FlexibleImageClassifier(nn.Module):
                    def __init__(self, num_classes=1000, input_size=224):
                        super(FlexibleImageClassifier, self).__init__()
                        self.input_size = input_size
                        
                        # Use a pre-trained backbone and replace classifier
                        from torchvision import models as tv_models
                        self.backbone = tv_models.resnet18(weights=None)
                        
                        # Replace the final layer
                        in_features = self.backbone.fc.in_features
                        self.backbone.fc = nn.Linear(in_features, num_classes)
                    
                    def forward(self, x):
                        out = self.backbone(x)
                        return type('Output', (), {'logits': out})()
                
                model = FlexibleImageClassifier(num_classes, input_size)
                
                # Try to load what we can from the state dict
                try:
                    model.load_state_dict(state_dict, strict=False)
                    print("✅ Partially loaded state dict into flexible model")
                except Exception as e:
                    print(f"⚠️ Could not load state dict: {e}")
                    print("ℹ️ Using fresh model weights")
        else:
            raise Exception(f"Unexpected object type in model file: {type(loaded)}")
        
        # Move to device and set to eval mode
        model.to(device)
        model.eval()
        
        # Wrap the model to ensure it returns the expected output format
        class OutputWrapper(nn.Module):
            def __init__(self, base_model):
                super(OutputWrapper, self).__init__()
                self.base_model = base_model
            
            def forward(self, x):
                out = self.base_model(x)
                # Handle different output formats
                if hasattr(out, 'logits'):
                    return out
                elif isinstance(out, tuple):
                    return type('Output', (), {'logits': out[0]})()
                else:
                    return type('Output', (), {'logits': out})()
        
        return OutputWrapper(model)
        
    except Exception as e:
        raise Exception(f"Failed to load PyTorch model: {str(e)}")

def load_custom_keras_model(model_path):
    """Load a custom Keras/TensorFlow model (.h5 file)"""
    ensure_ml_dependencies()
    try:
        import tensorflow as tf
        from tensorflow import keras
        
        # Load the Keras model
        keras_model = keras.models.load_model(model_path)
        
        # Wrap Keras model to work with PyTorch interface
        class KerasModelWrapper(nn.Module):
            def __init__(self, keras_model):
                super(KerasModelWrapper, self).__init__()
                self.keras_model = keras_model
            
            def forward(self, x):
                # Convert PyTorch tensor to numpy
                if isinstance(x, torch.Tensor):
                    x_np = x.cpu().detach().numpy()
                else:
                    x_np = x
                
                # Transpose from PyTorch format (B, C, H, W) to TensorFlow format (B, H, W, C)
                x_np = np.transpose(x_np, (0, 2, 3, 1))
                
                # Get predictions
                predictions = self.keras_model.predict(x_np, verbose=0)
                
                # Convert back to PyTorch tensor
                logits = torch.tensor(predictions, dtype=torch.float32, device=device)
                
                # Return in a format compatible with transformers models
                return type('Output', (), {'logits': logits})()
        
        model = KerasModelWrapper(keras_model)
        return model
    except ImportError:
        raise Exception("TensorFlow/Keras not installed. Install with: pip install tensorflow")
    except Exception as e:
        raise Exception(f"Failed to load Keras model: {str(e)}")

def create_default_processor(input_size=224):
    """Create a default image processor for custom models"""
    ensure_ml_dependencies()
    class DefaultProcessor:
        def __init__(self, size=224):
            self.size = size
            self.transform = transforms.Compose([
                transforms.Resize((size, size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
        
        def __call__(self, images, return_tensors="pt", **kwargs):
            if isinstance(images, Image.Image):
                images = [images]
            
            processed = []
            for img in images:
                if not isinstance(img, Image.Image):
                    img = Image.fromarray(img)
                processed.append(self.transform(img))
            
            pixel_values = torch.stack(processed)
            return {'pixel_values': pixel_values}
    
    return DefaultProcessor(input_size)

def get_random_images(num_images=10):
    """Get random images from the attack folder"""
    if not os.path.exists(ATTACK_IMAGES_FOLDER):
        os.makedirs(ATTACK_IMAGES_FOLDER)
        return []
    
    # Get all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']
    all_images = [f for f in os.listdir(ATTACK_IMAGES_FOLDER) 
                  if os.path.splitext(f.lower())[1] in image_extensions]
    
    if not all_images:
        return []
    
    # Select random images
    num_to_select = min(num_images, len(all_images))
    selected_images = random.sample(all_images, num_to_select)
    
    return [os.path.join(ATTACK_IMAGES_FOLDER, img) for img in selected_images]

def resolve_prediction_label(label_map, class_index):
    """Return a human-friendly class label for report output."""
    if isinstance(label_map, dict):
        if class_index in label_map:
            return str(label_map[class_index])
        class_index_str = str(class_index)
        if class_index_str in label_map:
            return str(label_map[class_index_str])
    return f"Class {class_index}"

def resolve_attack_image_path(image_name):
    """Resolve an attack image name to a local file path if it still exists."""
    if not image_name:
        return None

    safe_name = os.path.basename(image_name)
    candidate = os.path.join(ATTACK_IMAGES_FOLDER, safe_name)
    return candidate if os.path.exists(candidate) else None

class AdversarialAttacks:
    def __init__(self, model, processor):
        ensure_ml_dependencies()
        self.model = model.to(device)
        self.processor = processor
        self.model.eval()
    
    def fgsm_attack(self, image_tensor, epsilon=0.03):
        """
        Fast Gradient Sign Method (FGSM) Attack
        """
        image_tensor = image_tensor.to(device)
        image_tensor.requires_grad = True
        
        # Forward pass
        outputs = self.model(image_tensor)
        logits = outputs.logits
        predicted_class = logits.argmax(dim=1)
        
        # Calculate loss
        loss = F.cross_entropy(logits, predicted_class)
        
        # Backward pass
        self.model.zero_grad()
        loss.backward()
        
        # Create adversarial example
        sign_data_grad = image_tensor.grad.data.sign()
        perturbed_image = image_tensor + epsilon * sign_data_grad
        perturbed_image = torch.clamp(perturbed_image, 0, 1)
        
        return perturbed_image.detach()
    
    def pgd_attack(self, image_tensor, epsilon=0.03, alpha=0.01, num_iter=10):
        """
        Projected Gradient Descent (PGD) Attack
        """
        image_tensor = image_tensor.to(device)
        original_image = image_tensor.clone().detach()
        
        # Get original prediction
        with torch.no_grad():
            outputs = self.model(image_tensor)
            logits = outputs.logits
            target_class = logits.argmax(dim=1)
        
        # Initialize perturbed image
        perturbed_image = image_tensor.clone().detach()
        
        # Iterative attack
        for i in range(num_iter):
            perturbed_image.requires_grad = True
            
            # Forward pass
            outputs = self.model(perturbed_image)
            logits = outputs.logits
            loss = F.cross_entropy(logits, target_class)
            
            # Backward pass
            self.model.zero_grad()
            loss.backward()
            
            # Update perturbed image
            with torch.no_grad():
                sign_data_grad = perturbed_image.grad.data.sign()
                perturbed_image = perturbed_image + alpha * sign_data_grad
                
                # Project back to epsilon ball
                perturbation = torch.clamp(perturbed_image - original_image, -epsilon, epsilon)
                perturbed_image = torch.clamp(original_image + perturbation, 0, 1)
            
            perturbed_image = perturbed_image.detach()
        
        return perturbed_image
    
    def deepfool_attack(self, image_tensor, num_classes=10, overshoot=0.02, max_iter=50):
        """
        DeepFool Attack - Finds minimal perturbation
        """
        image_tensor = image_tensor.to(device)
        perturbed_image = image_tensor.clone().detach()
        
        with torch.no_grad():
            outputs = self.model(perturbed_image)
            logits = outputs.logits
            original_class = logits.argmax(dim=1).item()
        
        # Get number of classes from model
        num_classes = min(num_classes, logits.shape[1])
        
        iteration = 0
        current_class = original_class
        
        while iteration < max_iter and current_class == original_class:
            perturbed_image.requires_grad = True
            
            outputs = self.model(perturbed_image)
            logits = outputs.logits
            
            # Get top classes
            _, top_classes = torch.topk(logits[0], num_classes)
            top_classes = top_classes.cpu().numpy()
            
            # Calculate gradients
            self.model.zero_grad()
            
            # Get gradient for original class
            logits[0, original_class].backward(retain_graph=True)
            grad_orig = perturbed_image.grad.data.clone()
            
            pert = float('inf')
            w = None
            
            for k in top_classes:
                if k == original_class:
                    continue
                
                self.model.zero_grad()
                perturbed_image.grad.zero_()
                logits[0, k].backward(retain_graph=True)
                grad_k = perturbed_image.grad.data.clone()
                
                # Calculate w_k and f_k
                w_k = grad_k - grad_orig
                f_k = (logits[0, k] - logits[0, original_class]).item()
                
                # Calculate perturbation
                pert_k = abs(f_k) / (torch.norm(w_k.flatten()) + 1e-8)
                
                if pert_k < pert:
                    pert = pert_k
                    w = w_k
            
            # Update perturbed image
            if w is not None:
                with torch.no_grad():
                    r = (pert + 1e-4) * w / (torch.norm(w.flatten()) + 1e-8)
                    perturbed_image = perturbed_image + (1 + overshoot) * r
                    perturbed_image = torch.clamp(perturbed_image, 0, 1)
            
            perturbed_image = perturbed_image.detach()
            
            # Check new prediction
            with torch.no_grad():
                outputs = self.model(perturbed_image)
                logits = outputs.logits
                current_class = logits.argmax(dim=1).item()
            
            iteration += 1
        
        return perturbed_image
    
    def evaluate_attack(self, original_image, adversarial_image):
        """
        Evaluate the success of the attack
        """
        with torch.no_grad():
            # Original prediction
            original_outputs = self.model(original_image.to(device))
            original_logits = original_outputs.logits
            original_pred = original_logits.argmax(dim=1).item()
            original_confidence = F.softmax(original_logits, dim=1).max().item()
            
            # Adversarial prediction
            adv_outputs = self.model(adversarial_image.to(device))
            adv_logits = adv_outputs.logits
            adv_pred = adv_logits.argmax(dim=1).item()
            adv_confidence = F.softmax(adv_logits, dim=1).max().item()
            
            # Attack success
            success = original_pred != adv_pred
            
            return {
                'success': success,
                'original_pred': original_pred,
                'original_confidence': original_confidence,
                'adversarial_pred': adv_pred,
                'adversarial_confidence': adv_confidence
            }

@app.route('/api/threat-assessment', methods=['POST'])
@require_clerk_auth
def threat_assessment():
    try:
        ensure_ml_dependencies()
        # Get parameters
        data = request.get_json()
        model_id = data.get('model_id')
        attack_type = data.get('attack_type', 'fgsm')
        model_source = data.get('model_source', 'huggingface')  # 'huggingface' or 'custom'
        
        if not model_id:
            return jsonify({'error': 'Missing model_id'}), 400
        
        # Get random images from attack folder
        image_paths = get_random_images(10)
        
        if not image_paths:
            return jsonify({
                'error': 'No images found',
                'message': 'No images found in the backend/attack folder. Please add some images to test.',
                'details': f'Expected folder: {ATTACK_IMAGES_FOLDER}'
            }), 400
        
        start_time = time.time()
        
        print(f"📊 Starting threat assessment")
        print(f"   Model: {model_id}")
        print(f"   Model Source: {model_source}")
        print(f"   Attack: {attack_type.upper()}")
        print(f"   Testing with {len(image_paths)} images")
        
        # Load model and processor based on source
        print(f"🔄 Loading model...")
        try:
            if model_source == 'custom':
                # Load custom model
                metadata = load_models_metadata()
                if model_id not in metadata:
                    return jsonify({
                        'error': 'Model not found',
                        'message': f'Custom model "{model_id}" not found. Please upload the model first.'
                    }), 404
                
                model_info = metadata[model_id]
                filepath = os.path.join(MODELS_FOLDER, model_info['filename'])
                
                if not os.path.exists(filepath):
                    return jsonify({
                        'error': 'Model file not found',
                        'message': f'Model file for "{model_info["name"]}" not found on disk.'
                    }), 404
                
                # Load the custom model
                file_ext = model_info['file_type']
                if file_ext in ['pt', 'pth']:
                    model = load_custom_pytorch_model(filepath, model_info['num_classes'], model_info['input_size'])
                elif file_ext in ['h5', 'keras']:
                    model = load_custom_keras_model(filepath)
                else:
                    return jsonify({
                        'error': 'Unsupported model format',
                        'message': f'Model format "{file_ext}" is not supported.'
                    }), 400
                
                # Create default processor for custom models
                processor = create_default_processor(model_info['input_size'])
                print(f"✅ Custom model loaded successfully: {model_info['name']}")
                
            else:
                # Load from Hugging Face
                processor = AutoImageProcessor.from_pretrained(model_id)
                model = AutoModelForImageClassification.from_pretrained(model_id)
                print(f"✅ Hugging Face model loaded successfully")
                
            label_map = getattr(getattr(model, 'config', None), 'id2label', {}) or {}
        except OSError as e:
            error_msg = str(e)
            if "does not appear to have a file named preprocessor_config.json" in error_msg or "does not appear to have a file named config.json" in error_msg:
                return jsonify({
                    'error': 'Invalid model type',
                    'message': f'The model "{model_id}" is not an image classification model. Please use a vision model like:\n• google/vit-base-patch16-224\n• microsoft/resnet-50\n• facebook/convnext-tiny-224',
                    'details': 'This tool only supports image classification models from Hugging Face Hub.'
                }), 400
            else:
                return jsonify({
                    'error': 'Model loading failed',
                    'message': f'Failed to load model "{model_id}". Please verify the model ID exists on Hugging Face Hub.',
                    'details': error_msg
                }), 400
        except Exception as e:
            return jsonify({
                'error': 'Model loading failed',
                'message': f'An unexpected error occurred while loading the model.',
                'details': str(e)
            }), 400
        
        # Initialize attack handler
        attacker = AdversarialAttacks(model, processor)
        
        # Process multiple images
        total_success = 0
        total_original_acc = 0
        total_adv_acc = 0
        image_results = []
        
        for idx, image_path in enumerate(image_paths, 1):
            try:
                print(f"\n🖼️  Processing image {idx}/{len(image_paths)}: {os.path.basename(image_path)}")
                
                # Load and process image
                image = Image.open(image_path).convert('RGB')
                inputs = processor(images=image, return_tensors="pt", padding=True)
                image_tensor = inputs['pixel_values']
                
                # Get original prediction
                with torch.no_grad():
                    original_outputs = model(image_tensor.to(device))
                    original_accuracy = F.softmax(original_outputs.logits, dim=1).max().item() * 100
                
                # Run attack
                print(f"   ⚔️  Running {attack_type.upper()} attack...")
                if attack_type == 'fgsm':
                    adversarial_image = attacker.fgsm_attack(image_tensor)
                elif attack_type == 'pgd':
                    adversarial_image = attacker.pgd_attack(image_tensor)
                elif attack_type == 'deepfool':
                    adversarial_image = attacker.deepfool_attack(image_tensor)
                else:
                    return jsonify({'error': 'Invalid attack type'}), 400
                
                # Evaluate attack
                eval_results = attacker.evaluate_attack(image_tensor, adversarial_image)
                
                # Get adversarial accuracy
                with torch.no_grad():
                    adv_outputs = model(adversarial_image.to(device))
                    adversarial_accuracy = F.softmax(adv_outputs.logits, dim=1).max().item() * 100
                
                # Track results
                if eval_results['success']:
                    total_success += 1
                total_original_acc += original_accuracy
                total_adv_acc += adversarial_accuracy
                
                image_results.append({
                    'image_name': os.path.basename(image_path),
                    'success': eval_results['success'],
                    'original_pred': eval_results['original_pred'],
                    'original_label': resolve_prediction_label(label_map, eval_results['original_pred']),
                    'adversarial_pred': eval_results['adversarial_pred'],
                    'adversarial_label': resolve_prediction_label(label_map, eval_results['adversarial_pred']),
                    'original_confidence': eval_results['original_confidence'] * 100,
                    'adversarial_confidence': eval_results['adversarial_confidence'] * 100
                })
                
                print(f"   ✅ Success: {eval_results['success']}")
                print(f"   Original: class {eval_results['original_pred']} ({eval_results['original_confidence']*100:.2f}%)")
                print(f"   Adversarial: class {eval_results['adversarial_pred']} ({eval_results['adversarial_confidence']*100:.2f}%)")
                
            except Exception as e:
                print(f"   ❌ Error processing image: {str(e)}")
                continue
        
        execution_time = time.time() - start_time
        
        # Calculate aggregate metrics
        num_images = len(image_results)
        if num_images == 0:
            return jsonify({'error': 'No images were successfully processed'}), 500
        
        success_rate = (total_success / num_images) * 100
        avg_original_acc = total_original_acc / num_images
        avg_adv_acc = total_adv_acc / num_images
        
        attack_name = attack_type.upper()
        
        print(f"\n" + "=" * 60)
        print(f"✅ Attack completed in {execution_time:.2f}s")
        print(f"   Images processed: {num_images}")
        print(f"   Success rate: {success_rate:.1f}%")
        print(f"   Avg original accuracy: {avg_original_acc:.2f}%")
        print(f"   Avg adversarial accuracy: {avg_adv_acc:.2f}%")
        print("=" * 60)
        print()
        
        # Prepare response
        response = {
            'attack_type': attack_name,
            'success_rate': success_rate,
            'original_accuracy': avg_original_acc,
            'adversarial_accuracy': avg_adv_acc,
            'execution_time': execution_time,
            'num_images': num_images,
            'image_results': image_results,
            'details': f"Successfully executed {attack_name} attack on model {model_id} using {num_images} test images. "
                      f"Attack success rate: {success_rate:.1f}%. "
                      f"Average original accuracy: {avg_original_acc:.2f}%, "
                      f"Average adversarial accuracy: {avg_adv_acc:.2f}%. "
                      f"The attack successfully fooled the model in {total_success} out of {num_images} cases."
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    ensure_ml_dependencies()
    return jsonify({
        'status': 'healthy',
        'device': str(device),
        'cuda_available': torch.cuda.is_available()
    })

def generate_report_pdf(results, model_id):
    """Generate a comprehensive PDF report with charts and graphs"""
    ensure_ml_dependencies()
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.facecolor'] = 'white'
    plt.rcParams['axes.facecolor'] = '#f8f9fa'
    
    # Create temporary file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"threat_assessment_report_{timestamp}.pdf"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    def add_page_header(fig, title, subtitle=None):
        fig.text(0.06, 0.95, title, fontsize=20, fontweight='bold', color='#0f172a')
        if subtitle:
            fig.text(0.06, 0.92, subtitle, fontsize=10, color='#475569')
        fig.lines.append(plt.Line2D([0.06, 0.94], [0.905, 0.905], transform=fig.transFigure,
                                    color='#cbd5e1', linewidth=1.2))

    def add_footer(fig):
        fig.text(0.06, 0.03, 'ThreatSentry | Threat Assessment Report', fontsize=8, color='#64748b')
        fig.text(0.94, 0.03, datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                 fontsize=8, color='#64748b', ha='right')

    def draw_summary_card(fig, x, y, w, h, title, value, accent, subtitle=None):
        rect = plt.Rectangle((x, y), w, h, transform=fig.transFigure,
                             facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1.2)
        fig.patches.append(rect)
        fig.patches.append(plt.Rectangle((x, y + h - 0.012), w, 0.012, transform=fig.transFigure,
                                         facecolor=accent, edgecolor=accent, linewidth=0))
        fig.text(x + 0.02, y + h - 0.055, title, fontsize=10, color='#475569', fontweight='bold')
        fig.text(x + 0.02, y + 0.045, value, fontsize=18, color='#0f172a', fontweight='bold')
        if subtitle:
            fig.text(x + 0.02, y + 0.02, subtitle, fontsize=8.5, color='#64748b')

    image_results = results.get('image_results', [])

    with PdfPages(filepath) as pdf:
        # Page 1: Title and Overview
        fig = plt.figure(figsize=(11, 8.5))
        add_page_header(fig, 'Threat Assessment Report', 'Executive summary for model robustness under adversarial attack')

        fig.text(0.06, 0.84, f"Model: {model_id}", fontsize=16, fontweight='bold', color='#0f172a')
        fig.text(0.06, 0.805, f"Attack Type: {results['attack_type']}", fontsize=11, color='#334155')
        fig.text(0.06, 0.78, f"Images Evaluated: {results['num_images']}", fontsize=11, color='#334155')

        success_rate = results['success_rate']
        if success_rate >= 70:
            threat_level = "HIGH RISK"
            threat_color = '#dc2626'
        elif success_rate >= 40:
            threat_level = "MEDIUM RISK"
            threat_color = '#f59e0b'
        else:
            threat_level = "LOW RISK"
            threat_color = '#16a34a'

        draw_summary_card(fig, 0.06, 0.60, 0.20, 0.12, "Attack Success Rate", f"{results['success_rate']:.1f}%", '#dc2626')
        draw_summary_card(fig, 0.285, 0.60, 0.20, 0.12, "Original Confidence", f"{results['original_accuracy']:.2f}%", '#16a34a')
        draw_summary_card(fig, 0.51, 0.60, 0.20, 0.12, "Adversarial Confidence", f"{results['adversarial_accuracy']:.2f}%", '#f59e0b')
        draw_summary_card(
            fig,
            0.735,
            0.60,
            0.20,
            0.12,
            "Execution Time",
            f"{results['execution_time']:.2f}s",
            '#2563eb',
            subtitle=f"Accuracy drop: {results['original_accuracy'] - results['adversarial_accuracy']:.2f}%"
        )

        risk_rect = plt.Rectangle((0.06, 0.40), 0.88, 0.12, transform=fig.transFigure,
                                  facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1.2)
        fig.patches.append(risk_rect)
        fig.text(0.08, 0.47, "Threat Level Assessment", fontsize=13, fontweight='bold', color='#0f172a')
        fig.text(0.08, 0.43, threat_level, fontsize=22, fontweight='bold', color=threat_color)

        summary = (
            f"The {results['attack_type']} attack altered model predictions on "
            f"{results['success_rate']:.1f}% of the evaluated images. "
            f"Average confidence shifted from {results['original_accuracy']:.2f}% to "
            f"{results['adversarial_accuracy']:.2f}%, indicating the current robustness posture is {threat_level.lower()}."
        )
        fig.text(0.33, 0.445, textwrap.fill(summary, 68), fontsize=10.5, color='#334155', va='center')

        details_text = results.get('details', 'No additional details available.')
        fig.text(0.06, 0.34, "Assessment Narrative", fontsize=13, fontweight='bold', color='#0f172a')
        fig.text(0.06, 0.30, textwrap.fill(details_text, 118), fontsize=10, color='#334155', va='top')

        add_footer(fig)
        plt.axis('off')
        pdf.savefig(fig, bbox_inches='tight')
        plt.close()
        
        # Page 2: Accuracy Comparison Chart
        fig, axes = plt.subplots(2, 2, figsize=(11, 8.5))
        fig.suptitle('Detailed Analysis', fontsize=20, fontweight='bold', y=0.98)
        
        # Chart 1: Accuracy Comparison Bar Chart
        ax1 = axes[0, 0]
        accuracies = [results['original_accuracy'], results['adversarial_accuracy']]
        labels = ['Original\nAccuracy', 'Adversarial\nAccuracy']
        colors = ['#16a34a', '#dc2626']
        bars = ax1.bar(labels, accuracies, color=colors, alpha=0.7, edgecolor='black', linewidth=1.5)
        ax1.set_ylabel('Accuracy (%)', fontsize=11, fontweight='bold')
        ax1.set_title('Accuracy Comparison', fontsize=12, fontweight='bold', pad=10)
        ax1.set_ylim(0, 100)
        ax1.grid(axis='y', alpha=0.3)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}%', ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        # Chart 2: Success vs Failure Pie Chart
        ax2 = axes[0, 1]
        success_count = int(results['num_images'] * results['success_rate'] / 100)
        failure_count = results['num_images'] - success_count
        sizes = [success_count, failure_count]
        labels_pie = [f'Successful\nAttacks\n({success_count})', 
                     f'Failed\nAttacks\n({failure_count})']
        colors_pie = ['#dc2626', '#16a34a']
        explode = (0.05, 0)
        
        ax2.pie(sizes, explode=explode, labels=labels_pie, colors=colors_pie,
               autopct='%1.1f%%', shadow=True, startangle=90, textprops={'fontsize': 10, 'fontweight': 'bold'})
        ax2.set_title('Attack Success Distribution', fontsize=12, fontweight='bold', pad=10)
        
        # Chart 3: Accuracy Drop Visualization
        ax3 = axes[1, 0]
        drop = results['original_accuracy'] - results['adversarial_accuracy']
        ax3.barh(['Accuracy\nDrop'], [drop], color='#f59e0b', alpha=0.7, edgecolor='black', linewidth=1.5)
        ax3.set_xlabel('Percentage Drop (%)', fontsize=11, fontweight='bold')
        ax3.set_title('Model Robustness Impact', fontsize=12, fontweight='bold', pad=10)
        ax3.set_xlim(0, 100)
        ax3.grid(axis='x', alpha=0.3)
        ax3.text(drop + 2, 0, f'{drop:.1f}%', va='center', fontsize=10, fontweight='bold')
        
        # Chart 4: Performance Metrics
        ax4 = axes[1, 1]
        if 'image_results' in results and len(results['image_results']) > 0:
            # Sample up to 10 images for visualization
            sample_size = min(10, len(results['image_results']))
            sampled_results = random.sample(results['image_results'], sample_size)
            
            image_nums = list(range(1, sample_size + 1))
            orig_conf = [r['original_confidence'] for r in sampled_results]
            adv_conf = [r['adversarial_confidence'] for r in sampled_results]
            
            x = np.arange(len(image_nums))
            width = 0.35
            
            ax4.bar(x - width/2, orig_conf, width, label='Original', color='#16a34a', alpha=0.7)
            ax4.bar(x + width/2, adv_conf, width, label='Adversarial', color='#dc2626', alpha=0.7)
            
            ax4.set_xlabel('Sample Images', fontsize=11, fontweight='bold')
            ax4.set_ylabel('Confidence (%)', fontsize=11, fontweight='bold')
            ax4.set_title('Confidence Comparison (Sample)', fontsize=12, fontweight='bold', pad=10)
            ax4.set_xticks(x)
            ax4.set_xticklabels([f'Img {i}' for i in image_nums], rotation=45, ha='right', fontsize=8)
            ax4.legend(loc='upper right', fontsize=9)
            ax4.grid(axis='y', alpha=0.3)
            ax4.set_ylim(0, 100)
        else:
            ax4.text(0.5, 0.5, 'No detailed image data available', 
                    ha='center', va='center', transform=ax4.transAxes, fontsize=11)
            ax4.set_title('Confidence Comparison', fontsize=12, fontweight='bold', pad=10)
        
        plt.tight_layout()
        add_footer(fig)
        pdf.savefig(fig, bbox_inches='tight')
        plt.close()

        # Pages 3+: Detailed per-image evidence
        if image_results:
            images_per_page = 4
            for start in range(0, len(image_results), images_per_page):
                page_results = image_results[start:start + images_per_page]
                fig, axes = plt.subplots(2, 2, figsize=(11, 8.5))
                axes = axes.flatten()
                add_page_header(
                    fig,
                    'Image Evidence and Predictions',
                    f"Images {start + 1}-{start + len(page_results)} of {len(image_results)}"
                )

                for ax, image_result in zip(axes, page_results):
                    ax.set_facecolor('#f8fafc')
                    for spine in ax.spines.values():
                        spine.set_edgecolor('#cbd5e1')
                        spine.set_linewidth(1.0)

                    image_path = resolve_attack_image_path(image_result.get('image_name'))
                    if image_path:
                        try:
                            with Image.open(image_path) as source_image:
                                preview = source_image.convert('RGB')
                                preview.thumbnail((260, 180))
                                ax.imshow(preview)
                        except Exception:
                            ax.text(0.5, 0.68, 'Image preview unavailable', ha='center', va='center',
                                    fontsize=10, color='#64748b', transform=ax.transAxes)
                    else:
                        ax.text(0.5, 0.68, 'Image preview unavailable', ha='center', va='center',
                                fontsize=10, color='#64748b', transform=ax.transAxes)

                    ax.set_xticks([])
                    ax.set_yticks([])

                    success_text = 'Attack Successful' if image_result.get('success') else 'Attack Blocked'
                    success_color = '#dc2626' if image_result.get('success') else '#16a34a'
                    original_label = image_result.get('original_label') or f"Class {image_result.get('original_pred', 'N/A')}"
                    adversarial_label = image_result.get('adversarial_label') or f"Class {image_result.get('adversarial_pred', 'N/A')}"
                    details_lines = [
                        f"Original image: {image_result.get('image_name', 'Unknown')}",
                        f"Adversarial image: {image_result.get('image_name', 'Unknown')} (attacked)",
                        f"Outcome: {success_text}",
                        f"Model predicted as: {original_label}",
                        f"Original confidence: {image_result.get('original_confidence', 0):.2f}%",
                        f"After attack predicted as: {adversarial_label}",
                        f"Adversarial confidence: {image_result.get('adversarial_confidence', 0):.2f}%"
                    ]

                    ax.add_patch(plt.Rectangle((0, 0), 1, 0.28, transform=ax.transAxes,
                                               facecolor='white', edgecolor='#e2e8f0', linewidth=0.8))
                    ax.text(0.03, 0.24, success_text, transform=ax.transAxes, fontsize=10.5,
                            fontweight='bold', color=success_color, va='top')
                    ax.text(0.03, 0.19, "\n".join(textwrap.fill(line, 38) for line in details_lines),
                            transform=ax.transAxes, fontsize=8.8, color='#334155', va='top')

                for ax in axes[len(page_results):]:
                    ax.axis('off')

                plt.tight_layout(rect=[0, 0.05, 1, 0.90])
                add_footer(fig)
                pdf.savefig(fig, bbox_inches='tight')
                plt.close()

        # Final page: Detailed Results and Recommendations
        fig = plt.figure(figsize=(11, 8.5))
        add_page_header(fig, 'Recommendations', 'Security actions based on observed threat exposure')

        plt.text(0.06, 0.84, 'Assessment Summary', fontsize=15, fontweight='bold', color='#0f172a')
        plt.text(0.06, 0.79, textwrap.fill(details_text, 118), fontsize=10, color='#334155', va='top')

        plt.text(0.06, 0.61, 'Security Recommendations', fontsize=15, fontweight='bold', color='#0f172a')
        
        recommendations = [
            "1. Implement Adversarial Training",
            "   • Retrain your model with adversarial examples to improve robustness",
            "   • Use techniques like FGSM, PGD during training phase",
            "",
            "2. Add Input Validation & Preprocessing",
            "   • Implement input sanitization and anomaly detection",
            "   • Use defensive distillation or feature squeezing",
            "",
            "3. Deploy Ensemble Methods",
            "   • Use multiple models with different architectures",
            "   • Implement voting mechanisms for predictions",
            "",
            "4. Continuous Monitoring",
            "   • Set up real-time performance monitoring",
            "   • Detect and alert on unusual prediction patterns",
            "",
            "5. Regular Security Audits",
            "   • Conduct periodic threat assessments",
            "   • Stay updated with latest attack techniques"
        ]
        
        y_pos = 0.55
        for rec in recommendations:
            if rec.startswith('   '):
                plt.text(0.10, y_pos, rec.replace('â€¢', '•'), fontsize=9.2, color='#334155')
            elif rec:
                plt.text(0.06, y_pos, rec, fontsize=10.5, fontweight='bold', color='#0f172a')
            else:
                y_pos -= 0.01
            y_pos -= 0.03

        add_footer(fig)
        plt.axis('off')
        pdf.savefig(fig, bbox_inches='tight')
        plt.close()
        
        # Set PDF metadata
        d = pdf.infodict()
        d['Title'] = f'Threat Assessment Report - {model_id}'
        d['Author'] = 'ThreatSentry'
        d['Subject'] = f'{results["attack_type"]} Attack Assessment'
        d['Keywords'] = 'ML Security, Adversarial Attacks, Threat Assessment'
        d['CreationDate'] = datetime.now()
    
    return filepath

@app.route('/api/generate-report', methods=['POST'])
@require_clerk_auth
def generate_report():
    """Generate and download a PDF report for threat assessment results"""
    try:
        data = request.get_json()
        results = data.get('results')
        model_id = data.get('model_id', 'Unknown Model')
        
        if not results:
            return jsonify({'error': 'Missing results data'}), 400
        
        # Generate the PDF report
        report_path = generate_report_pdf(results, model_id)
        
        # Send the file
        response = send_file(
            report_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=os.path.basename(report_path)
        )
        
        # Clean up the file after sending (in a production environment, you might want to do this differently)
        @response.call_on_close
        def cleanup():
            try:
                if os.path.exists(report_path):
                    os.remove(report_path)
            except Exception as e:
                print(f"Error cleaning up report file: {e}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate-model', methods=['POST'])
@require_clerk_auth
def validate_model():
    """Validate if a model is compatible with image classification attacks"""
    try:
        data = request.get_json()
        model_id = data.get('model_id')
        
        if not model_id:
            return jsonify({'error': 'Missing model_id'}), 400
        
        print(f"Validating model: {model_id}")
        
        # Try to load the model configuration
        try:
            from transformers import AutoConfig
            config = AutoConfig.from_pretrained(model_id)
            
            # Check if it's an image classification model
            valid_architectures = [
                'vit', 'deit', 'beit', 'swin', 'resnet', 'convnext',
                'mobilenet', 'efficientnet', 'regnet', 'mobilevit'
            ]
            
            model_type = getattr(config, 'model_type', '').lower()
            is_valid = any(arch in model_type for arch in valid_architectures)
            
            if is_valid:
                return jsonify({
                    'valid': True,
                    'model_type': model_type,
                    'message': f'Model "{model_id}" is compatible!'
                })
            else:
                return jsonify({
                    'valid': False,
                    'model_type': model_type,
                    'message': f'Model "{model_id}" does not appear to be an image classification model. Please use vision models like google/vit-base-patch16-224 or microsoft/resnet-50.',
                    'suggestions': [
                        'google/vit-base-patch16-224',
                        'microsoft/resnet-50',
                        'facebook/convnext-tiny-224',
                        'microsoft/swin-tiny-patch4-window7-224'
                    ]
                })
        
        except Exception as e:
            error_msg = str(e)
            return jsonify({
                'valid': False,
                'message': f'Could not validate model "{model_id}". Please verify it exists on Hugging Face Hub.',
                'error': error_msg
            }), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models/upload', methods=['POST'])
@require_clerk_auth
def upload_model():
    """Upload a custom model file (.pt or .h5)"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'message': f'Only .pt, .pth, .h5, and .keras files are allowed'
            }), 400
        
        # Get additional metadata
        model_name = request.form.get('name', '')
        model_description = request.form.get('description', '')
        num_classes = int(request.form.get('num_classes', 1000))
        input_size = int(request.form.get('input_size', 224))
        
        if not model_name:
            model_name = os.path.splitext(file.filename)[0]
        
        # Secure the filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(MODELS_FOLDER, unique_filename)
        
        # Save the file
        print(f"📥 Uploading model: {filename}")
        file.save(filepath)
        print(f"✅ Model saved to: {filepath}")
        
        # Verify the model can be loaded
        file_ext = filename.rsplit('.', 1)[1].lower()
        try:
            if file_ext in ['pt', 'pth']:
                model = load_custom_pytorch_model(filepath, num_classes, input_size)
            elif file_ext in ['h5', 'keras']:
                model = load_custom_keras_model(filepath)
            else:
                raise Exception("Unsupported file format")
            
            print(f"✅ Model loaded and verified successfully")
            
            # Clean up loaded model from memory
            del model
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            
        except Exception as e:
            # If model can't be loaded, delete the file
            os.remove(filepath)
            return jsonify({
                'error': 'Model validation failed',
                'message': str(e),
                'details': 'The uploaded model could not be loaded. Please ensure it is a valid model file.'
            }), 400
        
        # Save metadata
        metadata = load_models_metadata()
        model_id = unique_filename
        metadata[model_id] = {
            'name': model_name,
            'description': model_description,
            'filename': unique_filename,
            'original_filename': filename,
            'file_type': file_ext,
            'num_classes': num_classes,
            'input_size': input_size,
            'upload_date': datetime.now().isoformat(),
            'file_size': os.path.getsize(filepath)
        }
        save_models_metadata(metadata)
        
        return jsonify({
            'success': True,
            'message': 'Model uploaded successfully',
            'model_id': model_id,
            'model': metadata[model_id]
        })
    
    except Exception as e:
        print(f"❌ Error uploading model: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/models/list', methods=['GET'])
@require_clerk_auth
def list_models():
    """Get list of all uploaded custom models"""
    try:
        metadata = load_models_metadata()
        
        # Convert to list and add additional info
        models = []
        for model_id, info in metadata.items():
            filepath = os.path.join(MODELS_FOLDER, info['filename'])
            if os.path.exists(filepath):
                models.append({
                    'id': model_id,
                    **info
                })
        
        return jsonify({
            'success': True,
            'models': models,
            'count': len(models)
        })
    
    except Exception as e:
        print(f"❌ Error listing models: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/models/delete/<model_id>', methods=['DELETE'])
@require_clerk_auth
def delete_model(model_id):
    """Delete a custom model"""
    try:
        metadata = load_models_metadata()
        
        if model_id not in metadata:
            return jsonify({'error': 'Model not found'}), 404
        
        # Delete the file
        filepath = os.path.join(MODELS_FOLDER, metadata[model_id]['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"🗑️  Deleted model file: {filepath}")
        
        # Remove from metadata
        del metadata[model_id]
        save_models_metadata(metadata)
        
        return jsonify({
            'success': True,
            'message': 'Model deleted successfully'
        })
    
    except Exception as e:
        print(f"❌ Error deleting model: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/models/info/<model_id>', methods=['GET'])
@require_clerk_auth
def get_model_info(model_id):
    """Get information about a specific custom model"""
    try:
        metadata = load_models_metadata()
        
        if model_id not in metadata:
            return jsonify({'error': 'Model not found'}), 404
        
        info = metadata[model_id]
        filepath = os.path.join(MODELS_FOLDER, info['filename'])
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Model file not found'}), 404
        
        return jsonify({
            'success': True,
            'model': {
                'id': model_id,
                **info
            }
        })
    
    except Exception as e:
        print(f"❌ Error getting model info: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    ensure_ml_dependencies()
    print(f"Starting ThreatSentry Backend")
    print(f"Device: {device}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
