# Attack Images Folder

This folder contains test images used for threat assessment attacks.

## How It Works

When you run a threat assessment, the backend will:
1. Select **5 random images** from this folder
2. Run the chosen attack (FGSM, PGD, or DeepFool) on each image
3. Calculate aggregate success rate and accuracy metrics
4. Return detailed results for all tested images

## Setup Instructions

### Add Your Test Images

1. **Download or copy test images** into this folder (`backend/attack/`)
2. **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`
3. **Recommended**: Add at least 5-10 images for better testing

### Example Sources for Test Images

**Option 1: ImageNet Sample Images**
- Download sample images from [ImageNet](https://image-net.org/)
- Use images that the model was trained on for realistic testing

**Option 2: Use Your Own Images**
- Any clear, well-lit photos will work
- Try different subjects: animals, objects, scenes, people
- Images will be automatically resized by the model

**Option 3: Download Sample Dataset**
```powershell
# Example: Download from a public dataset
# You can use any image dataset you have access to
```

## File Structure Example

```
backend/attack/
├── cat_001.jpg
├── dog_002.jpg
├── car_003.png
├── bird_004.jpg
├── flower_005.png
├── ... (more images)
```

## Tips

### For Better Testing
- ✅ Use **diverse images** (different subjects, lighting, angles)
- ✅ Use **high-quality images** (clear, not blurry)
- ✅ Add **10+ images** for more statistical significance
- ✅ Use images **similar to what the model was trained on**

### What Happens During Testing
1. Backend randomly selects 5 images from this folder
2. Each image is processed through the model
3. Adversarial attack is applied to each image
4. Success rate is calculated across all images
5. Results show:
   - Overall success rate (% of images fooled)
   - Average original accuracy
   - Average adversarial accuracy
   - Individual results for each image

## Example Test Results

When you run a threat assessment, you'll see output like:

```
📊 Starting threat assessment
   Model: google/vit-base-patch16-224
   Attack: PGD
   Testing with 5 images

🖼️  Processing image 1/5: cat_001.jpg
   ⚔️  Running PGD attack...
   ✅ Success: True
   Original: class 281 (94.23%)
   Adversarial: class 156 (78.45%)

... (4 more images)

============================================================
✅ Attack completed in 12.34s
   Images processed: 5
   Success rate: 80.0%
   Avg original accuracy: 92.15%
   Avg adversarial accuracy: 45.67%
============================================================
```

## Quick Start

1. **Add images to this folder**
2. **Start the backend**: `python app.py`
3. **Open the frontend** and go to "Threat Assessment"
4. **Select a model** and attack type
5. **Click "Run Threat Assessment"**
6. Backend will automatically use random images from this folder

## Notes

- If this folder is **empty**, you'll get an error message
- Minimum **1 image** required, but **5+ recommended**
- Images are **randomly selected** on each run
- All images are automatically **preprocessed** by the model's processor
- Different runs may use **different images** (random selection)

## Troubleshooting

### "No images found" error
- **Cause**: This folder is empty
- **Solution**: Add at least one image file to this folder

### Images not loading
- **Cause**: Unsupported format or corrupted file
- **Solution**: Use `.jpg` or `.png` format, ensure files are valid images

### All attacks failing
- **Cause**: Images might not match model's expected domain
- **Solution**: Use images similar to what the model was trained on

---

**Ready to test?** Add your images and run a threat assessment! 🛡️
