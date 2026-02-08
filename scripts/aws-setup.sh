#!/bin/bash

# AWS Setup Script for Cricket Team Management App
# This script helps set up the required AWS resources

set -e

echo "🏏 Cricket Team AWS Setup Script"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not logged in to AWS.${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}✓ AWS Account: $ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Region: $REGION${NC}"
echo ""

# Get user input
read -p "Environment (dev/staging/prod) [dev]: " ENV
ENV=${ENV:-dev}

read -sp "Database password (min 8 chars): " DB_PASSWORD
echo ""

if [ ${#DB_PASSWORD} -lt 8 ]; then
    echo -e "${RED}Error: Password must be at least 8 characters${NC}"
    exit 1
fi

echo ""
echo "📦 Setting up AWS resources..."
echo ""

# 1. Create RDS PostgreSQL
echo "1. Creating RDS PostgreSQL database..."
aws cloudformation create-stack \
    --stack-name cricket-team-rds-$ENV \
    --template-body file://aws/cloudformation-rds.yml \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENV \
        ParameterKey=DBPassword,ParameterValue="$DB_PASSWORD" \
    --region $REGION \
    2>/dev/null || echo "   Stack may already exist, checking..."

echo "   Waiting for RDS to be created (this takes ~10 minutes)..."
aws cloudformation wait stack-create-complete \
    --stack-name cricket-team-rds-$ENV \
    --region $REGION \
    2>/dev/null || true

# Get RDS endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name cricket-team-rds-$ENV \
    --query "Stacks[0].Outputs[?OutputKey=='DBEndpoint'].OutputValue" \
    --output text \
    --region $REGION)

echo -e "${GREEN}   ✓ RDS Endpoint: $DB_ENDPOINT${NC}"

# 2. Create S3 bucket for media
BUCKET_NAME="cricket-team-media-$ACCOUNT_ID"
echo ""
echo "2. Creating S3 bucket for media..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "   Bucket may already exist"
echo -e "${GREEN}   ✓ S3 Bucket: $BUCKET_NAME${NC}"

# 3. Store secrets
echo ""
echo "3. Storing secrets in AWS Secrets Manager..."

DATABASE_URL="postgresql://postgres:$DB_PASSWORD@$DB_ENDPOINT:5432/cricket_team"

aws secretsmanager create-secret \
    --name cricket-team/$ENV/database-url \
    --secret-string "$DATABASE_URL" \
    --region $REGION \
    2>/dev/null || aws secretsmanager update-secret \
        --secret-id cricket-team/$ENV/database-url \
        --secret-string "$DATABASE_URL" \
        --region $REGION

echo -e "${GREEN}   ✓ Database URL stored in Secrets Manager${NC}"

# 4. Create .env file
echo ""
echo "4. Creating .env.local file..."
cat > .env.local << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# AWS
AWS_S3_BUCKET=$BUCKET_NAME
AWS_S3_REGION=$REGION

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your Anthropic API key here
ANTHROPIC_API_KEY=your-api-key-here
EOF

echo -e "${GREEN}   ✓ .env.local created${NC}"

# Summary
echo ""
echo "================================="
echo -e "${GREEN}✅ AWS Setup Complete!${NC}"
echo "================================="
echo ""
echo "Resources created:"
echo "  • RDS PostgreSQL: cricket-team-db-$ENV"
echo "  • S3 Bucket: $BUCKET_NAME"
echo "  • Secrets Manager: cricket-team/$ENV/database-url"
echo ""
echo "Next steps:"
echo "  1. Add your ANTHROPIC_API_KEY to .env.local"
echo "  2. Run: npm run db:push"
echo "  3. Run: npm run db:seed"
echo "  4. Run: npm run dev"
echo ""
echo "For Amplify deployment:"
echo "  1. Push code to GitHub"
echo "  2. Go to AWS Amplify Console"
echo "  3. Connect your repository"
echo "  4. Add environment variables from .env.local"
echo "  5. Deploy!"
echo ""
echo -e "${YELLOW}⚠️  Remember to add your Anthropic API key!${NC}"

