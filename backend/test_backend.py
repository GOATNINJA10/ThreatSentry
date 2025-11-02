import requests
import sys
from PIL import Image
import io

def test_backend():
    """Test the ThreatSentry backend API"""
    
    print("=" * 50)
    print("ThreatSentry Backend Test")
    print("=" * 50)
    print()
    
    # Test 1: Health Check
    print("Test 1: Health Check")
    try:
        response = requests.get('http://localhost:5000/api/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Device: {data.get('device')}")
            print(f"   CUDA Available: {data.get('cuda_available')}")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server!")
        print("   Make sure the server is running: python backend/app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print()
    
    # Test 2: Create dummy image
    print("Test 2: Creating test image")
    try:
        # Create a simple test image
        img = Image.new('RGB', (224, 224), color='red')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        print("✅ Test image created")
    except Exception as e:
        print(f"❌ Failed to create test image: {e}")
        return False
    
    print()
    
    # Test 3: API endpoint
    print("Test 3: Testing threat assessment endpoint")
    print("   This will attempt to load a model and may take time...")
    print("   Note: This test uses a small model for speed")
    
    try:
        files = {
            'image': ('test.png', img_byte_arr, 'image/png')
        }
        data = {
            'model_id': 'google/vit-base-patch16-224',  # Popular small model
            'attack_type': 'fgsm'
        }
        
        print("   Sending request (this may take 30-60 seconds)...")
        response = requests.post(
            'http://localhost:5000/api/threat-assessment',
            files=files,
            data=data,
            timeout=120  # 2 minutes timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Threat assessment completed!")
            print(f"   Attack Type: {result.get('attack_type')}")
            print(f"   Success Rate: {result.get('success_rate'):.2f}%")
            print(f"   Original Accuracy: {result.get('original_accuracy'):.2f}%")
            print(f"   Adversarial Accuracy: {result.get('adversarial_accuracy'):.2f}%")
            print(f"   Execution Time: {result.get('execution_time'):.2f}s")
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        print("   The model might be too large or downloading")
        print("   Try again or use a smaller model")
        return False
    except Exception as e:
        print(f"❌ Error during threat assessment: {e}")
        return False
    
    print()
    print("=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)
    return True

if __name__ == '__main__':
    print()
    success = test_backend()
    print()
    
    if success:
        print("🎉 Backend is working correctly!")
        print("You can now use the frontend to run threat assessments.")
    else:
        print("⚠️ Some tests failed.")
        print("Please check the error messages above.")
    
    print()
    sys.exit(0 if success else 1)
