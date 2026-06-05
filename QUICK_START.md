# Quick Start Guide

## ✅ Application is Running!

### Access Points
- **Frontend (React App)**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: Connected successfully

### Important Configuration Steps

#### 1. Get Your Groq API Key (Required for AI Features)
1. Visit [Groq Console](https://console.groq.com/)
2. Create a free account
3. Generate an API key
4. Update `.env` file with your key:
   ```
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```
5. Restart the server after updating

#### 2. MongoDB Setup
Currently using: `mongodb://localhost:27017/ai-learning-assistant`

**Option A - Local MongoDB:**
- Make sure MongoDB is installed and running
- Default connection should work

**Option B - MongoDB Atlas (Cloud):**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string
- Update `MONGODB_URI` in `.env` file

### Current Status
✅ Dependencies installed
✅ Environment files created
✅ Backend server running on port 5000
✅ React frontend running on port 3000
✅ MongoDB connected

### Next Steps
1. Open your browser to http://localhost:3000
2. Create an account or login
3. Upload PDF documents
4. Start using AI features (requires Groq API key)

### Stopping the Application
- Press `Ctrl+C` in the terminal to stop both servers

### Features Available
- User authentication (register/login)
- PDF document upload and viewing
- AI chat with documents (needs Groq API key)
- Auto-generated flashcards (needs Groq API key)
- AI quiz generation (needs Groq API key)
- Document summarization (needs Groq API key)
- Progress tracking
- Study analytics

### Troubleshooting
If you encounter issues:
- Check that MongoDB is running
- Verify Groq API key is set correctly
- Ensure ports 3000 and 5000 are not in use
- Check the terminal output for errors
