# 🛡️ ThreatSentry - AI Security Testing Platform

<div align="center">

![ThreatSentry Logo](https://img.shields.io/badge/ThreatSentry-AI_Security-blue?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://threat-sentry.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A comprehensive platform for testing adversarial robustness of AI models**

[Live Demo](https://threat-sentry.vercel.app/) • [Documentation](#documentation) • [Report Issues](https://github.com/yourusername/threatsentry/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Adversarial Attacks](#adversarial-attacks)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## 🎯 Overview

**ThreatSentry** is an advanced cybersecurity platform designed to evaluate and enhance the robustness of AI/ML models against adversarial attacks. As machine learning systems become increasingly prevalent in critical applications, ensuring their security against malicious manipulation is paramount.

This project addresses the growing concern of **adversarial attacks** on deep learning models by providing a comprehensive testing framework that simulates real-world attack scenarios including FGSM, PGD, and DeepFool attacks.

### 🎓 Academic Context

This project was developed as part of a **Problem-Based Learning (PBL)** initiative to address real-world cybersecurity challenges in AI systems. It demonstrates the practical application of adversarial machine learning concepts and provides hands-on experience with model security testing.

**Live Platform**: [https://threat-sentry.vercel.app/](https://threat-sentry.vercel.app/)

---

## 🔍 Problem Statement

### The Challenge

Modern AI systems, particularly image classification models, are vulnerable to **adversarial attacks** - carefully crafted inputs designed to fool machine learning models. These attacks can:

- **Bypass security systems** (facial recognition, object detection)
- **Manipulate autonomous vehicles** (misclassify traffic signs)
- **Compromise medical diagnosis** (alter medical image interpretations)
- **Evade fraud detection** systems

### The Threat Landscape

1. **Evasion Attacks**: Subtle perturbations that cause misclassification
2. **Model Poisoning**: Training data manipulation
3. **Privacy Breaches**: Extracting sensitive information from models
4. **Backdoor Attacks**: Hidden triggers in neural networks

### Our Solution

ThreatSentry provides:
- ✅ **Automated adversarial testing** against state-of-the-art attacks
- ✅ **Real-time vulnerability assessment** for Hugging Face models
- ✅ **Comprehensive reporting** with detailed metrics and visualizations
- ✅ **User-friendly interface** for security researchers and ML engineers
- ✅ **Production-ready API** for CI/CD integration

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Clerk Integration**: Secure user authentication and session management
- **Protected Routes**: Dashboard and assessment tools restricted to authenticated users
- **User Profiles**: Personalized experience with user avatars and preferences

### 🎯 Threat Assessment Dashboard
- **Model Selection**: Test any compatible Hugging Face image classification model
- **Attack Configuration**: Choose from FGSM, PGD, or DeepFool attack methods
- **Real-time Progress**: Live tracking of assessment execution
- **Comprehensive Results**: Detailed metrics including success rates, confidence scores, and per-image analysis

### ⚔️ Adversarial Attack Methods

#### 1. **FGSM (Fast Gradient Sign Method)**
- **Type**: Single-step gradient-based attack
- **Speed**: ⚡ Fast
- **Effectiveness**: Moderate
- **Best for**: Quick vulnerability assessment

#### 2. **PGD (Projected Gradient Descent)**
- **Type**: Iterative gradient-based attack
- **Speed**: ⚡⚡ Moderate
- **Effectiveness**: High
- **Best for**: Thorough security testing

#### 3. **DeepFool**
- **Type**: Minimal perturbation attack
- **Speed**: ⚡⚡⚡ Slower
- **Effectiveness**: Very High
- **Best for**: Finding decision boundaries

### 📊 Results & Analytics
- **Success Rate Metrics**: Percentage of successful adversarial examples
- **Confidence Analysis**: Original vs. adversarial prediction confidence
- **Per-Image Breakdown**: Detailed results for each test image
- **PDF Report Generation**: Downloadable comprehensive assessment reports
- **Visual Comparisons**: Side-by-side original and adversarial examples

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes**: User-preferred color schemes
- **3D Animations**: Engaging visual effects using Framer Motion
- **Real-time Feedback**: Toast notifications and progress indicators
- **Accessible**: WCAG 2.1 compliant interface

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Routing**: React Router DOM 6.30
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12.23
- **Authentication**: Clerk React 5.51
- **State Management**: TanStack Query 5.83
- **Form Handling**: React Hook Form 7.61 + Zod validation

### Backend
- **Framework**: Flask 3.0 (Python)
- **CORS**: Flask-CORS 4.0
- **ML Framework**: PyTorch 2.2 + torchvision 0.17
- **Model Hub**: Hugging Face Transformers 4.38
- **Image Processing**: Pillow 10.1
- **Numerical Computing**: NumPy 1.26
- **Visualization**: Matplotlib 3.8 + Seaborn 0.13
- **Acceleration**: CUDA support with CPU fallback

### Development Tools
- **Linting**: ESLint 9.32 with TypeScript support
- **Package Manager**: npm/Bun
- **Version Control**: Git
- **Code Quality**: TypeScript strict mode
- **API Testing**: Built-in test suite

### Deployment
- **Frontend**: Vercel
- **Backend**: Python Flask server
- **CI/CD**: Automated deployments

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  Landing   │  │ Dashboard  │  │ Threat Assessment  │   │
│  │    Page    │  │   (Auth)   │  │      (Auth)        │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
│         │                │                   │              │
│         └────────────────┴───────────────────┘              │
│                          │                                  │
│                  ┌───────▼────────┐                        │
│                  │  Clerk Auth    │                        │
│                  └───────┬────────┘                        │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    REST API (HTTPS)
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  Backend (Flask API)                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Adversarial Attack Engine                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │   FGSM   │  │   PGD    │  │    DeepFool      │  │  │
│  │  │  Attack  │  │  Attack  │  │     Attack       │  │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Hugging Face Model Loader                    │  │
│  │   • AutoImageProcessor                               │  │
│  │   • AutoModelForImageClassification                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            PyTorch Computation Engine                 │  │
│  │   • GPU Acceleration (CUDA)                          │  │
│  │   • CPU Fallback                                     │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**: Clerk handles secure login/signup
2. **Model Selection**: User specifies Hugging Face model ID
3. **Attack Configuration**: User selects attack type and parameters
4. **Request Submission**: Frontend sends POST to `/api/threat-assessment`
5. **Model Loading**: Backend loads model from Hugging Face Hub
6. **Image Processing**: Random images from attack folder are preprocessed
7. **Attack Execution**: Selected adversarial attack is performed
8. **Evaluation**: Original vs. adversarial predictions compared
9. **Report Generation**: PDF report with visualizations created
10. **Results Delivery**: JSON response with detailed metrics returned

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm (or Bun)
- **Python** 3.9+
- **Git**
- **CUDA** (optional, for GPU acceleration)

### Frontend Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd ThreatSentry

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Clerk API keys to .env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create attack images folder
mkdir attack
# Add test images (JPG, PNG) to backend/attack/ folder

# Start Flask server
python app.py
```

The backend API will be available at `http://localhost:5000`

### Environment Configuration

#### Frontend (.env.local)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

#### Backend Configuration
- Update `ATTACK_IMAGES_FOLDER` in `app.py` if needed
- Configure CUDA settings in PyTorch
- Adjust attack parameters (epsilon, iterations, etc.)

---

## 🚀 Usage

### 1. Access the Platform

Visit [https://threat-sentry.vercel.app/](https://threat-sentry.vercel.app/) or your local instance at `http://localhost:5173`

### 2. Sign Up / Sign In

- Click "Sign In" in the navigation bar
- Create a new account or sign in with existing credentials
- Clerk handles the authentication securely

### 3. Navigate to Dashboard

- After authentication, access your personalized dashboard
- View security statistics and recent alerts
- Click "Run Threat Assessment" to start testing

### 4. Configure Assessment

**Select a Compatible Model:**
```
google/vit-base-patch16-224
microsoft/resnet-50
facebook/convnext-tiny-224
```

**Choose Attack Type:**
- FGSM: Fast, single-step attack
- PGD: Iterative, powerful attack
- DeepFool: Minimal perturbation attack

### 5. Run Assessment

- Click "Run Assessment"
- Monitor real-time progress
- Wait for completion (typically 30-120 seconds)

### 6. Review Results

**Metrics Displayed:**
- Success Rate (%)
- Original Model Accuracy
- Adversarial Accuracy
- Execution Time
- Per-Image Results

### 7. Download Report

- Click "Download Report" button
- PDF includes visualizations and detailed analysis
- Use for documentation and compliance

---

## ⚔️ Adversarial Attacks

### FGSM (Fast Gradient Sign Method)

**Concept**: Single-step attack using gradient sign

**Formula**: 
```
x_adv = x + ε * sign(∇_x J(θ, x, y))
```

**Parameters:**
- `epsilon`: 0.03 (perturbation magnitude)

**Pros:**
- ⚡ Very fast execution
- Simple implementation
- Good for quick testing

**Cons:**
- Less effective than iterative methods
- Limited perturbation control

---

### PGD (Projected Gradient Descent)

**Concept**: Iterative FGSM with projection

**Formula**:
```
x^(t+1) = Π_ε(x^(t) + α * sign(∇_x J(θ, x^(t), y)))
```

**Parameters:**
- `epsilon`: 0.03 (L∞ bound)
- `alpha`: 0.01 (step size)
- `num_iter`: 10 (iterations)

**Pros:**
- 🎯 High success rate
- Better adversarial examples
- Industry standard

**Cons:**
- Slower than FGSM
- More computationally intensive

---

### DeepFool

**Concept**: Finds minimal perturbation to decision boundary

**Algorithm**:
1. Compute gradients for all classes
2. Find closest decision boundary
3. Iteratively add minimal perturbation
4. Stop when misclassification occurs

**Parameters:**
- `num_classes`: 10 (classes to consider)
- `overshoot`: 0.02 (boundary margin)
- `max_iter`: 50 (maximum iterations)

**Pros:**
- 🎯 Minimal perturbations
- Finds decision boundaries
- Research-grade results

**Cons:**
- Slowest method
- Computationally expensive
- May require more iterations

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Threat Assessment

**Endpoint**: `POST /api/threat-assessment`

**Request Body**:
```json
{
  "model_id": "google/vit-base-patch16-224",
  "attack_type": "fgsm"
}
```

**Response**:
```json
{
  "attack_type": "FGSM",
  "success_rate": 78.5,
  "original_accuracy": 96.2,
  "adversarial_accuracy": 21.5,
  "execution_time": 45.3,
  "num_images": 50,
  "image_results": [
    {
      "image_name": "test_001.jpg",
      "success": true,
      "original_pred": 243,
      "adversarial_pred": 156,
      "original_confidence": 98.5,
      "adversarial_confidence": 67.3
    }
  ],
  "details": "Attack summary..."
}
```

**Error Responses**:

```json
{
  "error": "Invalid model type",
  "message": "The model is not an image classification model",
  "details": "Please use a vision model"
}
```

```json
{
  "error": "Model loading failed",
  "message": "Failed to load the specified model",
  "details": "Model not found on Hugging Face Hub"
}
```

---

#### 2. Generate Report

**Endpoint**: `POST /api/generate-report`

**Request Body**:
```json
{
  "results": { /* assessment results */ },
  "model_id": "google/vit-base-patch16-224"
}
```

**Response**: PDF file (binary)

---

#### 3. Health Check

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-21T10:30:00Z"
}
```

---

## 📁 Project Structure

```
ThreatSentry/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── requirements.txt          # Python dependencies
│   ├── test_backend.py          # API tests
│   ├── attack/                   # Test images folder
│   │   └── README.md
│   └── FIX_NUMPY.md
│
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Navigation.tsx        # Nav bar with auth
│   │   ├── HeroSection.tsx       # Landing hero
│   │   ├── ThreatSection.tsx     # Threat info
│   │   ├── SolutionsSection.tsx  # Solutions overview
│   │   ├── ResourcesSection.tsx  # Resources
│   │   ├── CTASection.tsx        # Call-to-action
│   │   ├── Footer.tsx            # Footer
│   │   ├── ProtectedRoute.tsx    # Auth guard
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       ├── progress.tsx
│   │       └── ...               # 40+ UI components
│   │
│   ├── pages/
│   │   ├── Index.tsx             # Landing page
│   │   ├── ThreatAssessment.tsx  # Assessment tool
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Mobile detection
│   │   └── use-toast.ts          # Toast notifications
│   │
│   ├── lib/
│   │   └── utils.ts              # Utility functions
│   │
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
│
├── public/
│   └── robots.txt
│
├── package.json                  # Node dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts               # Vite configuration
├── tailwind.config.ts           # Tailwind config
├── components.json              # shadcn/ui config
├── eslint.config.js             # ESLint rules
├── vercel.json                  # Vercel deployment
│
├── CLERK_SETUP.md               # Auth setup guide
├── THREAT_ASSESSMENT_SETUP.md   # Feature setup guide
├── COMPATIBLE_MODELS.md         # Model compatibility
├── MODEL_COMPATIBILITY_UPDATE.md
├── MULTI_IMAGE_UPDATE.md
├── QUICK_REFERENCE.md
└── README.md                    # This file
```

---

## 🎓 Educational Value

### Learning Outcomes

This project demonstrates:

1. **Full-Stack Development**: React frontend + Flask backend integration
2. **AI/ML Security**: Practical adversarial machine learning
3. **Authentication**: Clerk-based secure authentication
4. **API Design**: RESTful API development with Flask
5. **Modern UI/UX**: Component-based design with shadcn/ui
6. **DevOps**: Deployment on Vercel with CI/CD

### Key Concepts Covered

- **Adversarial Machine Learning**
- **Computer Vision Security**
- **Gradient-Based Attacks**
- **Model Robustness Testing**
- **API Integration**
- **Authentication & Authorization**
- **Responsive Web Design**
- **TypeScript Best Practices**

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Write clear commit messages

---

## 👥 Team

Developed as part of a Problem-Based Learning initiative to address real-world AI security challenges.

**Project Type**: Academic PBL Project  
**Domain**: Cybersecurity & Adversarial Machine Learning  
**Institution**: [Your Institution Name]  
**Academic Year**: 2024-2025

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hugging Face**: For the Transformers library and model hub
- **PyTorch**: For the deep learning framework
- **shadcn/ui**: For the beautiful UI components
- **Clerk**: For authentication infrastructure
- **Vercel**: For hosting and deployment

---

## 📞 Support

- **Documentation**: [THREAT_ASSESSMENT_SETUP.md](THREAT_ASSESSMENT_SETUP.md)
- **Compatible Models**: [COMPATIBLE_MODELS.md](COMPATIBLE_MODELS.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/threatsentry/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/threatsentry/discussions)

---

## 🔗 Quick Links

- [Live Demo](https://threat-sentry.vercel.app/)
- [Clerk Documentation](https://clerk.com/docs)
- [Hugging Face Models](https://huggingface.co/models?pipeline_tag=image-classification)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

<div align="center">

**⚠️ Disclaimer**: This tool is for educational and research purposes only. Always obtain proper authorization before testing models in production environments.

Made with ❤️ by the ThreatSentry Team

[⬆ Back to Top](#-threatsentry---ai-security-testing-platform)

</div>
