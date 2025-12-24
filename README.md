# AI Learning Assistant

A full-stack AI-powered learning assistant built with the MERN stack (MongoDB, Express, React, Node.js), styled with Tailwind CSS, and powered by Groq AI. Transform PDFs into interactive study experiences with AI chat, auto-generated flashcards, quizzes, summaries, and progress tracking.

## Features

### 🔐 User Authentication
- Secure login & signup with JWT
- User profile management
- Protected routes

### 📄 PDF Management
- Upload and store PDF documents
- Embedded PDF viewer
- File size tracking and management
- Document tagging and search

### 🤖 AI-Powered Features
- **AI Chat**: Ask questions about your documents with context-aware responses
- **Document Summarization**: Generate concise summaries with one click
- **Concept Explanation**: Get detailed explanations of specific topics
- **Auto-Generated Flashcards**: Create flashcard sets from document content
- **AI Quiz Generator**: Generate custom multiple-choice quizzes

### 📚 Study Tools
- Interactive flashcards with flip animations
- Spaced repetition system
- Favorites system for important cards
- Quiz results and analytics
- Progress tracking dashboard

### 📊 Analytics & Progress
- Study time tracking
- Performance analytics
- Weekly goals and progress
- Recent activity feed

### 🎨 Modern UI
- Responsive design built with Tailwind CSS
- Mobile-friendly interface
- Dark/light theme support
- Smooth animations and transitions

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Groq SDK** - AI integration

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **react-pdf** - PDF viewing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Groq API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-learning-assistant
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-learning-assistant
   JWT_SECRET=your_jwt_secret_key_here
   GROQ_API_KEY=your_groq_api_key_here
   NODE_ENV=development
   ```

   Create a `.env` file in the `client` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Get Groq API Key**
   - Visit [Groq Console](https://console.groq.com/)
   - Create an account and generate an API key
   - Add the key to your `.env` file

5. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas for cloud database

6. **Run the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and React frontend (port 3000).

## Usage

### Getting Started

1. **Register/Login**
   - Create a new account or login with existing credentials
   - Access the dashboard after authentication

2. **Upload Documents**
   - Click "Upload PDF" on the Documents page
   - Drag and drop or browse for PDF files
   - Add title and tags for organization

3. **Study with AI**
   - View documents with the embedded PDF viewer
   - Chat with AI about document content
   - Generate summaries and explanations
   - Create flashcards and quizzes automatically

4. **Track Progress**
   - Monitor your study statistics on the dashboard
   - View detailed analytics on the Progress page
   - Set and track weekly study goals

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Documents
- `POST /api/documents/upload` - Upload PDF
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

#### AI Features
- `POST /api/ai/chat/:documentId` - Chat with AI
- `POST /api/ai/summarize/:documentId` - Generate summary
- `POST /api/ai/explain/:documentId` - Explain concept

#### Flashcards
- `POST /api/flashcards/generate/:documentId` - Generate flashcards
- `GET /api/flashcards` - Get user flashcards
- `POST /api/flashcards/:id/review` - Update review status

#### Quizzes
- `POST /api/quizzes/generate/:documentId` - Generate quiz
- `GET /api/quizzes` - Get user quizzes
- `POST /api/quizzes/:id/attempt` - Submit quiz attempt

#### Progress
- `GET /api/progress/dashboard` - Dashboard statistics
- `GET /api/progress/analytics` - Detailed analytics

## Project Structure

```
ai-learning-assistant/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── ...
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Custom middleware
├── uploads/                # File uploads directory
├── server.js              # Express server
├── package.json           # Backend dependencies
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## Acknowledgments

- Groq for AI capabilities
- MongoDB for database
- React team for the frontend framework
- Tailwind CSS for styling
- All contributors and testers