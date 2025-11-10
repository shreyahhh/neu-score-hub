# Deployment Guide - NeuRazor Score Hub

This guide covers deploying both the **Frontend** (React/Vite) and **Backend** (Node.js/Express) applications.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

- **GitHub Account** - For version control
- **Supabase Account** - For database (PostgreSQL)
- **Deployment Platform** (choose one):
  - **Frontend**: Vercel, Netlify, or GitHub Pages
  - **Backend**: Railway, Render, Heroku, or AWS EC2
- **Google AI Studio Account** (optional) - For Gemini API key (AI scoring)

### Required Tools

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun**
- **Git**
- **Supabase CLI** (optional, for database migrations)

---

## GitHub Setup

### Initial Git Setup (if not already done)

```bash
# Navigate to project directory
cd neu-score-hub-main

# Initialize git repository (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: NeuRazor Score Hub frontend"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Subsequent Updates

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

### Creating a New Branch for Features

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Add feature: your feature description"

# Push branch to GitHub
git push -u origin feature/your-feature-name

# Create Pull Request on GitHub, then merge to main
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Vercel** provides automatic deployments from GitHub with zero configuration.

#### Steps:

1. **Sign up/Login** to [Vercel](https://vercel.com)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following:
     ```
     VITE_API_BASE_URL=https://your-backend-url.com
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     VITE_USER_ID=53f77b43-d71a-4edf-8b80-c70b975264d8
     ```

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be available at `https://your-project.vercel.app`

6. **Custom Domain** (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

#### Automatic Deployments:
- Every push to `main` branch = Production deployment
- Every push to other branches = Preview deployment

---

### Option 2: Netlify

**Netlify** also provides easy GitHub integration.

#### Steps:

1. **Sign up/Login** to [Netlify](https://netlify.com)

2. **Import Project**:
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (leave empty)

4. **Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add the same variables as Vercel (see above)

5. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy

---

### Option 3: GitHub Pages

**GitHub Pages** is free but requires manual build steps.

#### Steps:

1. **Install gh-pages package**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `package.json`**:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch
   - Your site will be at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

**Note**: GitHub Pages serves static files only. For SPA routing, you may need to configure redirects.

---

### Option 4: Manual Deployment (VPS/Server)

If deploying to your own server (AWS EC2, DigitalOcean, etc.):

#### Steps:

1. **Build the application**:
   ```bash
   npm install
   npm run build
   ```

2. **Upload `dist` folder** to your server:
   ```bash
   # Using SCP
   scp -r dist/* user@your-server.com:/var/www/html/
   
   # Or using SFTP/FTP client
   ```

3. **Configure web server** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Set up SSL** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## Backend Deployment

The backend is a **separate Node.js/Express application**. Deploy it to a platform that supports Node.js.

### Option 1: Railway (Recommended)

**Railway** provides easy Node.js deployment with automatic HTTPS.

#### Steps:

1. **Sign up/Login** to [Railway](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your backend repository

3. **Configure Environment Variables**:
   - Go to Variables tab
   - Add:
     ```
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_KEY=your-service-role-key-here
     PORT=3000
     GEMINI_API_KEY=your-gemini-key (optional)
     NODE_ENV=production
     ```

4. **Configure Build Settings**:
   - Railway auto-detects Node.js
   - Ensure `package.json` has a `start` script:
     ```json
     {
       "scripts": {
         "start": "node server.js"
       }
     }
     ```

5. **Deploy**:
   - Railway will automatically deploy on push to main branch
   - Your API will be available at `https://your-project.railway.app`

6. **Update Frontend**:
   - Update `VITE_API_BASE_URL` in frontend to point to Railway URL

---

### Option 2: Render

**Render** provides free tier for Node.js applications.

#### Steps:

1. **Sign up/Login** to [Render](https://render.com)

2. **Create New Web Service**:
   - Click "New" → "Web Service"
   - Connect your backend GitHub repository

3. **Configure Service**:
   - **Name**: Your backend service name
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` or `node server.js`

4. **Environment Variables**:
   - Add the same variables as Railway (see above)

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy

---

### Option 3: Heroku

**Heroku** requires a credit card for free tier, but provides reliable hosting.

#### Steps:

1. **Install Heroku CLI**:
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   heroku create your-app-name
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set SUPABASE_URL=https://your-project-id.supabase.co
   heroku config:set SUPABASE_KEY=your-service-role-key
   heroku config:set PORT=3000
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

---

### Option 4: AWS EC2 / DigitalOcean (Manual)

For full control over your server:

#### Steps:

1. **Launch Server**:
   - Create EC2 instance or DigitalOcean droplet
   - Use Ubuntu 22.04 LTS
   - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (if needed)

2. **SSH into Server**:
   ```bash
   ssh -i your-key.pem ubuntu@your-server-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/backend-repo.git
   cd backend-repo
   npm install
   ```

5. **Create `.env` file**:
   ```bash
   nano .env
   # Add all environment variables
   ```

6. **Install PM2** (Process Manager):
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "neu-score-backend"
   pm2 save
   pm2 startup
   ```

7. **Set up Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name api.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Set up SSL**:
   ```bash
   sudo certbot --nginx -d api.your-domain.com
   ```

---

## Environment Configuration

### Frontend Environment Variables

Create a `.env` file in the frontend root (or set in deployment platform):

```env
# Backend API URL (production)
VITE_API_BASE_URL=https://your-backend-url.com

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Default User ID (if no authentication)
VITE_USER_ID=53f77b43-d71a-4edf-8b80-c70b975264d8
```

**⚠️ Important**: 
- Use `VITE_` prefix for Vite environment variables
- Never commit `.env` files to Git (already in `.gitignore`)
- Use deployment platform's environment variable settings for production

---

### Backend Environment Variables

Create a `.env` file in the backend root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Server Configuration
PORT=3000
NODE_ENV=production

# AI Scoring (Optional)
GEMINI_API_KEY=your-gemini-api-key-here
```

**⚠️ Critical**: 
- `SUPABASE_KEY` must be the **service_role key**, NOT the anon key
- Service role key bypasses RLS and has full database access
- Get it from: Supabase Dashboard → Settings → API → Project API keys → `service_role` key

---

## Database Setup

### Supabase Configuration

1. **Create Supabase Project**:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note your Project URL and API keys

2. **Run Database Migrations**:
   - Go to SQL Editor in Supabase Dashboard
   - Run the SQL scripts to create tables:
     - `scoring_versions`
     - `test_sessions`
     - `action_receipts`
     - `text_receipts`
     - `face_library` (for Face-Name Match game)

3. **Set Up Row Level Security (RLS)**:
   - For backend access, RLS can be disabled or configured to allow service_role
   - Backend uses service_role key, so RLS policies should allow service_role access

4. **Insert Default Scoring Configurations**:
   - Insert V1 configurations for each game type
   - Use the backend API or SQL directly

5. **Populate Face Library** (if using Face-Name Match):
   - Insert face records with `id`, `full_name`, and `image_url`

---

## Post-Deployment Verification

### Frontend Checklist

- [ ] Frontend loads without errors
- [ ] API calls work (check browser console)
- [ ] Games can be started
- [ ] Scores are submitted and displayed
- [ ] Environment variables are set correctly
- [ ] HTTPS is enabled (for production)

### Backend Checklist

- [ ] Backend health check responds: `GET /health`
- [ ] Database connection works
- [ ] API endpoints respond correctly
- [ ] CORS is configured for frontend domain
- [ ] Environment variables are set
- [ ] Logs are accessible

### Integration Test

1. **Start a game** from the frontend
2. **Complete the game** and submit
3. **Verify score** is displayed correctly
4. **Check backend logs** for any errors
5. **Verify database** has new session record

---

## Troubleshooting

### Frontend Issues

#### Build Fails
- **Error**: `Cannot find module`
  - **Fix**: Run `npm install` before building
- **Error**: `Environment variable not found`
  - **Fix**: Ensure all `VITE_` variables are set in deployment platform

#### API Calls Fail
- **Error**: `CORS error` or `Network error`
  - **Fix**: 
    - Check `VITE_API_BASE_URL` is correct
    - Ensure backend CORS allows frontend domain
    - Check backend is running

#### Blank Page After Deployment
- **Fix**: 
  - Check browser console for errors
  - Verify `index.html` is in root of `dist` folder
  - Check routing configuration (SPA redirects)

---

### Backend Issues

#### Database Connection Fails
- **Error**: `Permission denied for table`
  - **Fix**: 
    - Verify `SUPABASE_KEY` is service_role key (not anon)
    - Check RLS policies allow service_role access
    - Verify table names are correct

#### API Returns 500 Errors
- **Fix**:
  - Check backend logs
  - Verify all environment variables are set
  - Check database tables exist
  - Verify API endpoint paths match frontend calls

#### Port Already in Use
- **Fix**: 
  - Change `PORT` in `.env`
  - Or kill process using port: `lsof -ti:3000 | xargs kill`

---

### Common Deployment Issues

#### Environment Variables Not Loading
- **Vercel/Netlify**: Variables must be set in platform settings, not just `.env` file
- **Railway/Render**: Check Variables tab in dashboard
- **Manual**: Ensure `.env` file is in project root

#### CORS Errors
- **Backend**: Add frontend URL to CORS whitelist:
  ```javascript
  app.use(cors({
    origin: ['https://your-frontend.vercel.app', 'http://localhost:8080']
  }));
  ```

#### Build Timeout
- **Fix**: 
  - Optimize build (remove unused dependencies)
  - Increase build timeout in platform settings
  - Use build cache if available

---

## Security Best Practices

1. **Never commit secrets**:
   - `.env` files are in `.gitignore`
   - Use deployment platform's environment variable settings

2. **Use HTTPS**:
   - Always enable SSL/TLS in production
   - Use Let's Encrypt for free certificates

3. **Service Role Key Security**:
   - Only use service_role key in backend
   - Never expose it in frontend code
   - Rotate keys periodically

4. **CORS Configuration**:
   - Only allow specific frontend domains
   - Don't use `origin: '*'` in production

5. **Rate Limiting**:
   - Implement rate limiting on backend API
   - Prevent abuse and DDoS attacks

---

## Continuous Deployment

### Automatic Deployments

Most platforms support automatic deployments:

- **Vercel/Netlify**: Auto-deploy on push to `main` branch
- **Railway/Render**: Auto-deploy on push to connected branch
- **GitHub Actions**: Set up CI/CD pipeline for custom workflows

### Manual Deployment Workflow

1. Make changes locally
2. Test in development
3. Commit and push to GitHub
4. Platform automatically builds and deploys
5. Verify deployment works
6. Monitor logs for errors

---

## Monitoring & Maintenance

### Logs

- **Frontend**: Check browser console and deployment platform logs
- **Backend**: Check platform logs or use PM2 logs (`pm2 logs`)

### Performance

- Monitor API response times
- Check database query performance
- Optimize images and assets
- Use CDN for static assets

### Updates

- Keep dependencies updated: `npm audit` and `npm update`
- Monitor security advisories
- Test updates in staging before production

---

## Support

For issues or questions:

1. Check this deployment guide
2. Review `PROJECT_DOCUMENTATION.md` for technical details
3. Check platform-specific documentation
4. Review error logs for specific issues

---

**Last Updated**: 2025-01-15  
**Project**: NeuRazor Score Hub  
**Version**: 1.0

