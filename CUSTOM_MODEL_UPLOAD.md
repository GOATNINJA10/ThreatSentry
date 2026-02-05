# Custom Model Upload Feature

This feature allows you to upload and test your own custom models (.pt, .pth, .h5, or .keras files) against adversarial attacks.

## Features

### Backend Capabilities
- **Model Upload**: Upload PyTorch (.pt, .pth) and Keras (.h5, .keras) model files
- **Model Management**: List, view, and delete uploaded models
- **Automatic Validation**: Models are validated upon upload to ensure they can be loaded
- **Metadata Storage**: Stores model information (name, description, classes, input size)
- **Flexible Loading**: Automatically handles both PyTorch models and Keras/TensorFlow models

### Frontend Features
- **Source Selection**: Choose between Hugging Face Hub models or custom uploaded models
- **Upload Dialog**: User-friendly interface for uploading models with metadata
- **Model Library**: View all uploaded models with details (size, classes, input size)
- **Quick Selection**: Click to select a model from your library
- **Model Management**: Delete models you no longer need

## How to Use

### 1. Upload a Custom Model

1. Navigate to the Threat Assessment page
2. Select "Custom Model (.pt/.h5)" from the Model Source dropdown
3. Click the "Upload" button
4. Fill in the model details:
   - **Model File**: Select your .pt, .pth, .h5, or .keras file
   - **Model Name**: Give your model a descriptive name
   - **Description**: (Optional) Add notes about your model
   - **Number of Classes**: Specify how many output classes (default: 1000)
   - **Input Size**: Specify the input image size in pixels (default: 224)
5. Click "Upload Model"

### 2. Run Threat Assessment

1. Select a custom model from your library (or enter a Hugging Face model ID)
2. Choose an attack type (FGSM, PGD, or DeepFool)
3. Click "Run Threat Assessment"
4. View results and download the PDF report

### 3. Manage Models

- **Refresh**: Click the refresh icon to reload your model library
- **Delete**: Click the trash icon on any model card to remove it
- **View Details**: Model cards show size, classes, and input dimensions

## API Endpoints

### Upload Model
```
POST /api/models/upload
Content-Type: multipart/form-data

Form Data:
- file: Model file (.pt, .pth, .h5, .keras)
- name: Model name (string)
- description: Model description (optional string)
- num_classes: Number of output classes (integer, default: 1000)
- input_size: Input image size (integer, default: 224)
```

### List Models
```
GET /api/models/list

Response:
{
  "success": true,
  "models": [
    {
      "id": "unique_model_id",
      "name": "Model Name",
      "description": "Model description",
      "filename": "20250205_120000_model.pt",
      "file_type": "pt",
      "num_classes": 1000,
      "input_size": 224,
      "upload_date": "2025-02-05T12:00:00",
      "file_size": 102400000
    }
  ],
  "count": 1
}
```

### Delete Model
```
DELETE /api/models/delete/{model_id}

Response:
{
  "success": true,
  "message": "Model deleted successfully"
}
```

### Get Model Info
```
GET /api/models/info/{model_id}

Response:
{
  "success": true,
  "model": {
    "id": "model_id",
    "name": "Model Name",
    ...
  }
}
```

### Run Threat Assessment
```
POST /api/threat-assessment
Content-Type: application/json

Body:
{
  "model_id": "model_identifier",
  "model_source": "custom" | "huggingface",
  "attack_type": "fgsm" | "pgd" | "deepfool"
}
```

## Model Format Requirements

### PyTorch Models (.pt, .pth)
- Must be saved with `torch.save()`
- Can be a complete model or state dictionary
- Should accept input tensors of shape (B, C, H, W)
- Output should be logits of shape (B, num_classes)

**Example:**
```python
import torch
import torch.nn as nn

# Save a complete model
model = MyModel()
torch.save(model, 'model.pt')

# Or save state dict
torch.save(model.state_dict(), 'model.pth')
```

### Keras/TensorFlow Models (.h5, .keras)
- Must be saved with `model.save()`
- Should accept images in TensorFlow format (B, H, W, C)
- Output should be predictions of shape (B, num_classes)
- Requires TensorFlow to be installed: `pip install tensorflow`

**Example:**
```python
from tensorflow import keras

# Create and save model
model = keras.models.Sequential([...])
model.compile(...)
model.fit(...)
model.save('model.h5')
```

## Storage

- Models are stored in: `backend/models/`
- Metadata is stored in: `backend/models/models_metadata.json`
- Maximum file size: 500 MB

## Supported Model Types

### PyTorch
- ✅ Complete model objects
- ✅ State dictionaries (with simple CNN fallback)
- ✅ Custom architectures
- ✅ Pre-trained models

### Keras/TensorFlow
- ✅ Sequential models
- ✅ Functional API models
- ✅ Subclassed models
- ✅ Models with custom layers

## Default Image Preprocessing

For custom models without a pre-configured processor, the system applies:
- Resize to specified input_size × input_size
- Convert to tensor
- Normalize with ImageNet mean: [0.485, 0.456, 0.406]
- Normalize with ImageNet std: [0.229, 0.224, 0.225]

## Troubleshooting

### Upload Failed
- Ensure file is a valid .pt, .pth, .h5, or .keras file
- Check that the model can be loaded (test locally first)
- Verify file size is under 500 MB
- Ensure backend server is running

### Model Loading Failed
- For PyTorch: Ensure model architecture is compatible
- For Keras: Install TensorFlow with `pip install tensorflow`
- Check that num_classes and input_size are correct
- Verify the model file isn't corrupted

### Attack Failed
- Ensure images are in the `backend/attack/` folder
- Check model output format matches expected (B, num_classes)
- Verify model accepts input shape (B, 3, H, W) for PyTorch or (B, H, W, 3) for Keras

## Security Notes

- Models are uploaded to the server backend
- Files are validated before storage
- Only specific file extensions are allowed
- Model files are stored securely in the models directory
- Consider implementing authentication for production use

## Future Enhancements

Potential improvements:
- Model versioning
- Cloud storage integration
- Model performance metrics
- Automatic architecture detection
- Model conversion utilities
- Batch model upload
- Model sharing between users
