# 🚀 Quick Deployment Guide

Deploy your AI Learning Assistant in minutes!

## 🎯 Quick Start

### 1. Backend (Render) - 5 minutes

1. **Push to GitHub** (if not already done)
2. **Go to [Render](https://render.com)** → Sign up/Login
3. **New Web Service** → Connect GitHub repo
4. **Settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-key-here
   GROQ_API_KEY=your-groq-api-key
   MONGODB_URI=your-mongodb-atlas-connection-string
   FRONTEND_URL=https://your-app.netlify.app
   ```
6. **Deploy** 🎉

### 2. Database (MongoDB Atlas) - 3 minutes

1. **Go to [MongoDB Atlas](https://mongodb.com/atlas)**
2. **Create free cluster**
3. **Create database user**
4. **Network Access** → Allow all IPs (0.0.0.0/0)
5. **Connect** → Copy connection string
6. **Paste in Render** as `MONGODB_URI`

### 3. Frontend (Netlify) - 3 minutes

1. **Go to [Netlify](https://netlify.com)** → Sign up/Login
2. **New site from Git** → Connect GitHub repo
3. **Settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com/api
   ```
5. **Deploy** 🎉

### 4. Final Step - Connect them

1. **Copy your Netlify URL** (e.g., `https://amazing-app-123.netlify.app`)
2. **Update Render environment variable**:
   - `FRONTEND_URL=https://amazing-app-123.netlify.app`
3. **Redeploy Render service**

## ✅ That's it!

Your app should now be live at:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.onrender.com`

## 🔧 Environment Variables Cheat Sheet

### Render (Backend)
```bash
NODE_ENV=production
JWT_SECRET=make-this-super-secret-and-long
GROQ_API_KEY=gsk_your_groq_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
FRONTEND_URL=https://your-app.netlify.app
```

### Netlify (Frontend)
```bash
REACT_APP_API_URL=https://your-render-app.onrender.com/api
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS errors | Check `FRONTEND_URL` matches Netlify URL exactly |
| Database connection failed | Verify MongoDB Atlas connection string and IP whitelist |
| API calls failing | Check `REACT_APP_API_URL` points to Render backend |
| Build failing | Check build logs, ensure all dependencies are in package.json |

## 💡 Pro Tips

- **Free tier limits**: Render sleeps after 15 min inactivity
- **Custom domains**: Available on both platforms
- **SSL**: Automatic on both platforms
- **Monitoring**: Check logs in both dashboards

## 🔒 Security Notes

- Keep your JWT_SECRET long and random
- Never commit API keys to Git
- Use environment variables for all secrets
- MongoDB Atlas provides automatic backups

---

Need help? Check the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide!