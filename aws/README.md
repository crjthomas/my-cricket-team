# AWS Deployment Guide

This guide covers deploying the Cricket Team Management app on AWS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │   Route 53  │────▶│  CloudFront │────▶│   Amplify   │  │
│   │   (Domain)  │     │    (CDN)    │     │  (Next.js)  │  │
│   └─────────────┘     └─────────────┘     └──────┬──────┘  │
│                                                   │         │
│                                                   ▼         │
│                                           ┌─────────────┐  │
│                                           │     RDS     │  │
│                                           │ (PostgreSQL)│  │
│                                           └─────────────┘  │
│                                                             │
│   ┌─────────────┐     ┌─────────────┐                      │
│   │   Secrets   │     │     S3      │                      │
│   │   Manager   │     │   (Media)   │                      │
│   └─────────────┘     └─────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Options

### Option 1: AWS Amplify (Recommended - Easiest)
- Automatic CI/CD from GitHub
- Managed SSL certificates
- Built-in preview environments
- [See amplify-setup.md](./amplify-setup.md)

### Option 2: AWS App Runner
- Container-based deployment
- Auto-scaling
- Good for production workloads
- [See apprunner-setup.md](./apprunner-setup.md)

### Option 3: ECS Fargate
- Full container orchestration
- Maximum control
- Best for enterprise deployments

## Quick Start with Amplify

### 1. Set Up RDS PostgreSQL

```bash
# Create RDS instance (or use AWS Console)
aws rds create-db-instance \
  --db-instance-identifier cricket-team-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --publicly-accessible \
  --vpc-security-group-ids YOUR_SECURITY_GROUP
```

### 2. Store Secrets

```bash
# Store database URL
aws secretsmanager create-secret \
  --name cricket-team/database-url \
  --secret-string "postgresql://postgres:PASSWORD@your-rds-endpoint:5432/cricket_team"

# Store Anthropic API key
aws secretsmanager create-secret \
  --name cricket-team/anthropic-api-key \
  --secret-string "your-anthropic-api-key"
```

### 3. Deploy with Amplify

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Select the `my-cricket-team` repo and branch
5. Configure build settings (use amplify.yml in this repo)
6. Add environment variables
7. Deploy!

## Environment Variables

Set these in Amplify Console or your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://cricket.example.com` |

## Cost Estimate (Monthly)

| Service | Tier | Est. Cost |
|---------|------|-----------|
| Amplify Hosting | Free tier + usage | $0-5 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| S3 (Media) | First 5GB free | $0-2 |
| CloudFront | First 1TB free | $0 |
| Secrets Manager | Per secret | ~$1 |
| **Total** | | **~$20/month** |

## Security Recommendations

1. **RDS**: Use private subnets with VPC
2. **Secrets**: Never commit credentials to git
3. **IAM**: Use least-privilege policies
4. **WAF**: Enable AWS WAF for production
5. **Backups**: Enable automated RDS backups

