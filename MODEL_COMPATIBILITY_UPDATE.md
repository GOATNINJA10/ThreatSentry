# ThreatSentry - Model Compatibility Update

## 🔧 Issue Fixed

**Problem:** Users were getting errors when trying to use non-image models (like BERT text models) with the threat assessment tool.

**Error Message:**
```
OSError: boltuix/bert-micro does not appear to have a file named preprocessor_config.json
```

## ✅ Changes Made

### 1. Backend Error Handling (app.py)
- ✅ Added comprehensive error handling for model loading
- ✅ Detects when users try to use incompatible models
- ✅ Returns clear, helpful error messages
- ✅ Added new `/api/validate-model` endpoint to check model compatibility

### 2. Frontend Error Display (ThreatAssessment.tsx)
- ✅ Improved error message display with toast notifications
- ✅ Added helpful info alert explaining model requirements
- ✅ Added quick-select buttons for recommended models
- ✅ Better user guidance for model selection

### 3. Documentation (COMPATIBLE_MODELS.md)
- ✅ Comprehensive list of compatible models
- ✅ Examples of what works and what doesn't
- ✅ Categorized by model family (ViT, ResNet, ConvNeXt, etc.)
- ✅ Performance tips and best practices
- ✅ Troubleshooting guide

## 🎯 What Models Work

### ✅ Compatible (Image Classification)
These models will work:
```
google/vit-base-patch16-224          ← Recommended for testing
microsoft/resnet-50                   ← Fast and reliable
facebook/convnext-tiny-224           ← Modern architecture
microsoft/swin-tiny-patch4-window7-224
google/mobilenet_v2_1.0_224
```

### ❌ Incompatible (Not Image Models)
These models will NOT work:
```
bert-base-uncased                     ← Text model
gpt2                                  ← Text model
t5-base                              ← Text model
roberta-base                         ← Text model
boltuix/bert-micro                   ← Text model
facebook/wav2vec2-base               ← Audio model
```

## 🚀 How to Use

### Step 1: Start the Backend
```powershell
cd backend
.\venv\Scripts\activate
python app.py
```

### Step 2: Use Compatible Models
In the threat assessment page:
1. Click one of the suggested model buttons, or
2. Enter a compatible model ID from the list
3. Upload an image
4. Select attack type
5. Run assessment

### Step 3: If You Get an Error
The system will now show you:
- **Clear error message** explaining what went wrong
- **Suggestions** for compatible models to try
- **Guidance** on what type of models work

## 📊 New Features

### Better Error Messages
Before:
```
Error 500: Internal Server Error
```

After:
```
Invalid Model Type
The model "boltuix/bert-micro" is not an image classification model. 
Please use a vision model like:
• google/vit-base-patch16-224
• microsoft/resnet-50
• facebook/convnext-tiny-224
```

### Model Validation API
New endpoint to check model compatibility:

```bash
POST http://localhost:5000/api/validate-model
Content-Type: application/json

{
  "model_id": "google/vit-base-patch16-224"
}
```

Response:
```json
{
  "valid": true,
  "model_type": "vit",
  "message": "Model is compatible!"
}
```

### Quick Model Selection
The UI now has quick-select buttons for:
- `google/vit-base-patch16-224` (ViT)
- `microsoft/resnet-50` (ResNet)
- `facebook/convnext-tiny-224` (ConvNeXt)

### Helpful Info Alert
Added an info box that explains:
- Only image classification models work
- Examples of compatible models
- What won't work (text models, etc.)

## 📖 Additional Documentation

Created comprehensive guide: **COMPATIBLE_MODELS.md**

Includes:
- Complete list of compatible models
- Model categories (ViT, ResNet, ConvNeXt, etc.)
- Performance tips (small/fast vs large/accurate)
- How to find more models
- Common mistakes to avoid
- Troubleshooting guide
- Expected results for different attacks

## 🔍 Testing

### Test with Valid Model
```powershell
# Should work perfectly
Model: google/vit-base-patch16-224
Image: Any clear photo
Attack: FGSM
Expected: Success with results
```

### Test with Invalid Model
```powershell
# Should show helpful error
Model: bert-base-uncased
Expected: Clear error message with suggestions
```

## 💡 User Guidance

### For New Users
1. Start with `google/vit-base-patch16-224`
2. Use the quick-select buttons
3. Read the info alert in the UI
4. Check COMPATIBLE_MODELS.md for more options

### For Advanced Users
1. Browse Hugging Face Hub for image-classification models
2. Use the validation API to check compatibility
3. Test different architectures (ViT vs ResNet vs ConvNeXt)
4. Compare robustness across models

## 🛠️ Technical Details

### Error Detection
The backend now catches:
- Missing preprocessor_config.json (non-image model)
- Missing config.json (invalid model ID)
- Network errors (model doesn't exist)
- Other loading failures

### Error Response Format
```json
{
  "error": "Invalid model type",
  "message": "User-friendly explanation",
  "details": "Technical details",
  "suggestions": ["model1", "model2", "model3"]
}
```

### Frontend Handling
- Parses error responses
- Shows user-friendly toast notifications
- Provides context-appropriate guidance
- Maintains good UX even on errors

## 📝 Summary

**Before this update:**
- Users got confusing 500 errors
- No guidance on compatible models
- Hard to know what models work

**After this update:**
- Clear, helpful error messages
- Quick-select buttons for common models
- Info alert explaining requirements
- Comprehensive documentation
- Model validation endpoint
- Better user experience

## 🎉 Result

Users can now:
- ✅ Quickly identify and fix model compatibility issues
- ✅ Get suggestions for working models
- ✅ Understand what types of models are supported
- ✅ Have a smooth, frustration-free experience

---

**Quick Reference:** See `COMPATIBLE_MODELS.md` for complete model list!
