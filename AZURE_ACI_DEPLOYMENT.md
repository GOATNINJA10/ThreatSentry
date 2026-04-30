# Azure Container Instances (ACI) Deployment Guide

Deploy ThreatSentry backend on Azure Container Instances for **20-30% faster execution** with pre-cached dependencies.

---

## Prerequisites

1. **Azure CLI** installed ([download](https://learn.microsoft.com/cli/azure/install-azure-cli))
2. **Docker** installed ([download](https://www.docker.com/products/docker-desktop))
3. **Azure subscription** with budget remaining
4. **Backend `.env` file** with Clerk credentials

---

## Step 1: Create Azure Container Registry (ACR)

```bash
# Login to Azure
az login

# Set variables (customize these)
RESOURCE_GROUP="threatsentry-rg"
REGISTRY_NAME="threatsentry"  # Must be unique, lowercase, 5-50 chars
LOCATION="centralindia"
IMAGE_NAME="threatsentry-backend"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create container registry (Basic = $5/month)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --location $LOCATION

# Get registry login credentials
az acr credential show --name $REGISTRY_NAME --query "passwords[0]"
```

**Output:** Copy the username and password for later.

---

## Step 2: Build Docker Image Locally

```bash
# Navigate to project root
cd d:\ThreatSentry

# Build image (takes 3-5 minutes, includes model caching)
docker build -t threatsentry-backend:latest \
  -f Dockerfile .

# Test locally (optional)
docker run -it \
  -p 5000:5000 \
  -e CLERK_JWKS_URL="your_clerk_jwks_url" \
  -e CLERK_ISSUER="your_clerk_issuer" \
  -e CLERK_AUDIENCE="your_clerk_audience" \
  -e CORS_ALLOWED_ORIGINS="https://threat-sentry.vercel.app" \
  threatsentry-backend:latest

# Verify health check
curl http://localhost:5000/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "device": "cpu",
  "cuda_available": false
}
```

---

## Step 3: Push Image to Azure Container Registry

```bash
# Login to Azure Container Registry
az acr login --name $REGISTRY_NAME

# Tag image with registry
docker tag threatsentry-backend:latest \
  $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest

# Push to ACR (takes 2-3 minutes)
docker push $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest

# Verify (list images in registry)
az acr repository list --name $REGISTRY_NAME
```

---

## Step 4: Deploy to Azure Container Instances

```bash
# Set container instance variables
CONTAINER_NAME="threatsentry-backend"
PORT=5000

# Get ACR credentials for ACI
REGISTRY_USERNAME=$(az acr credential show --name $REGISTRY_NAME --query "username" -o tsv)
REGISTRY_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv)

# Deploy container instance (takes 1-2 minutes)
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest \
  --cpu 2 \
  --memory 3.5 \
  --ports $PORT \
  --protocol TCP \
  --registry-login-server $REGISTRY_NAME.azurecr.io \
  --registry-username $REGISTRY_USERNAME \
  --registry-password $REGISTRY_PASSWORD \
  --environment-variables \
    CLERK_JWKS_URL="your_clerk_jwks_url" \
    CLERK_ISSUER="your_clerk_issuer" \
    CLERK_AUDIENCE="your_clerk_audience" \
    CORS_ALLOWED_ORIGINS="https://threat-sentry.vercel.app" \
    CLERK_JWT_LEEWAY_SECONDS="120" \
  --restart-policy OnFailure \
  --no-wait

# Get container details (wait ~2 minutes for deployment)
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME

# Get the public IP
CONTAINER_IP=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query ipAddress.ip \
  -o tsv)

echo "Container IP: $CONTAINER_IP"
```

---

## Step 5: Verify Deployment

```bash
# Check health (replace with your IP)
curl http://$CONTAINER_IP:5000/api/health

# Check logs (real-time)
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --follow

# Monitor container stats
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME
```

---

## Step 6: Update Frontend Backend URL

In [src/pages/ThreatAssessment.tsx](src/pages/ThreatAssessment.tsx), update:

```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://<YOUR_CONTAINER_IP>:5000";
```

Or set environment variable in `.env`:
```
VITE_BACKEND_URL=http://<YOUR_CONTAINER_IP>:5000
```

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Container Registry (Basic) | ~$5/month | Stores your Docker images |
| Container Instances (0.5 vCPU, 1.5GB) | ~$0.019/hour | Only charged when running |
| Container Instances (2 vCPU, 3.5GB) | ~$0.079/hour | Recommended for 10+ images/run |

**Example monthly cost (2 vCPU instance):**
- 100 runs/month at 2 min each = 3.3 hours
- Cost: `$0.079 × 3.3 = $0.26` + registry ($5) = **~$5.26/month**

---

## Speed Comparison

| Scenario | App Service | ACI |
|----------|-----------|-----|
| **First run** | 120–140s | 90–110s (pre-cached) |
| **Subsequent runs** | 115–130s | 85–105s |
| **Cold start** | Yes (30–40s) | No |
| **Model download** | Every run | Once (in image) |

**Savings: ~20–30 seconds per run** ✅

---

## Stopping/Deleting Container

```bash
# Stop container (keeps it for restart)
az container stop \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME

# Start again
az container start \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME

# Delete container (removes permanently)
az container delete \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --yes

# Delete registry (removes all images)
az acr delete \
  --name $REGISTRY_NAME \
  --yes

# Delete resource group (cleans up everything)
az group delete \
  --name $RESOURCE_GROUP \
  --yes
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME

# Likely causes:
# - Wrong environment variables (check CLERK credentials)
# - Port not exposed properly
# - Insufficient memory (increase to 3.5GB)
```

### Slow performance
```bash
# Increase CPU/memory
az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes

# Redeploy with larger specs
# --cpu 2 --memory 3.5  (recommended minimum)
# --cpu 4 --memory 7    (for heavy workloads)
```

### Image push fails
```bash
# Re-authenticate
az acr login --name $REGISTRY_NAME

# Check image size
docker images | grep threatsentry-backend

# If >2GB, rebuild with --no-cache
docker build --no-cache -t threatsentry-backend:latest -f Dockerfile .
```

---

## Next Steps (Optional Optimizations)

1. **Set up monitoring**: Azure Container Insights
2. **Enable HTTPS**: Use Azure Application Gateway or Let's Encrypt
3. **Auto-scaling**: Use Azure Container Apps instead (handles scale automatically)
4. **Database**: Add Azure Cosmos DB for persistent history records

---

## Quick Reference Commands

```bash
# Save these as environment variables
export RESOURCE_GROUP="threatsentry-rg"
export REGISTRY_NAME="threatsentry"
export CONTAINER_NAME="threatsentry-backend"
export IMAGE_NAME="threatsentry-backend"

# Deploy (one-liner, after initial setup)
docker build -t $IMAGE_NAME:latest -f Dockerfile . && \
docker tag $IMAGE_NAME:latest $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest && \
docker push $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest
```
