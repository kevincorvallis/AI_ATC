#!/bin/bash

set -e

echo "========================================="
echo "AI ATC Training System - AWS Deployment"
echo "========================================="
echo ""

# Load environment variables if .env exists
if [ -f ../.env ]; then
    source ../.env
    echo "✓ Loaded environment variables from .env"
else
    echo "Warning: .env file not found. Using default values."
    LAMBDA_FUNCTION_NAME=${LAMBDA_FUNCTION_NAME:-"ai-atc-function"}
    API_GATEWAY_NAME=${API_GATEWAY_NAME:-"ai-atc-api"}
    AWS_REGION=${AWS_REGION:-"us-east-1"}
fi

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set in .env file"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Function Name: $LAMBDA_FUNCTION_NAME"
echo "  API Gateway:   $API_GATEWAY_NAME"
echo "  AWS Region:    $AWS_REGION"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf package lambda_package.zip
mkdir package

# Install dependencies
pip3 install -r requirements.txt -t package/ --quiet

# Copy Lambda function
cp lambda_function.py package/

# Create zip file
cd package
zip -r ../lambda_package.zip . > /dev/null
cd ..

echo "✓ Deployment package created"

# Check if Lambda function exists
echo ""
echo "🔍 Checking if Lambda function exists..."
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION 2>/dev/null; then
    echo "✓ Function exists, updating code..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb://lambda_package.zip \
        --region $AWS_REGION > /dev/null
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name $LAMBDA_FUNCTION_NAME \
        --environment "Variables={OPENAI_API_KEY=$OPENAI_API_KEY}" \
        --region $AWS_REGION > /dev/null
    
    echo "✓ Lambda function updated"
else
    echo "Function doesn't exist, creating new function..."
    
    # Create IAM role for Lambda if it doesn't exist
    ROLE_NAME="ai-atc-lambda-role"
    
    if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
        echo "Creating IAM role..."
        
        # Create trust policy
        cat > trust-policy.json << 'TRUST_EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
TRUST_EOF
        
        # Create role
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file://trust-policy.json \
            --region $AWS_REGION > /dev/null
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $AWS_REGION
        
        echo "✓ IAM role created"
        echo "⏳ Waiting 10 seconds for IAM role to propagate..."
        sleep 10
        
        rm trust-policy.json
    fi
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://lambda_package.zip \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={OPENAI_API_KEY=$OPENAI_API_KEY}" \
        --region $AWS_REGION > /dev/null
    
    echo "✓ Lambda function created"
fi

# Clean up
rm -rf package lambda_package.zip

# Create or update API Gateway
echo ""
echo "🌐 Setting up API Gateway..."

# Check if API already exists
API_ID=$(aws apigatewayv2 get-apis --region $AWS_REGION --query "Items[?Name=='$API_GATEWAY_NAME'].ApiId" --output text)

if [ -z "$API_ID" ]; then
    echo "Creating new API Gateway..."
    
    # Create HTTP API
    API_ID=$(aws apigatewayv2 create-api \
        --name $API_GATEWAY_NAME \
        --protocol-type HTTP \
        --cors-configuration AllowOrigins="*",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type" \
        --region $AWS_REGION \
        --query 'ApiId' \
        --output text)
    
    echo "✓ API Gateway created: $API_ID"
else
    echo "✓ API Gateway already exists: $API_ID"
fi

# Get account ID and create Lambda ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:${LAMBDA_FUNCTION_NAME}"

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $LAMBDA_ARN \
    --payload-format-version 2.0 \
    --region $AWS_REGION \
    --query 'IntegrationId' \
    --output text 2>/dev/null || \
    aws apigatewayv2 get-integrations --api-id $API_ID --region $AWS_REGION --query 'Items[0].IntegrationId' --output text)

echo "✓ Integration configured"

# Create route
ROUTE_ID=$(aws apigatewayv2 get-routes --api-id $API_ID --region $AWS_REGION --query "Items[?RouteKey=='POST /atc'].RouteId" --output text)

if [ -z "$ROUTE_ID" ]; then
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key 'POST /atc' \
        --target "integrations/$INTEGRATION_ID" \
        --region $AWS_REGION > /dev/null
    echo "✓ Route created"
else
    echo "✓ Route already exists"
fi

# Create or get stage
STAGE_NAME='$default'
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name '$default' \
    --auto-deploy \
    --region $AWS_REGION 2>/dev/null || echo "✓ Stage already exists"

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region $AWS_REGION 2>/dev/null || echo "✓ Lambda permission already exists"

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $AWS_REGION --query 'ApiEndpoint' --output text)

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Your API Endpoint:"
echo "  ${API_ENDPOINT}/atc"
echo ""
echo "Next steps:"
echo "  1. Copy the API endpoint above"
echo "  2. Edit frontend/config.js"
echo "  3. Paste the endpoint as API_ENDPOINT value"
echo "  4. Run the frontend: cd frontend && python3 -m http.server 8000"
echo ""
echo "To test the API:"
echo "  curl -X POST ${API_ENDPOINT}/atc \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"scenario\":\"pattern_work\",\"message\":\"Tower, Cessna 12345, ready for departure\"}'"
echo ""
