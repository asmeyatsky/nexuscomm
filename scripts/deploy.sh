#!/bin/bash
set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-nexuscomm-487512}"
REGION="${REGION:-us-central1}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"

echo "=== NexusComm Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Image Tag: $IMAGE_TAG"
echo ""

# 1. Build and push Docker images
echo ">>> Building Docker images..."

# Configure Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build backend
echo "Building backend..."
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nexuscomm/backend:${IMAGE_TAG} ./backend
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nexuscomm/backend:${IMAGE_TAG}

# Build frontend
echo "Building frontend..."
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nexuscomm/frontend:${IMAGE_TAG} ./web
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nexuscomm/frontend:${IMAGE_TAG}

echo ">>> Docker images pushed successfully"

# 2. Apply Terraform
echo ">>> Applying Terraform..."
cd terraform

# Initialize Terraform
terraform init

# Apply with auto-approve (or use -auto-approve in CI)
terraform apply \
  -var="project_id=${PROJECT_ID}" \
  -var="region=${REGION}" \
  -var="image_tag=${IMAGE_TAG}" \
  -var="database_url=${DATABASE_URL}" \
  -var="redis_url=${REDIS_URL}" \
  -var="gemini_api_key=${GEMINI_API_KEY}" \
  -var="weaviate_url=${WEAVIATE_URL:-}" \
  -var="weaviate_api_key=${WEAVIATE_API_KEY:-}"

echo ""
echo "=== Deployment Complete ==="
echo "Backend: $(terraform output -raw backend_url)"
echo "Frontend: $(terraform output -raw frontend_url)"
