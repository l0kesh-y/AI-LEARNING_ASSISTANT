# AI Learning Assistant

A full-stack AI-powered learning assistant built with React.js, Node.js, Express.js, and MongoDB. Converts PDF documents into interactive study experiences with AI chat, summaries, flashcards, and quizzes using Groq AI APIs.

## Features

### User Authentication
- Secure login & signup with JWT
- User profile management

### PDF Management
- Upload and store PDF documents
- PDF text extraction and chunking for processing large documents
- Embedded PDF viewer

### AI-Powered Features
- **AI Chat**: Ask questions about your documents with context-aware responses
- **Document Summarization**: Generate concise summaries from PDF content
- **Auto-Generated Flashcards**: Create flashcard sets from document content
- **AI Quiz Generator**: Generate custom multiple-choice quizzes

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database for user and application data
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Groq SDK** - AI integration

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **react-pdf** - PDF viewing

## Installation

### Prerequisites
- Node.js (v18 or higher)
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
   PORT=5000
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

6. **Run in Development**
   ```bash
   npm run dev
   ```
   This starts the backend (port 5000) and React frontend (port 3000).

## Production Deployment

### Build for Production
```bash
npm run build-client
```
This creates a production-optimized build in `client/build/`.

### Start Production Server
```bash
npm start
```
The server will serve the built React app from `client/build/` and API on `/api`.

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

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
   - Generate summaries
   - Create flashcards and quizzes automatically

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

#### Flashcards
- `POST /api/flashcards/generate/:documentId` - Generate flashcards
- `GET /api/flashcards` - Get user flashcards

#### Quizzes
- `POST /api/quizzes/generate/:documentId` - Generate quiz
- `GET /api/quizzes` - Get user quizzes
- `POST /api/quizzes/:id/attempt` - Submit quiz attempt

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

## Deployment

### Deploy to Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the build command: `cd client && npm install && npm run build`
4. Set the start command: `npm start`
5. Add environment variables (MONGODB_URI, JWT_SECRET, GROQ_API_KEY, PORT)

### Deploy to Railway
1. Create a new project on Railway
2. Deploy from GitHub
3. Add environment variables
4. MongoDB connection string should use Atlas or similar

### Deploy to Vercel/Netlify (Frontend Only)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `client/build`
4. Add API_URL environment variable pointing to your backend

## Acknowledgments

- Groq for AI capabilities
- MongoDB for database
- React team for the frontend framework
- All contributors and testers