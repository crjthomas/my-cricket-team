# S3 Setup for Media Storage

Store photos and videos in Amazon S3 for reliable media management.

## Step 1: Create S3 Bucket

### Via AWS Console

1. Go to **S3 Console** → **Create bucket**
2. Configure:
   - **Bucket name**: `cricket-team-media-{your-account-id}` (must be globally unique)
   - **Region**: Same as your app (e.g., us-east-1)
   - **Object Ownership**: ACLs disabled
   - **Block Public Access**: Uncheck for public media OR use CloudFront

3. Click **Create bucket**

### Via AWS CLI

```bash
# Create bucket
aws s3 mb s3://cricket-team-media-YOUR_ACCOUNT_ID --region us-east-1

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket cricket-team-media-YOUR_ACCOUNT_ID \
  --versioning-configuration Status=Enabled
```

## Step 2: Configure CORS

Add CORS configuration for browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-app.amplifyapp.com",
      "https://cricket.yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply via CLI:
```bash
aws s3api put-bucket-cors \
  --bucket cricket-team-media-YOUR_ACCOUNT_ID \
  --cors-configuration file://cors.json
```

## Step 3: Set Up CloudFront (Recommended)

For faster media delivery with caching:

1. Go to **CloudFront Console** → **Create distribution**
2. Configure:
   - **Origin domain**: Your S3 bucket
   - **Origin access**: Origin access control (OAC)
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Cache policy**: CachingOptimized
   - **Price class**: Use only North America and Europe (cheaper)

3. Update S3 bucket policy to allow CloudFront access

## Step 4: IAM Policy for App

Create an IAM user/role for your app with S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cricket-team-media-YOUR_ACCOUNT_ID",
        "arn:aws:s3:::cricket-team-media-YOUR_ACCOUNT_ID/*"
      ]
    }
  ]
}
```

## Step 5: Environment Variables

Add to your `.env` or Amplify environment:

```bash
AWS_S3_BUCKET=cricket-team-media-YOUR_ACCOUNT_ID
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key  # Or use IAM roles
AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_URL=https://dxxxxx.cloudfront.net  # If using CloudFront
```

## Step 6: Update App Code

Install AWS SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Example upload utility:

```typescript
// src/lib/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )
  
  // Return CloudFront URL if available, otherwise S3 URL
  if (CLOUDFRONT_URL) {
    return `${CLOUDFRONT_URL}/${key}`
  }
  return `https://${BUCKET}.s3.amazonaws.com/${key}`
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3Client, command, { expiresIn })
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(s3Client, command, { expiresIn })
}
```

## Folder Structure in S3

Organize media by type and match:

```
cricket-team-media/
├── photos/
│   ├── matches/
│   │   ├── 2026-01-25-vs-city-lions/
│   │   │   ├── team-photo.jpg
│   │   │   └── celebration.jpg
│   │   └── 2026-02-08-vs-thunder-hawks/
│   ├── training/
│   └── profiles/
├── videos/
│   ├── highlights/
│   └── training/
└── documents/
```

## Cost Optimization

1. **Lifecycle Rules**: Move old media to S3 Glacier
   ```bash
   aws s3api put-bucket-lifecycle-configuration \
     --bucket cricket-team-media-YOUR_ACCOUNT_ID \
     --lifecycle-configuration file://lifecycle.json
   ```

2. **Intelligent Tiering**: Automatically moves infrequently accessed files

3. **Compression**: Compress images before upload

4. **CloudFront Caching**: Reduces S3 requests

## Security Best Practices

1. **No public bucket**: Use pre-signed URLs or CloudFront
2. **Encryption**: Enable server-side encryption (SSE-S3)
3. **Logging**: Enable S3 access logging
4. **Versioning**: Enable for accidental deletion protection
5. **MFA Delete**: Enable for production buckets

