# Deploy to Render - Full Stack

## Step 1: Create MongoDB Atlas Database (Free)

1. Go to https://www.mongodb.com/atlas
2. Sign up / Login
3. Create a FREE cluster (M0 Sandbox)
4. Click "Database Access" → Add Database User
   - Username: `ailearning`
   - Password: (auto-generate and SAVE IT)
5. Click "Network Access" → Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)
6. Click "Database" → "Connect" → "Connect your application"
7. Copy the connection string (looks like: `mongodb+srv://ailearning:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
8. Replace `<password>` with your actual password

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - AI Learning Assistant"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-learning-assistant.git
git push -u origin main
```

## Step 3: Deploy on Render

1. Go to https://render.com → Sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `ai-learning-assistant`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://ailearning:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ai-learning?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `your-super-secret-jwt-key-make-it-long-and-random` |
   | `GROQ_API_KEY` | `your-groq-api-key-here` |

6. Click "Create Web Service"

## Step 4: Wait for Deployment

- Build takes ~5-10 minutes
- Once deployed, your app will be at: `https://ai-learning-assistant.onrender.com`

## Environment Variables Summary

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-learning?retryWrites=true&w=majority
JWT_SECRET=make-this-a-very-long-random-string-for-security
GROQ_API_KEY=gsk_your_groq_api_key_here
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, ensure all dependencies are listed |
| MongoDB connection error | Verify connection string and IP whitelist (0.0.0.0/0) |
| App crashes | Check logs in Render dashboard |
| Slow first load | Free tier sleeps after 15 min inactivity (normal) |

## Notes

- Free tier: App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan ($7/month) for always-on service