#!/bin/bash

echo "🚀 AI Learning Assistant Deployment Helper"
echo "=========================================="

echo "📋 Pre-deployment checklist:"
echo "✅ Code pushed to GitHub repository"
echo "✅ Groq API key ready"
echo "✅ Render account created"
echo "✅ Netlify account created"
echo ""

echo "🔧 Environment Variables needed:"
echo ""
echo "For Render (Backend):"
echo "- NODE_ENV=production"
echo "- MONGODB_URI=<your-mongodb-atlas-connection-string>"
echo "- JWT_SECRET=<generate-a-secure-random-string>"
echo "- GROQ_API_KEY=<your-groq-api-key>"
echo "- FRONTEND_URL=<your-netlify-url>"
echo ""
echo "For Netlify (Frontend):"
echo "- REACT_APP_API_URL=<your-render-backend-url>/api"
echo ""

echo "📚 Next steps:"
echo "1. Deploy backend to Render first"
echo "2. Note down the Render URL"
echo "3. Deploy frontend to Netlify with the Render URL"
echo "4. Update FRONTEND_URL in Render with Netlify URL"
echo "5. Test the application"
echo ""

echo "📖 See DEPLOYMENT.md for detailed instructions"