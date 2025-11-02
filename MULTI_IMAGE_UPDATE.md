# ThreatSentry - Multi-Image Testing Update

## 🔄 What Changed

Updated the threat assessment system to use **multiple random images** from a local folder instead of requiring single image uploads.

## ✅ Key Changes

### Backend (`backend/app.py`)
1. ✅ **Added `attack` folder support** - Reads images from `backend/attack/` directory
2. ✅ **Random selection** - Picks 5 random images for each test
3. ✅ **Batch processing** - Tests all images and calculates aggregate metrics
4. ✅ **Better error handling** - Clear messages if folder is empty
5. ✅ **Enhanced logging** - Shows progress for each image
6. ✅ **Changed API** - Now accepts JSON instead of FormData

### Frontend (`src/pages/ThreatAssessment.tsx`)
1. ✅ **Removed image upload UI** - No more file picker
2. ✅ **Simplified form** - Just model ID and attack type
3. ✅ **Updated API call** - Sends JSON request instead of FormData
4. ✅ **Fixed syntax error** - Changed `try:` (Python) to `try {` (JavaScript)

### New Folder Structure
```
backend/
├── app.py
├── requirements.txt
└── attack/                    ← NEW FOLDER
    ├── README.md              ← Instructions
    └── (your test images)     ← Add images here
```

## 🚀 How to Use

### Step 1: Add Test Images

Add images to `backend/attack/` folder:
```powershell
# Navigate to backend folder
cd backend\attack

# Copy your test images here
# Supported: .jpg, .jpeg, .png, .bmp, .gif
```

**Example:**
```
backend/attack/
├── cat_001.jpg
├── dog_002.jpg
├── car_003.png
├── bird_004.jpg
├── flower_005.png
```

### Step 2: Start Backend

```powershell
cd backend
.\venv\Scripts\activate
python app.py
```

### Step 3: Run Threat Assessment

1. Open frontend (`http://localhost:5173`)
2. Go to "Threat Assessment" page
3. Enter a model ID (e.g., `google/vit-base-patch16-224`)
4. Select attack type (FGSM, PGD, or DeepFool)
5. Click "Run Threat Assessment"

The backend will automatically:
- Select 5 random images from the `attack` folder
- Run the attack on each image
- Calculate aggregate success rate
- Return comprehensive results

## 📊 New Results Format

### API Response Now Includes:

```json
{
  "attack_type": "PGD",
  "success_rate": 80.0,
  "original_accuracy": 92.15,
  "adversarial_accuracy": 45.67,
  "execution_time": 12.34,
  "num_images": 5,
  "image_results": [
    {
      "image_name": "cat_001.jpg",
      "success": true,
      "original_pred": 281,
      "adversarial_pred": 156,
      "original_confidence": 94.23,
      "adversarial_confidence": 78.45
    },
    // ... 4 more images
  ],
  "details": "Detailed summary..."
}
```

### What the Metrics Mean:

- **success_rate**: % of images where attack changed the prediction
- **original_accuracy**: Average confidence of original predictions
- **adversarial_accuracy**: Average confidence after attack
- **num_images**: Number of images tested
- **image_results**: Individual results for each image

## 🎯 Benefits

### Before (Single Image Upload)
- ❌ Had to manually upload image each time
- ❌ Results based on only one image
- ❌ No statistical significance
- ❌ Tedious for multiple tests

### After (Multi-Image Folder)
- ✅ Automatic image selection
- ✅ Tests 5 images at once
- ✅ Better statistical confidence
- ✅ Faster workflow
- ✅ More realistic assessment

## 🔍 Backend Console Output

```
📊 Starting threat assessment
   Model: google/vit-base-patch16-224
   Attack: PGD
   Testing with 5 images
🔄 Loading model...
✅ Model loaded successfully

🖼️  Processing image 1/5: cat_001.jpg
   ⚔️  Running PGD attack...
   ✅ Success: True
   Original: class 281 (94.23%)
   Adversarial: class 156 (78.45%)

🖼️  Processing image 2/5: dog_002.jpg
   ⚔️  Running PGD attack...
   ✅ Success: True
   Original: class 232 (91.56%)
   Adversarial: class 445 (72.34%)

... (3 more images)

============================================================
✅ Attack completed in 12.34s
   Images processed: 5
   Success rate: 80.0%
   Avg original accuracy: 92.15%
   Avg adversarial accuracy: 45.67%
============================================================
```

## ⚙️ API Changes

### Old API (Deprecated)
```javascript
// FormData with file upload
const formData = new FormData();
formData.append("model_id", modelId);
formData.append("attack_type", attackType);
formData.append("image", imageFile);  // ❌ No longer needed

fetch("/api/threat-assessment", {
  method: "POST",
  body: formData
});
```

### New API (Current)
```javascript
// JSON request, no file upload
fetch("/api/threat-assessment", {
  method: "POST",
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model_id: modelId,
    attack_type: attackType
  })
});
```

## 🐛 Bug Fixed

**Line 64 Syntax Error:**
- **Before**: `try:` (Python syntax ❌)
- **After**: `try {` (JavaScript syntax ✅)

This was causing TypeScript compilation errors.

## 📁 Required Setup

### First Time Setup:

1. **Create attack folder** (if it doesn't exist):
   ```powershell
   mkdir backend\attack
   ```

2. **Add test images**:
   ```powershell
   # Copy images to backend\attack\
   # At least 5 images recommended
   ```

3. **Restart backend**:
   ```powershell
   cd backend
   python app.py
   ```

## ⚠️ Important Notes

### Error Handling:

**If folder is empty:**
```json
{
  "error": "No images found",
  "message": "No images found in the backend/attack folder. Please add some images to test.",
  "details": "Expected folder: C:\\...\\backend\\attack"
}
```

**Frontend shows:**
- Toast notification with error message
- Clear instructions on where to add images

### Image Requirements:
- **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`
- **Minimum**: 1 image (but 5+ recommended)
- **Selection**: Random 5 images per test
- **Processing**: Automatic resizing by model processor

## 🎨 UI Changes

### Removed:
- ❌ Image upload button
- ❌ Image preview box
- ❌ "Click to upload" interface

### Kept:
- ✅ Model ID input with suggestions
- ✅ Attack type selector
- ✅ Info alert about compatible models
- ✅ Run button
- ✅ Progress tracking
- ✅ Results display

## 📈 Performance Impact

### Speed:
- **5 images** takes ~5-15 seconds (depending on model size)
- **GPU**: Much faster (2-5 seconds for small models)
- **CPU**: Slower but works (10-30 seconds)

### Memory:
- Processes one image at a time
- No significant memory increase
- Same GPU/RAM requirements

## 🔄 Migration Guide

If you were using the old version:

1. **Backend**: No code changes needed in your workflow
2. **Frontend**: Update will work automatically
3. **Setup**: Just add images to `backend/attack/` folder
4. **Testing**: Run normally, backend handles the rest

## ✅ Testing Checklist

- [ ] Create `backend/attack/` folder
- [ ] Add 5+ test images
- [ ] Restart backend server
- [ ] Refresh frontend
- [ ] Select a model
- [ ] Click "Run Threat Assessment"
- [ ] Verify 5 images are processed
- [ ] Check aggregate results

## 📚 Documentation

New documentation added:
- `backend/attack/README.md` - Instructions for adding images
- This file - Summary of changes

## 🎉 Summary

**What you get:**
- ✅ **Faster testing** - No manual uploads
- ✅ **Better accuracy** - Multiple images per test
- ✅ **More realistic** - Statistical significance
- ✅ **Easier workflow** - Set up once, test many times
- ✅ **Professional results** - Per-image and aggregate metrics

**What you need to do:**
1. Add images to `backend/attack/` folder
2. Restart backend
3. Run threat assessments as normal

That's it! The system will handle everything else automatically. 🛡️
