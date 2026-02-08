# AWS Amplify Deployment Guide

Step-by-step guide to deploy the Cricket Team app on AWS Amplify.

## Prerequisites

- AWS Account with admin access
- GitHub repository with your code
- AWS CLI installed (optional but helpful)

## Step 1: Create RDS PostgreSQL Database

### Option A: Using AWS Console

1. Go to **AWS RDS Console** → **Create database**
2. Choose:
   - **Engine**: PostgreSQL
   - **Version**: 15.x
   - **Template**: Free tier (for dev) or Production
   - **DB instance identifier**: `cricket-team-db`
   - **Master username**: `postgres`
   - **Master password**: Create a strong password
   - **Instance class**: `db.t3.micro`
   - **Storage**: 20 GB gp2
   - **Public access**: Yes (for initial setup)
   - **VPC security group**: Create new, allow port 5432

3. Wait for the database to be created (~10 minutes)

4. Note your **Endpoint** (e.g., `cricket-team-db.xxxxx.us-east-1.rds.amazonaws.com`)

### Option B: Using CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name cricket-team-rds \
  --template-body file://aws/cloudformation-rds.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123!
```

## Step 2: Initialize Database

After RDS is created, run migrations:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-endpoint:5432/cricket_team"

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

## Step 3: Deploy to Amplify

### Via AWS Console (Recommended for first time)

1. Go to **AWS Amplify Console**

2. Click **"New app"** → **"Host web app"**

3. Select **GitHub** as source provider

4. Authorize AWS Amplify to access your GitHub

5. Select repository: `my-cricket-team`

6. Select branch: `main`

7. **Build settings** - Amplify should auto-detect Next.js:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run db:generate
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

8. **Environment variables** - Add these:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://postgres:pass@your-rds-endpoint:5432/cricket_team` |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `NEXT_PUBLIC_APP_URL` | `https://main.xxxxx.amplifyapp.com` (update after deploy) |

9. Click **"Save and deploy"**

10. Wait for deployment (~5-10 minutes)

### Via Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize in your project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## Step 4: Configure Custom Domain (Optional)

1. In Amplify Console, go to **Domain management**

2. Click **"Add domain"**

3. Enter your domain (e.g., `cricket.yourdomain.com`)

4. Follow instructions to:
   - Verify domain ownership
   - Update DNS records (CNAME or ALIAS)
   - Wait for SSL certificate provisioning

## Step 5: Set Up CI/CD

Amplify automatically sets up CI/CD:

- **Push to main** → Auto-deploys to production
- **Pull requests** → Creates preview environments
- **Branch deploys** → Can set up staging branches

### Branch Configuration

1. Go to **App settings** → **General**
2. Click **"Edit"** on branch settings
3. Configure:
   - Production branch: `main`
   - Development branch: `develop` (creates separate env)

## Monitoring & Logs

### View Logs

1. Amplify Console → Your app → **Hosting environments**
2. Click on the deployment → **Logs**

### CloudWatch Integration

Amplify sends logs to CloudWatch automatically:
- Build logs: `/aws/amplify/your-app-id`
- Access logs: Enable in Amplify settings

## Troubleshooting

### Build Failures

```bash
# Check build logs in Amplify Console
# Common issues:

# 1. Missing environment variables
# Solution: Add all required env vars in Amplify Console

# 2. Node version mismatch
# Solution: Add .nvmrc file with: 18

# 3. Prisma issues
# Solution: Ensure npm run db:generate runs before build
```

### Database Connection Issues

```bash
# 1. Check security group allows Amplify IPs
# 2. Verify DATABASE_URL format
# 3. Test connection locally first

# Test connection
npx prisma db pull
```

### Environment Variables Not Working

```bash
# 1. Ensure no spaces in values
# 2. Redeploy after adding new vars
# 3. Check for NEXT_PUBLIC_ prefix for client-side vars
```

## Cost Optimization Tips

1. **Use Free Tier**: 
   - Amplify: 1000 build minutes/month free
   - RDS: 750 hours/month free (first year)

2. **Stop Unused Resources**:
   ```bash
   # Stop RDS when not in use
   aws rds stop-db-instance --db-instance-identifier cricket-team-db
   ```

3. **Use Spot Instances**: For non-production environments

4. **Enable Auto-scaling**: For production traffic spikes

## Security Best Practices

1. **RDS in Private Subnet**: Don't expose publicly in production
2. **Use Secrets Manager**: For sensitive values
3. **Enable WAF**: Protect against common attacks
4. **Regular Backups**: Enable automated RDS backups
5. **IAM Roles**: Use least-privilege access

## Next Steps

After deployment:

1. ✅ Verify app is running at Amplify URL
2. ✅ Test all features (players, squad selector, etc.)
3. ✅ Set up custom domain
4. ✅ Configure monitoring/alerts
5. ✅ Add team members to Amplify

