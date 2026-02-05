# Quick Start Guide: Custom Model Upload

## Installation

1. **Install TensorFlow** (for .h5 model support):
```bash
cd backend
pip install tensorflow
# Or update all dependencies:
pip install -r requirements.txt
```

2. **Start the Backend**:
```bash
cd backend
python app.py
```

3. **Start the Frontend**:
```bash
# In the root directory
npm run dev
# or
bun dev
```

## Quick Usage

### Upload a Model

1. Go to **Threat Assessment** page
2. Select **"Custom Model (.pt/.h5)"** from Model Source
3. Click **"Upload"** button
4. Fill in details:
   - Upload your `.pt`, `.pth`, `.h5`, or `.keras` file
   - Enter a name and description
   - Set number of classes and input size
5. Click **"Upload Model"**

### Run Assessment

1. Select your uploaded model from the list
2. Choose attack type (FGSM, PGD, or DeepFool)
3. Click **"Run Threat Assessment"**
4. View results and download PDF report

## Test the Feature

Run the included test script:
```bash
cd backend
python test_model_upload.py
```

This will:
- Create a test PyTorch model
- Upload it to the backend
- Test all API endpoints
- Display results

## File Locations

- **Uploaded Models**: `backend/models/`
- **Model Metadata**: `backend/models/models_metadata.json`
- **Attack Images**: `backend/attack/`

## Supported Formats

### PyTorch (.pt, .pth)
```python
# Save complete model
torch.save(model, 'model.pt')

# Or save state dict
torch.save(model.state_dict(), 'model.pth')
```

### Keras (.h5, .keras)
```python
from tensorflow import keras

model = keras.models.Sequential([...])
model.save('model.h5')
```

## API Quick Reference

```bash
# Upload model
curl -X POST http://localhost:5000/api/models/upload \
  -F "file=@model.pt" \
  -F "name=My Model" \
  -F "num_classes=1000" \
  -F "input_size=224"

# List models
curl http://localhost:5000/api/models/list

# Get model info
curl http://localhost:5000/api/models/info/{model_id}

# Delete model
curl -X DELETE http://localhost:5000/api/models/delete/{model_id}

# Run threat assessment
curl -X POST http://localhost:5000/api/threat-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "your_model_id",
    "model_source": "custom",
    "attack_type": "fgsm"
  }'
```

## Troubleshooting

### "TensorFlow not installed"
```bash
pip install tensorflow
```

### "Model file not found"
- Check `backend/models/` directory
- Refresh model list in UI
- Re-upload the model

### "No images found"
- Add test images to `backend/attack/` folder
- Supported formats: .jpg, .jpeg, .png, .bmp, .gif

### Backend not responding
```bash
# Restart backend
cd backend
python app.py

# Should see:
# Starting ThreatSentry Backend
# Device: cpu (or cuda)
# * Running on http://0.0.0.0:5000
```

## Example Models to Try

### Simple CNN (10 classes, 224x224)
```python
import torch
import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.fc = nn.Linear(64*56*56, 10)
    
    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.max_pool2d(x, 2)
        x = torch.relu(self.conv2(x))
        x = torch.max_pool2d(x, 2)
        x = x.view(x.size(0), -1)
        return self.fc(x)

model = SimpleCNN()
torch.save(model, 'simple_cnn.pt')
```

## Next Steps

1. Upload your trained models
2. Run threat assessments
3. Review PDF reports
4. Implement security improvements based on findings
5. Re-test after hardening

## Support

- Full Documentation: `CUSTOM_MODEL_UPLOAD.md`
- Main README: `README.md`
- Backend Tests: `backend/test_model_upload.py`
