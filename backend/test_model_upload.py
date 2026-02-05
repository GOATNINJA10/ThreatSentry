"""
Test script for custom model upload functionality
Creates a simple test model and tests the upload API
"""

import torch
import torch.nn as nn
import requests
import os

# Create a simple test PyTorch model
class SimpleTestModel(nn.Module):
    def __init__(self, num_classes=10):
        super(SimpleTestModel, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Linear(64 * 56 * 56, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

def create_test_model():
    """Create and save a test PyTorch model"""
    print("Creating test model...")
    model = SimpleTestModel(num_classes=10)
    
    # Save the model
    model_path = "test_model.pt"
    torch.save(model, model_path)
    print(f"✅ Model saved to {model_path}")
    
    return model_path

def test_upload_model(model_path):
    """Test uploading a model to the backend"""
    print("\n" + "="*60)
    print("Testing Model Upload API")
    print("="*60)
    
    url = "http://localhost:5000/api/models/upload"
    
    # Prepare the file and form data
    with open(model_path, 'rb') as f:
        files = {'file': (os.path.basename(model_path), f, 'application/octet-stream')}
        data = {
            'name': 'Test Model',
            'description': 'A simple test model for demonstration',
            'num_classes': '10',
            'input_size': '224'
        }
        
        print(f"\n📤 Uploading model to {url}...")
        response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print("✅ Upload successful!")
            print(f"   Model ID: {result['model_id']}")
            print(f"   Model Name: {result['model']['name']}")
            return result['model_id']
        else:
            print("❌ Upload failed!")
            print(f"   Error: {result}")
            return None
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_list_models():
    """Test listing all models"""
    print("\n" + "="*60)
    print("Testing List Models API")
    print("="*60)
    
    url = "http://localhost:5000/api/models/list"
    print(f"\n📋 Fetching model list from {url}...")
    
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ Found {result['count']} model(s)")
            for model in result['models']:
                print(f"\n   📦 {model['name']}")
                print(f"      ID: {model['id']}")
                print(f"      Type: .{model['file_type']}")
                print(f"      Classes: {model['num_classes']}")
                print(f"      Input Size: {model['input_size']}x{model['input_size']}")
                print(f"      Size: {model['file_size'] / 1024 / 1024:.2f} MB")
            return True
        else:
            print("❌ Failed to list models")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

def test_model_info(model_id):
    """Test getting model info"""
    print("\n" + "="*60)
    print("Testing Get Model Info API")
    print("="*60)
    
    url = f"http://localhost:5000/api/models/info/{model_id}"
    print(f"\n📊 Fetching model info from {url}...")
    
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            model = result['model']
            print("✅ Model info retrieved successfully!")
            print(f"   Name: {model['name']}")
            print(f"   Description: {model['description']}")
            print(f"   Upload Date: {model['upload_date']}")
            return True
        else:
            print("❌ Failed to get model info")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

def test_delete_model(model_id):
    """Test deleting a model"""
    print("\n" + "="*60)
    print("Testing Delete Model API")
    print("="*60)
    
    url = f"http://localhost:5000/api/models/delete/{model_id}"
    print(f"\n🗑️  Deleting model from {url}...")
    
    response = requests.delete(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print("✅ Model deleted successfully!")
            return True
        else:
            print("❌ Failed to delete model")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

def main():
    """Main test function"""
    print("\n" + "="*60)
    print("🧪 CUSTOM MODEL UPLOAD TEST SUITE")
    print("="*60)
    print("\nThis script will test the custom model upload functionality")
    print("Make sure the backend server is running on localhost:5000\n")
    
    try:
        # Step 1: Create a test model
        model_path = create_test_model()
        
        # Step 2: Test upload
        model_id = test_upload_model(model_path)
        
        if not model_id:
            print("\n❌ Upload test failed. Stopping.")
            return
        
        # Step 3: Test list models
        test_list_models()
        
        # Step 4: Test get model info
        test_model_info(model_id)
        
        # Step 5: Test delete model
        # Uncomment the line below to test deletion
        # test_delete_model(model_id)
        
        # Cleanup
        if os.path.exists(model_path):
            os.remove(model_path)
            print(f"\n🧹 Cleaned up test file: {model_path}")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED!")
        print("="*60)
        print("\nYou can now:")
        print("1. Check the backend/models/ directory for uploaded files")
        print("2. View the model in the frontend UI")
        print("3. Run a threat assessment with your custom model")
        print("\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to backend server")
        print("   Make sure the Flask backend is running on localhost:5000")
        print("   Run: python backend/app.py")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
