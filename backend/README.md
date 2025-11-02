# ThreatSentry Backend

Backend server for running adversarial attacks on Hugging Face models.

## Features

- **FGSM Attack**: Fast Gradient Sign Method for quick adversarial testing
- **PGD Attack**: Projected Gradient Descent for robust adversarial examples
- **DeepFool Attack**: Minimal perturbation attack for finding decision boundaries

## Setup

### 1. Create a Python Virtual Environment

```powershell
cd backend
python -m venv venv
```

### 2. Activate the Virtual Environment

```powershell
.\venv\Scripts\activate
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Run the Backend Server

```powershell
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### POST `/api/threat-assessment`

Run a threat assessment on a Hugging Face model.

**Parameters:**
- `model_id` (form-data): Hugging Face model ID (e.g., "google/vit-base-patch16-224")
- `attack_type` (form-data): Type of attack - "fgsm", "pgd", or "deepfool"
- `image` (file): Image file to test

**Response:**
```json
{
  "attack_type": "FGSM",
  "success_rate": 100.0,
  "original_accuracy": 95.2,
  "adversarial_accuracy": 12.5,
  "execution_time": 3.45,
  "details": "Detailed attack results..."
}
```

### GET `/api/health`

Check server health and GPU availability.

**Response:**
```json
{
  "status": "healthy",
  "device": "cuda:0",
  "cuda_available": true
}
```

## Supported Models

Any image classification model from Hugging Face Hub that supports:
- `AutoImageProcessor`
- `AutoModelForImageClassification`

Examples:
- `google/vit-base-patch16-224`
- `microsoft/resnet-50`
- `facebook/convnext-tiny-224`
- `microsoft/swin-tiny-patch4-window7-224`

## GPU Support

The backend automatically uses GPU (CUDA) if available, otherwise falls back to CPU.

## Notes

- First model load will take time as it downloads from Hugging Face
- Models are cached in `~/.cache/huggingface/`
- Larger models require more memory (GPU or RAM)
- CPU inference will be slower but works for testing

## Troubleshooting

### CUDA Out of Memory
If you get CUDA OOM errors, try:
- Using smaller models
- Reducing batch size
- Using CPU instead: Set `device = torch.device("cpu")` in app.py

### Model Download Issues
If models fail to download:
- Check internet connection
- Verify model ID on huggingface.co
- Try logging in: `huggingface-cli login`
