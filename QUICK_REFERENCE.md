# ThreatSentry - Quick Reference

## 🚀 Quick Start

### Start Everything (Easy Way)
```powershell
.\start-all.bat
```

### Start Manually

**Backend:**
```powershell
cd backend
.\venv\Scripts\activate
python app.py
```

**Frontend:**
```powershell
npm run dev
# or
bun dev
```

## 📁 Project Structure

```
ThreatSentry/
├── src/
│   ├── pages/
│   │   └── ThreatAssessment.tsx    ← New threat assessment page
│   ├── components/
│   │   └── Dashboard.tsx           ← Updated with navigation
│   └── App.tsx                     ← Updated with new route
├── backend/
│   ├── app.py                      ← Flask server with attacks
│   ├── requirements.txt            ← Python dependencies
│   ├── test_backend.py            ← Backend test script
│   ├── start.bat                   ← Backend start script
│   └── README.md                   ← Backend documentation
└── THREAT_ASSESSMENT_SETUP.md      ← Full setup guide
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/pages/ThreatAssessment.tsx` | Main UI for running attacks |
| `backend/app.py` | Backend API with FGSM, PGD, DeepFool |
| `src/components/Dashboard.tsx` | Updated with navigation button |

## 🛠️ Available Attacks

| Attack | Description | Speed | Power |
|--------|-------------|-------|-------|
| **FGSM** | Fast Gradient Sign Method | ⚡⚡⚡ | ⭐⭐ |
| **PGD** | Projected Gradient Descent | ⚡⚡ | ⭐⭐⭐ |
| **DeepFool** | Minimal Perturbation | ⚡ | ⭐⭐⭐ |

## 🎯 Example Models

Copy and paste these into the threat assessment form:

```
google/vit-base-patch16-224
microsoft/resnet-50
facebook/convnext-tiny-224
microsoft/swin-tiny-patch4-window7-224
```

## 🔧 Common Commands

### Backend Setup (First Time Only)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Test Backend
```powershell
cd backend
.\venv\Scripts\activate
python test_backend.py
```

### Check Backend Health
```powershell
curl http://localhost:5000/api/health
```

## 📊 Understanding Results

### Success Rate
- **90-100%**: 🔴 Critical - Model is highly vulnerable
- **70-89%**: 🟠 High - Significant vulnerability
- **40-69%**: 🟡 Medium - Some resistance
- **0-39%**: 🟢 Low - Good resistance

### Accuracy Drop
The difference between original and adversarial accuracy:
- **>50%**: Severe impact
- **20-50%**: Moderate impact
- **<20%**: Minor impact

## 🔌 API Endpoints

### Health Check
```bash
GET http://localhost:5000/api/health
```

### Run Attack
```bash
POST http://localhost:5000/api/threat-assessment
Content-Type: multipart/form-data

model_id: "google/vit-base-patch16-224"
attack_type: "fgsm"
image: <file>
```

## ⚠️ Troubleshooting

### Backend won't start
```powershell
cd backend
pip install --upgrade -r requirements.txt
python app.py
```

### Frontend shows "Failed to fetch"
1. Check backend is running on port 5000
2. Look for errors in backend terminal
3. Try health check: `curl http://localhost:5000/api/health`

### CUDA errors
- Backend automatically falls back to CPU
- CPU works fine, just slower
- No action needed

### Model download fails
- Check internet connection
- Verify model exists on huggingface.co
- Wait and retry (servers may be busy)

## 📝 Usage Flow

1. **Start servers** → Use `start-all.bat` or start manually
2. **Navigate** → Dashboard → "Run Threat Assessment"
3. **Configure** → Enter model ID, upload image, select attack
4. **Run** → Click "Run Threat Assessment"
5. **Analyze** → View results in Overview/Details/Info tabs

## 🎨 UI Features

- ✅ Responsive design matching dashboard
- ✅ Real-time progress tracking
- ✅ Multiple result views (tabs)
- ✅ Attack information & recommendations
- ✅ Visual severity indicators
- ✅ Clean navigation

## 🔒 Security Notes

- This is a development tool
- Don't expose backend to internet without authentication
- Models are cached in `~/.cache/huggingface/`
- First run downloads models (may take time)

## 💡 Tips

1. **Start small** - Use lightweight models first
2. **Monitor memory** - Large models need more RAM/VRAM
3. **Be patient** - First run downloads the model
4. **Check logs** - Backend terminal shows useful info
5. **Use test script** - Run `test_backend.py` to verify setup

## 📚 Resources

- **Full Guide**: See `THREAT_ASSESSMENT_SETUP.md`
- **Backend Docs**: See `backend/README.md`
- **Hugging Face Models**: https://huggingface.co/models

## ✅ Checklist for First Use

- [ ] Backend virtual environment created
- [ ] Python dependencies installed
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access dashboard
- [ ] "Run Threat Assessment" button works
- [ ] Can upload an image
- [ ] Can run an attack successfully

## 🎉 Success Criteria

You know it's working when:
- ✅ Backend shows "Running on http://0.0.0.0:5000"
- ✅ Frontend opens at http://localhost:5173
- ✅ Can click "Run Threat Assessment" in dashboard
- ✅ Results appear after running an attack
- ✅ See accuracy metrics and recommendations

---

**Need Help?** Check the error messages in both terminals!
