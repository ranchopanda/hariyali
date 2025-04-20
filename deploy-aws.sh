#!/bin/bash
# AWS Deployment Script for Plant Disease Detection Service

# Configuration
APP_NAME="plant-disease-detection"
S3_BUCKET="your-bucket-name"
CLOUDFRONT_DIST_ID="your-distribution-id"

echo "🚀 Deploying $APP_NAME to AWS"

# 1. Sync static assets
aws s3 sync dist/ s3://$S3_BUCKET/plant-disease-detection/ \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# 2. Upload HTML with shorter cache
aws s3 cp dist/index.html s3://$S3_BUCKET/plant-disease-detection/ \
  --cache-control "public, max-age=3600" 

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/plant-disease-detection/*"

echo "✅ Deployment complete! Access at: https://$S3_BUCKET.s3.amazonaws.com/plant-disease-detection/index.html"
