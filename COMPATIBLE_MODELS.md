# Compatible Models for ThreatSentry

## ⚠️ Important: Image Classification Models Only

ThreatSentry's threat assessment tool **only works with image classification models** from Hugging Face Hub. 

### ❌ What Doesn't Work
- Text models (BERT, GPT, T5, etc.)
- Audio models
- Video models
- Multimodal models without image classification support

### ✅ What Works
Any image classification model that supports:
- `AutoImageProcessor`
- `AutoModelForImageClassification`

---

## 🎯 Recommended Models for Testing

### Small & Fast (Good for Testing)
Perfect for quick tests and development:

```
google/vit-base-patch16-224
microsoft/resnet-50
facebook/convnext-tiny-224
microsoft/swin-tiny-patch4-window7-224
google/mobilenet_v2_1.0_224
```

### Medium Size (Balanced)
Good balance of performance and speed:

```
google/vit-large-patch16-224
microsoft/beit-base-patch16-224
facebook/deit-base-patch16-224
microsoft/swinv2-base-patch4-window12-192-22k
facebook/convnext-base-224
```

### Large Models (High Accuracy)
More powerful but slower:

```
google/vit-large-patch16-384
microsoft/swin-large-patch4-window7-224
facebook/convnext-large-224-22k
google/efficientnet-b7
```

---

## 📋 Model Categories

### Vision Transformers (ViT)
- `google/vit-base-patch16-224`
- `google/vit-large-patch16-224`
- `google/vit-base-patch32-224`

### Swin Transformers
- `microsoft/swin-tiny-patch4-window7-224`
- `microsoft/swin-base-patch4-window7-224`
- `microsoft/swin-large-patch4-window7-224`
- `microsoft/swinv2-tiny-patch4-window8-256`

### ResNet
- `microsoft/resnet-50`
- `microsoft/resnet-101`
- `microsoft/resnet-152`

### ConvNeXt
- `facebook/convnext-tiny-224`
- `facebook/convnext-small-224`
- `facebook/convnext-base-224`
- `facebook/convnext-large-224`

### DeiT (Data-efficient Image Transformers)
- `facebook/deit-tiny-patch16-224`
- `facebook/deit-small-patch16-224`
- `facebook/deit-base-patch16-224`

### BEiT
- `microsoft/beit-base-patch16-224`
- `microsoft/beit-large-patch16-224`

### MobileNet (Mobile-optimized)
- `google/mobilenet_v2_1.0_224`
- `google/mobilenet_v1_1.0_224`

### EfficientNet
- `google/efficientnet-b0`
- `google/efficientnet-b1`
- `google/efficientnet-b2`
- `google/efficientnet-b3`
- `google/efficientnet-b4`

---

## 🔍 How to Find More Models

### Method 1: Hugging Face Hub
Visit [huggingface.co/models](https://huggingface.co/models)

1. Filter by task: **Image Classification**
2. Sort by: **Most Downloads** or **Most Likes**
3. Look for models with the 🖼️ icon

### Method 2: Search by Organization
Browse models from these trusted organizations:
- [Google](https://huggingface.co/google)
- [Microsoft](https://huggingface.co/microsoft)
- [Facebook/Meta](https://huggingface.co/facebook)

### Method 3: Use the API
Check if a model is compatible using our validation endpoint:

```bash
curl -X POST http://localhost:5000/api/validate-model \
  -H "Content-Type: application/json" \
  -d '{"model_id": "google/vit-base-patch16-224"}'
```

---

## 🚀 Quick Start Examples

### Example 1: Test with ViT
```
Model ID: google/vit-base-patch16-224
Attack: FGSM
Expected: Fast execution, good baseline results
```

### Example 2: Test with ResNet
```
Model ID: microsoft/resnet-50
Attack: PGD
Expected: Stronger defense, may be more robust
```

### Example 3: Test with ConvNeXt
```
Model ID: facebook/convnext-tiny-224
Attack: DeepFool
Expected: Modern architecture, interesting boundary analysis
```

---

## ⚡ Performance Tips

### For Fast Testing
Use small models:
- `google/mobilenet_v2_1.0_224` - Very fast
- `facebook/convnext-tiny-224` - Good balance
- `google/vit-base-patch16-224` - Popular choice

### For Thorough Testing
Use robust models:
- `microsoft/swin-base-patch4-window7-224`
- `google/vit-large-patch16-224`
- `facebook/convnext-base-224`

### For Research
Use state-of-the-art models:
- `microsoft/swin-large-patch4-window7-224`
- `facebook/convnext-large-224-22k`
- `google/vit-large-patch16-384`

---

## ❌ Common Mistakes

### Don't Use Text Models
These will **NOT** work:
- ❌ `bert-base-uncased`
- ❌ `gpt2`
- ❌ `t5-base`
- ❌ `roberta-base`
- ❌ `boltuix/bert-micro`

### Don't Use Audio Models
These will **NOT** work:
- ❌ `facebook/wav2vec2-base`
- ❌ `openai/whisper-tiny`

### Don't Use Object Detection Models
These require different input format:
- ❌ `facebook/detr-resnet-50`
- ❌ `microsoft/table-transformer-detection`

---

## 🔧 Troubleshooting

### Error: "does not appear to have a file named preprocessor_config.json"
**Cause:** You're using a non-image model (likely a text model)

**Solution:** Use an image classification model from the list above

### Error: "Model not found"
**Cause:** Model ID doesn't exist or is misspelled

**Solution:** 
1. Check the model exists on huggingface.co
2. Copy the exact model ID from Hugging Face
3. Format: `organization/model-name`

### Error: "Out of memory"
**Cause:** Model is too large for your GPU/RAM

**Solution:**
1. Use a smaller model (tiny/base instead of large)
2. Close other applications
3. Try CPU mode (automatic fallback)

---

## 📊 Expected Results

### Typical Success Rates

**FGSM Attack:**
- Most models: 60-90% success rate
- Robust models: 30-60% success rate

**PGD Attack:**
- Most models: 70-95% success rate
- Robust models: 40-70% success rate

**DeepFool Attack:**
- Most models: 80-100% success rate
- Robust models: 50-80% success rate

### What "Success" Means
- **High Success Rate (>70%)**: Model is vulnerable
- **Medium Success Rate (40-70%)**: Some robustness
- **Low Success Rate (<40%)**: Good defense

---

## 💡 Best Practices

1. **Start Small**: Test with `google/vit-base-patch16-224` first
2. **Use Good Images**: Clear, well-lit photos work best
3. **Try Multiple Attacks**: Each attack reveals different vulnerabilities
4. **Compare Models**: Test several models to see differences
5. **Note Patterns**: Document which architectures are more robust

---

## 🎓 Learning Resources

- [Hugging Face Model Hub](https://huggingface.co/models?pipeline_tag=image-classification)
- [Image Classification Guide](https://huggingface.co/docs/transformers/tasks/image_classification)
- [Vision Transformer Paper](https://arxiv.org/abs/2010.11929)
- [Adversarial Examples Overview](https://arxiv.org/abs/1312.6199)

---

## 📝 Notes

- First run will download the model (may take time)
- Models are cached in `~/.cache/huggingface/`
- Larger models need more memory
- GPU accelerates testing significantly
- CPU mode works but is slower

---

**Quick Copy-Paste Models:**
```
google/vit-base-patch16-224
microsoft/resnet-50
facebook/convnext-tiny-224
microsoft/swin-tiny-patch4-window7-224
```
