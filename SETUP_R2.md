# Cloudflare R2 Storage Setup Guide

Follow these steps to configure your free 10GB cloud storage.

## 1. Create Cloudflare Account & Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left sidebar, click **R2**.
3. Click **Create Bucket**.
4. Give it a name (e.g., `kurlybrains-files`).
5. Click **Create Bucket**.
6. **Important:** In settings, copy the **Bucket Name** and **Account ID** (top right of R2 page).

## 2. Generate Credentials (API Keys)
1. On the main **R2** page (not inside the bucket), look for **"Manage R2 API Tokens"** on the right side.
2. Click **Create API Token**.
3. Select **"Admin Read & Write"** (the pencil icon).
4. Click **Create API Token**.
5. **CRITICAL:** Copy the `Access Key ID` and `Secret Access Key` immediately. You won't see them again.

## 3. Public Access (Optional but Recommended)
To allow people to view the uploaded files (images/PDFs):
1. Go into your Bucket (`kurlybrains-files`).
2. Click **Settings** tab.
3. Scroll to **R2.dev Subdomain**.
4. Click **Allow Access**.
5. Copy the "Public R2.dev Bucket URL" (e.g., `https://pub-xyz.r2.dev`).

## 4. Configure Your Project
Open your `.env` file (create one if needed) and add these values:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET_NAME=kurlybrains-files
R2_PUBLIC_URL=https://pub-xyz.r2.dev  # Or leave empty if private
```

## 5. Deploying to Vercel
When deploying, go to your Vercel Project Settings -> **Environment Variables** and add all 5 variables there as well.
