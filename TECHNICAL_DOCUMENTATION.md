# AI Learning Assistant - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Authentication & Security](#authentication--security)
6. [AI Integration](#ai-integration)
7. [Frontend Architecture](#frontend-architecture)
8. [Deployment](#deployment)
9. [Development Guide](#development-guide)

---

## 1. System Architecture

### Overview
AI Learning Assistant follows a three-tier architecture pattern:

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  - UI Components│
│  - State Mgmt   │
└────────┬────────┘
         │ REST API (HTTP/JSON)
         │
┌────────┴────────┐
│  Express.js API │ (Port 5000)
│  - Routes       │
│  - Controllers  │
│  - Middleware   │
└────────┬────────┘
         │ Mongoose ODM
         │
┌────────┴────────┐     ┌──────────────┐
│    MongoDB      │     │   Groq AI    │
│  - Documents    │     │  - LLaMA 3.1 │
│  - Collections  │     │  - Chat API  │
└─────────────────┘     └──────────────┘
```

### Key Components

#### Backend (Node.js + Express)
- **Server**: Entry point handling HTTP requests, CORS, static file serving
- **Routes**: Modular route handlers for different features
- **Models**: Mongoose schemas defining data structure
- **Middleware**: Authentication, error handling, file upload processing

#### Frontend (React)
- **Pages**: Main application views (Dashboard, Documents, Flashcards, Quizzes)
- **Components**: Reusable UI components
- **Contexts**: Global state management (Authentication)
- **API Client**: Axios-based HTTP client with interceptors

---

## 2. Technology Stack

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥18.0.0 | Runtime environment |
| Express.js | 4.18.2 | Web framework |
| MongoDB | Latest | Database |
| Mongoose | 7.6.3 | ODM for MongoDB |
| JWT | 9.0.2 | Authentication tokens |
| Groq SDK | 0.3.3 | AI integration |
| Multer | 1.4.5 | File upload handling |
| pdf-parse | 1.1.1 | PDF text extraction |
| bcryptjs | 2.4.3 | Password hashing |
| cors | 2.8.5 | Cross-origin requests |
| dotenv | 16.3.1 | Environment variables |

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI library |
| React Router | 7.11.0 | Client-side routing |
| Axios | 1.13.2 | HTTP client |
| React Bootstrap | 2.10.10 | UI components |
| Bootstrap | 5.3.8 | CSS framework |
| React PDF | 10.2.0 | PDF viewing |
| React Markdown | 10.1.0 | Markdown rendering |
| Heroicons | 2.2.0 | Icon library |

### Development Tools
- **Nodemon**: Auto-restart server on changes
- **Concurrently**: Run multiple npm scripts
- **React Scripts**: Build and dev tooling

---

## 3. Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  avatar: String (default: ''),
  preferences: {
    theme: String (enum: ['light', 'dark'], default: 'light'),
    language: String (default: 'en')
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**: email (unique)
**Methods**: 
- `comparePassword(candidatePassword)`: Compare hashed password
- Pre-save hook: Hash password before storing

### Document Collection
```javascript
{
  _id: ObjectId,
  title: String (required, trimmed),
  filename: String (required),
  originalName: String (required),
  filePath: String (required),
  fileSize: Number (required),
  mimeType: String (required),
  content: String (required), // Extracted text from PDF
  pdfData: String, // Base64 encoded PDF
  summary: String, // AI-generated summary
  user: ObjectId (ref: User, required),
  tags: [String],
  isFavorite: Boolean (default: false),
  pageCount: Number (default: 0),
  processingStatus: String (enum: ['processing', 'completed', 'failed']),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**: 
- Compound text index: (title, content, tags)
- User index for query performance

### Flashcard Collection
```javascript
{
  _id: ObjectId,
  question: String (required, trimmed),
  answer: String (required, trimmed),
  document: ObjectId (ref: Document, required),
  user: ObjectId (ref: User, required),
  difficulty: String (enum: ['easy', 'medium', 'hard'], default: 'medium'),
  category: String (default: 'General'),
  isFavorite: Boolean (default: false),
  reviewCount: Number (default: 0),
  correctCount: Number (default: 0),
  lastReviewed: Date (nullable),
  nextReview: Date (default: now),
  tags: [String],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Virtual Fields**:
- `successRate`: Calculated as (correctCount / reviewCount) * 100

**Spaced Repetition Algorithm**:
- Correct answer: Next review = current + (correctCount * 2) days (max 30 days)
- Incorrect answer: Next review = current + 1 day

### Quiz Collection
```javascript
{
  _id: ObjectId,
  title: String (required, trimmed),
  document: ObjectId (ref: Document, required),
  user: ObjectId (ref: User, required),
  questions: [{
    question: String (required),
    options: [String] (required, 4 options),
    correctAnswer: Number (required, 0-3 index),
    explanation: String,
    difficulty: String (enum: ['easy', 'medium', 'hard'])
  }],
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  timeLimit: Number (minutes, default: 30),
  category: String (default: 'General'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### QuizAttempt Collection
```javascript
{
  _id: ObjectId,
  quiz: ObjectId (ref: Quiz, required),
  user: ObjectId (ref: User, required),
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number (seconds)
  }],
  score: Number (required, 0-100),
  totalQuestions: Number (required),
  correctAnswers: Number (required),
  timeSpent: Number (seconds, required),
  completedAt: Date (default: now),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Virtual Fields**:
- `percentage`: Calculated as (correctAnswers / totalQuestions) * 100

### ChatHistory Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required),
  document: ObjectId (ref: Document, required),
  title: String (auto-generated from first message),
  messages: [{
    role: String (enum: ['user', 'assistant']),
    content: String,
    timestamp: Date (default: now)
  }],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 4. API Reference

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (201 Created):
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "preferences": {
      "theme": "light",
      "language": "en"
    }
  }
}
```

#### POST /auth/login
Authenticate existing user.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "preferences": {
      "theme": "light",
      "language": "en"
    }
  }
}
```

#### GET /auth/me
Get current authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "",
  "preferences": {
    "theme": "light",
    "language": "en"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### PUT /auth/profile
Update user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

**Response** (200 OK): Updated user object

---

### Document Endpoints

#### POST /documents/upload
Upload and process a PDF document.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `pdf`: File (PDF, max 50MB)
- `title`: String (optional)
- `tags`: String (comma-separated, optional)

**Response** (201 Created):
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Machine Learning Basics",
    "originalName": "ml-basics.pdf",
    "fileSize": 2048576,
    "pageCount": 45,
    "tags": ["machine-learning", "ai"],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /documents
Get all user documents with pagination and filtering.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Number (default: 1)
- `limit`: Number (default: 10)
- `search`: String (full-text search)
- `tags`: String (comma-separated)

**Response** (200 OK):
```json
{
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Machine Learning Basics",
      "originalName": "ml-basics.pdf",
      "fileSize": 2048576,
      "pageCount": 45,
      "tags": ["machine-learning", "ai"],
      "isFavorite": false,
      "processingStatus": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 42
}
```

#### GET /documents/:id
Get single document with full content.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Full document object including content and pdfData

#### PUT /documents/:id
Update document metadata.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "Updated Title",
  "tags": "tag1,tag2,tag3",
  "isFavorite": true
}
```

**Response** (200 OK): Updated document object

#### DELETE /documents/:id
Delete a document.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "message": "Document deleted successfully"
}
```

#### GET /documents/:id/file
Serve PDF file for viewing.

**Headers**: `Authorization: Bearer <token>` OR Query param: `?token=<token>`

**Response**: PDF file stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="document.pdf"`

---

### AI Endpoints

#### POST /ai/chat/:documentId
Chat with AI about a document.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "message": "What are the main concepts in this document?",
  "chatId": "507f1f77bcf86cd799439011" // optional, for continuing conversation
}
```

**Response** (200 OK):
```json
{
  "response": "The main concepts covered in this document are...",
  "chatId": "507f1f77bcf86cd799439011"
}
```

**AI Model**: LLaMA 3.1 8B Instant
**Context Window**: Last 10 messages + document content (8000 chars)
**Temperature**: 0.7
**Max Tokens**: 1000

#### POST /ai/summarize/:documentId
Generate document summary.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "summary": "This document provides a comprehensive overview of..."
}
```

**AI Model**: LLaMA 3.1 8B Instant
**Temperature**: 0.3 (more deterministic)
**Max Tokens**: 1500

#### POST /ai/explain/:documentId
Get explanation of a concept from the document.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "concept": "neural networks"
}
```

**Response** (200 OK):
```json
{
  "explanation": "Neural networks, as described in this document, are..."
}
```

**AI Model**: LLaMA 3.1 8B Instant
**Temperature**: 0.5
**Max Tokens**: 1200

#### GET /ai/chat-history/:documentId
Get all chat histories for a document.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Array of ChatHistory objects

#### GET /ai/chat/:chatId
Get specific chat with messages.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): ChatHistory object with populated document

---

### Flashcard Endpoints

#### POST /flashcards/generate/:documentId
Generate flashcards from document using AI.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "count": 10,
  "difficulty": "medium"
}
```

**Response** (200 OK):
```json
{
  "message": "Flashcards generated successfully",
  "flashcards": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "question": "What is supervised learning?",
      "answer": "A type of machine learning where...",
      "document": "507f1f77bcf86cd799439012",
      "user": "507f1f77bcf86cd799439013",
      "difficulty": "medium",
      "category": "Machine Learning Basics",
      "reviewCount": 0,
      "correctCount": 0,
      "nextReview": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET /flashcards
Get all user flashcards with filtering.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `favorite`: Boolean ('true'/'false')
- `difficulty`: String ('easy'/'medium'/'hard')

**Response** (200 OK): Array of flashcard objects

#### GET /flashcards/document/:documentId
Get flashcards for specific document.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `favorite`: Boolean ('true'/'false')

**Response** (200 OK): Array of flashcard objects with populated document

#### PATCH /flashcards/:id/favorite
Toggle favorite status.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Updated flashcard object

#### POST /flashcards/:id/review
Record flashcard review (spaced repetition).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "correct": true
}
```

**Response** (200 OK): Updated flashcard with new nextReview date

**Spaced Repetition Logic**:
- If correct: nextReview = now + (correctCount * 2) days (max 30 days)
- If incorrect: nextReview = now + 1 day
- reviewCount and correctCount are updated

#### DELETE /flashcards/:id
Delete a flashcard.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "message": "Flashcard deleted successfully"
}
```

---

### Quiz Endpoints

#### POST /quizzes/generate/:documentId
Generate quiz from document using AI.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "questionCount": 5,
  "difficulty": "medium",
  "timeLimit": 30
}
```

**Response** (200 OK):
```json
{
  "message": "Quiz generated successfully",
  "quiz": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Machine Learning Basics - Quiz",
    "document": "507f1f77bcf86cd799439012",
    "questions": [
      {
        "question": "What is the primary goal of supervised learning?",
        "options": [
          "To learn from labeled data",
          "To cluster data",
          "To reduce dimensions",
          "To generate new data"
        ],
        "correctAnswer": 0,
        "explanation": "Supervised learning uses labeled data to train models...",
        "difficulty": "medium"
      }
    ],
    "difficulty": "medium",
    "timeLimit": 30,
    "category": "Machine Learning Basics"
  }
}
```

#### GET /quizzes
Get all user quizzes.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Array of quiz objects with populated document

#### GET /quizzes/document/:documentId
Get quizzes for specific document.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Array of quiz objects

#### GET /quizzes/:id
Get single quiz with all details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Full quiz object with populated document

#### POST /quizzes/:id/attempt
Submit quiz attempt.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "answers": [0, 2, 1, 3, 0],
  "timeSpent": 1200
}
```

**Response** (200 OK):
```json
{
  "message": "Quiz submitted successfully",
  "attempt": {
    "_id": "507f1f77bcf86cd799439014",
    "quiz": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439013",
    "score": 80,
    "totalQuestions": 5,
    "correctAnswers": 4,
    "timeSpent": 1200
  },
  "results": {
    "score": 80,
    "correctAnswers": 4,
    "totalQuestions": 5,
    "percentage": 80,
    "answers": [
      {
        "questionIndex": 0,
        "selectedAnswer": 0,
        "isCorrect": true,
        "question": "What is...",
        "correctAnswer": 0,
        "explanation": "...",
        "options": ["..."]
      }
    ]
  }
}
```

#### GET /quizzes/:id/attempts
Get all attempts for a quiz.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Array of QuizAttempt objects

#### GET /quizzes/attempts/all
Get all user quiz attempts (last 50).

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK): Array of QuizAttempt objects with populated quiz

#### DELETE /quizzes/:id
Delete quiz and all associated attempts.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "message": "Quiz deleted successfully"
}
```

---

### Progress Endpoints

#### GET /progress/dashboard
Get dashboard statistics and recent activity.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "overview": {
    "totalDocuments": 12,
    "totalFlashcards": 145,
    "totalQuizzes": 8,
    "totalQuizAttempts": 23,
    "favoriteFlashcards": 34,
    "averageQuizScore": 78,
    "studyDaysThisMonth": 15
  },
  "recentActivity": {
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Machine Learning Basics",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "fileSize": 2048576
      }
    ],
    "quizAttempts": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "score": 80,
        "quiz": {
          "title": "ML Quiz"
        },
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "chats": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "What is supervised learning?",
        "document": {
          "title": "Machine Learning Basics"
        },
        "updatedAt": "2024-01-15T11:30:00.000Z"
      }
    ]
  }
}
```

#### GET /progress/analytics
Get detailed analytics over time period.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `period`: Number (days, default: 30)

**Response** (200 OK):
```json
{
  "quizPerformance": [
    {
      "_id": "2024-01-15",
      "avgScore": 78.5,
      "totalAttempts": 3
    }
  ],
  "flashcardStats": [
    {
      "_id": "easy",
      "count": 45,
      "avgSuccessRate": 85.3
    },
    {
      "_id": "medium",
      "count": 78,
      "avgSuccessRate": 72.1
    },
    {
      "_id": "hard",
      "count": 22,
      "avgSuccessRate": 58.4
    }
  ],
  "documentActivity": [
    {
      "_id": "2024-01-15",
      "count": 2,
      "totalSize": 4096152
    }
  ],
  "studyTime": [
    {
      "_id": "2024-01-15",
      "sessions": 5,
      "messages": 42
    }
  ]
}
```

#### GET /progress/goals
Get weekly goals and progress.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "documents": {
    "target": 3,
    "current": 2
  },
  "quizzes": {
    "target": 5,
    "current": 4
  },
  "flashcards": {
    "target": 20,
    "current": 18
  },
  "studySessions": {
    "target": 10,
    "current": 7
  }
}
```

---

## 5. Authentication & Security

### JWT Authentication Flow

```
1. User Registration/Login
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT token
   Payload: { userId: string }
   Secret: process.env.JWT_SECRET
   Expiry: 7 days
   ↓
4. Client stores token in localStorage
   ↓
5. Client includes token in requests
   Header: Authorization: Bearer <token>
   ↓
6. Server validates token via middleware
   ↓
7. Request proceeds with req.userId set
```

### Authentication Middleware

**Location**: `/middleware/auth.js`

**Flow**:
1. Extract token from `Authorization` header
2. Verify token using JWT_SECRET
3. Decode userId from token payload
4. Attach userId to request object
5. Call next() or return 401 Unauthorized

**Usage**:
```javascript
router.get('/protected-route', auth, async (req, res) => {
  // req.userId is available here
  const userId = req.userId;
});
```

### Password Security

**Hashing**: bcryptjs with salt rounds = 10
**Implementation**: Pre-save hook in User model

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Validation**:
- Minimum length: 6 characters
- Comparison: `user.comparePassword(candidatePassword)`

### Frontend Security

**Axios Interceptors**:

**Request Interceptor**:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor**:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### File Upload Security

**Multer Configuration**:
- File type validation: PDF only
- File size limit: 50MB
- Filename sanitization: Timestamp + random suffix
- Storage location: `uploads/documents/`

**Validation**:
```javascript
fileFilter: function (req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
}
```

### CORS Configuration

**Development**: Allow all origins
**Production**: Should be configured to specific domain

```javascript
app.use(cors());
```

### Environment Variables

**Required**:
- `JWT_SECRET`: Secret key for JWT signing
- `GROQ_API_KEY`: API key for Groq AI
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

**Security Best Practices**:
- Never commit `.env` to version control
- Use strong, random JWT_SECRET in production
- Rotate API keys periodically
- Use MongoDB Atlas with authentication in production

---

## 6. AI Integration

### Groq AI Configuration

**Provider**: Groq
**Model**: LLaMA 3.1 8B Instant
**SDK**: groq-sdk v0.3.3

**Initialization**:
```javascript
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
```

### AI Features Implementation

#### 1. Document Chat

**Model Parameters**:
- Temperature: 0.7 (balanced creativity/accuracy)
- Max Tokens: 1000
- Context: Last 10 messages + 8000 chars of document

**System Prompt**:
```
You are an AI learning assistant. Help the user understand and learn 
from their document. Be concise, accurate, and educational. Always 
base your responses on the provided document content.

Document Context:
Title: [document.title]
Content: [document.content]
```

**Conversation Management**:
- Stores conversation in ChatHistory collection
- Maintains message history for context
- Auto-generates chat title from first message

#### 2. Document Summarization

**Model Parameters**:
- Temperature: 0.3 (more deterministic)
- Max Tokens: 1500

**System Prompt**:
```
You are an AI assistant that creates concise, informative summaries 
of academic documents. Focus on key concepts, main arguments, and 
important details.
```

**Optimization**:
- Summary cached in Document.summary field
- Only generated once per document
- Subsequent requests return cached summary

#### 3. Concept Explanation

**Model Parameters**:
- Temperature: 0.5 (balanced)
- Max Tokens: 1200
- Context: 6000 chars of document

**System Prompt**:
```
You are an AI tutor that explains concepts clearly and thoroughly. 
Use the provided document as your primary source and explain concepts 
in an educational, easy-to-understand manner.
```

#### 4. Flashcard Generation

**Model Parameters**:
- Temperature: 0.7
- Max Tokens: 2000
- Context: 6000 chars of document

**Expected Output Format**:
```json
[
  {
    "question": "What is...",
    "answer": "..."
  }
]
```

**Prompt Structure**:
```
Generate [count] flashcards with questions and answers based on the 
document content. Format your response as a JSON array with objects 
containing "question" and "answer" fields. Make questions clear and 
answers concise but complete. Difficulty level: [difficulty].
```

**Processing**:
1. AI generates JSON array
2. Extract JSON using regex: `/\[[\s\S]*\]/`
3. Parse JSON
4. Create Flashcard documents in batch
5. Associate with document and user

#### 5. Quiz Generation

**Model Parameters**:
- Temperature: 0.7
- Max Tokens: 3000
- Context: 6000 chars of document

**Expected Output Format**:
```json
[
  {
    "question": "What is...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "...",
    "difficulty": "medium"
  }
]
```

**Prompt Structure**:
```
Generate [questionCount] questions with 4 options each, where only 
one option is correct. Include explanations for correct answers. 
Format as JSON array with objects containing: "question", "options" 
(array of 4 strings), "correctAnswer" (0-3 index), "explanation", 
"difficulty". Difficulty: [difficulty].
```

### Error Handling

**AI Response Errors**:
- JSON parsing failures: Return error message
- Empty responses: Return default "Could not generate" message
- API errors: Log and return 500 error

**Rate Limiting Considerations**:
- Groq free tier limits apply
- Consider implementing request queuing
- Cache AI-generated content when possible

### AI Content Quality

**Best Practices**:
- Provide sufficient document context (6000-8000 chars)
- Use appropriate temperature for task type
- Include clear instructions in system prompts
- Validate and sanitize AI responses
- Store generated content for reuse

---

## 7. Frontend Architecture

### Project Structure

```
client/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Layout/
│   ├── config/
│   │   └── api.js           # Axios configuration
│   ├── contexts/
│   │   └── AuthContext.js   # Authentication state
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── Dashboard/
│   │   │   └── Dashboard.js
│   │   ├── Documents/
│   │   │   ├── Documents.js
│   │   │   └── DocumentViewer.js
│   │   ├── Flashcards/
│   │   │   └── Flashcards.js
│   │   ├── Progress/
│   │   │   └── Progress.js
│   │   └── Quizzes/
│   │       ├── Quizzes.js
│   │       └── QuizTaker.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

### Authentication Context

**Location**: `/contexts/AuthContext.js`

**Provides**:
- `user`: Current user object
- `token`: JWT token
- `loading`: Authentication loading state
- `login(email, password)`: Login function
- `register(name, email, password)`: Register function
- `logout()`: Logout function
- `updateUser(userData)`: Update user profile

**Usage**:
```javascript
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, login, logout } = useAuth();
  
  if (!user) return <Login />;
  
  return <Dashboard />;
}
```

### API Client Configuration

**Location**: `/config/api.js`

**Base Configuration**:
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Features**:
- Automatic token injection
- Automatic 401 handling (redirect to login)
- Request/response interceptors

**Usage**:
```javascript
import api from '../config/api';

// GET request
const response = await api.get('/documents');

// POST request
const response = await api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Routing

**Main Routes**:
```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected Routes */}
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
  <Route path="/documents/:id" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
  <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
  <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
  <Route path="/quizzes/:id" element={<ProtectedRoute><QuizTaker /></ProtectedRoute>} />
  <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
</Routes>
```

### Key Components

#### 1. Dashboard
**Purpose**: Overview of user activity and statistics
**Features**:
- Total counts (documents, flashcards, quizzes)
- Recent activity feed
- Quick action buttons
- Progress widgets

#### 2. Documents
**Purpose**: Manage PDF documents
**Features**:
- Document list with search/filter
- Upload new PDFs
- View document details
- Tag management
- Delete documents

#### 3. DocumentViewer
**Purpose**: View and interact with PDFs
**Features**:
- Embedded PDF viewer (react-pdf)
- AI chat interface
- Generate summary
- Create flashcards/quizzes
- Explain concepts

**Dependencies**:
- `react-pdf`: PDF rendering
- `pdfjs-dist`: PDF.js worker

#### 4. Flashcards
**Purpose**: Study with flashcard system
**Features**:
- Flip card animation
- Spaced repetition tracking
- Favorite system
- Filter by difficulty
- Review tracking (correct/incorrect)

**State Management**:
```javascript
const [currentCard, setCurrentCard] = useState(0);
const [isFlipped, setIsFlipped] = useState(false);
const [cards, setCards] = useState([]);
```

#### 5. Quizzes
**Purpose**: Take and review quizzes
**Features**:
- Quiz list with attempts
- Take quiz (QuizTaker)
- Timer functionality
- Score calculation
- Review answers with explanations

**QuizTaker State**:
```javascript
const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswers, setSelectedAnswers] = useState([]);
const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60);
const [quizSubmitted, setQuizSubmitted] = useState(false);
```

#### 6. Progress
**Purpose**: Analytics and progress tracking
**Features**:
- Performance charts
- Study statistics
- Weekly goals
- Activity timeline
- Flashcard success rates

### Styling

**Framework**: Bootstrap 5.3.8 + React Bootstrap
**Custom CSS**: App.css, index.css
**Icons**: Heroicons React

**Theme Support**:
- Light/Dark theme toggle
- User preference stored in database
- CSS variables for theming

### State Management

**Approach**: React Context + Local State
**Global State**: Authentication (AuthContext)
**Local State**: Component-specific data

**No Redux/Zustand**: Current complexity doesn't require additional state management

### Performance Considerations

**Code Splitting**:
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
```

**Memoization**:
```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

**Debouncing** (for search):
```javascript
const debouncedSearch = useCallback(
  debounce((query) => searchDocuments(query), 500),
  []
);
```

---

## 8. Deployment

### Environment Setup

#### Backend Environment Variables
```env
# Production .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-production-key-change-this
GROQ_API_KEY=gsk_your_groq_api_key_here
```

#### Frontend Environment Variables
```env
# Production client/.env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Deployment Options

#### Option 1: Render.com (Recommended)

**Backend (Web Service)**:
1. Connect GitHub repository
2. Root directory: `/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables: Set in dashboard
6. Auto-deploy on git push

**Frontend (Static Site)**:
1. Root directory: `/client`
2. Build command: `npm install && npm run build`
3. Publish directory: `build`
4. Environment variables: Set in dashboard
5. Custom domain support

**Database**: MongoDB Atlas
- Free tier: 512MB storage
- Create cluster at cloud.mongodb.com
- Whitelist Render.com IPs or allow all (0.0.0.0/0)

#### Option 2: Netlify (Frontend) + Render (Backend)

**Netlify (Frontend)**:
```toml
# netlify.toml
[build]
  base = "client/"
  command = "npm run build"
  publish = "build/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Render (Backend)**: Same as Option 1

#### Option 3: Heroku

**Procfile**:
```
web: node server.js
```

**Deploy**:
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret
heroku config:set GROQ_API_KEY=gsk_...
git push heroku main
```

**Frontend**: Served from backend in production

#### Option 4: DigitalOcean App Platform

Similar to Render.com with:
- Auto-scaling
- Database hosting
- Domain management
- CI/CD pipeline

#### Option 5: AWS (Advanced)

**Services**:
- **EC2**: Node.js server
- **S3**: Static frontend hosting
- **CloudFront**: CDN
- **DocumentDB**: MongoDB-compatible database
- **Elastic Beanstalk**: Managed deployment

### Production Build

#### Build Frontend:
```bash
cd client
npm run build
```

This creates optimized production build in `client/build/`

#### Backend Serves Frontend:
In production, Express serves the React build:
```javascript
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});
```

### Pre-Deployment Checklist

- [ ] Update JWT_SECRET with strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas with proper authentication
- [ ] Set up CORS for production domain
- [ ] Test all API endpoints in production
- [ ] Verify file upload functionality
- [ ] Test PDF viewing with authentication
- [ ] Configure proper error logging (Sentry, LogRocket)
- [ ] Set up monitoring (Uptime Robot, Pingdom)
- [ ] Configure SSL/TLS certificates
- [ ] Set up backup strategy for MongoDB
- [ ] Implement rate limiting for AI endpoints
- [ ] Test mobile responsiveness
- [ ] Optimize images and assets
- [ ] Enable Gzip compression

### Monitoring & Logging

**Recommended Tools**:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **MongoDB Atlas Monitoring**: Database performance
- **Groq Dashboard**: API usage tracking

**Implementation**:
```javascript
// server.js
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    // Send to error tracking service
    res.status(500).json({ message: 'Internal server error' });
  });
}
```

---

## 9. Development Guide

### Initial Setup

1. **Clone Repository**:
```bash
git clone <repository-url>
cd AI-LEARNING_ASSISTANT
```

2. **Install Dependencies**:
```bash
npm run install-all
```

This installs both backend and frontend dependencies.

3. **Configure Environment**:

Backend `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/ai-learning-assistant
JWT_SECRET=your_jwt_secret_dev
GROQ_API_KEY=gsk_your_groq_api_key
NODE_ENV=development
PORT=5000
```

Frontend `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start MongoDB**:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

5. **Run Development Servers**:
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### NPM Scripts

**Root package.json**:
```json
{
  "dev": "concurrently \"npm run server\" \"npm run client\"",
  "server": "nodemon server.js",
  "client": "cd client && npm start",
  "build-client": "cd client && npm run build",
  "start": "node server.js",
  "install-all": "npm install && cd client && npm install"
}
```

**Usage**:
- `npm run dev`: Start both servers in development mode
- `npm run server`: Start only backend with nodemon
- `npm run client`: Start only frontend
- `npm run build-client`: Build frontend for production
- `npm start`: Start production server
- `npm run install-all`: Install all dependencies

### Development Workflow

1. **Feature Development**:
   - Create feature branch: `git checkout -b feature/your-feature`
   - Make changes
   - Test locally
   - Commit: `git commit -m "Add: feature description"`
   - Push: `git push origin feature/your-feature`
   - Create Pull Request

2. **Backend Development**:
   - Models: Define in `/models`
   - Routes: Create in `/routes`
   - Middleware: Add in `/middleware`
   - Server: Modify `server.js` for new routes

3. **Frontend Development**:
   - Pages: Add in `/client/src/pages`
   - Components: Add in `/client/src/components`
   - Routes: Update in `/client/src/App.js`
   - API calls: Use `/client/src/config/api.js`

### Code Style Guidelines

#### Backend (Node.js)

**File Naming**: camelCase for files, PascalCase for models
```
models/User.js
routes/documents.js
middleware/auth.js
```

**Async/Await**:
```javascript
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.userId });
    res.json(documents);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

**Error Handling**:
```javascript
// Always wrap async routes in try-catch
// Return appropriate status codes
// Log errors for debugging
```

**MongoDB Queries**:
```javascript
// Use lean() for read-only queries
const docs = await Document.find().lean();

// Use select() to limit fields
const docs = await Document.find().select('title createdAt');

// Use populate() for references
const docs = await Document.find().populate('user', 'name email');
```

#### Frontend (React)

**Component Structure**:
```javascript
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

function ComponentName() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

export default ComponentName;
```

**File Naming**: PascalCase for components
```
Login.js
DocumentViewer.js
QuizTaker.js
```

### Testing

#### Manual Testing Checklist

**Authentication**:
- [ ] Register new user
- [ ] Login with credentials
- [ ] Access protected routes
- [ ] Logout functionality
- [ ] Token expiration handling

**Document Management**:
- [ ] Upload PDF (< 50MB)
- [ ] Upload PDF (> 50MB) - should fail
- [ ] View document list
- [ ] Open PDF viewer
- [ ] Search documents
- [ ] Filter by tags
- [ ] Delete document

**AI Features**:
- [ ] Chat with document
- [ ] Generate summary
- [ ] Explain concept
- [ ] Generate flashcards
- [ ] Generate quiz

**Flashcards**:
- [ ] View flashcards
- [ ] Flip card animation
- [ ] Mark as correct/incorrect
- [ ] Toggle favorite
- [ ] Filter by difficulty
- [ ] Verify spaced repetition

**Quizzes**:
- [ ] Take quiz
- [ ] Timer functionality
- [ ] Submit answers
- [ ] View results
- [ ] Review explanations
- [ ] View attempt history

**Progress**:
- [ ] Dashboard statistics
- [ ] Analytics charts
- [ ] Weekly goals
- [ ] Recent activity

#### API Testing with Postman/curl

**Register User**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Upload Document**:
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@/path/to/file.pdf" \
  -F "title=Test Document" \
  -F "tags=test,sample"
```

**Get Documents**:
```bash
curl http://localhost:5000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Debugging

#### Backend Debugging

**Console Logging**:
```javascript
console.log('User ID:', req.userId);
console.log('Request body:', req.body);
console.error('Error:', error);
```

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server.js",
      "restart": true,
      "runtimeExecutable": "nodemon",
      "console": "integratedTerminal"
    }
  ]
}
```

**MongoDB Debugging**:
```javascript
// Enable Mongoose debug mode
mongoose.set('debug', true);

// Check connection status
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
```

#### Frontend Debugging

**React DevTools**: Install Chrome/Firefox extension

**Console Logging**:
```javascript
console.log('State:', state);
console.log('Props:', props);
console.log('API Response:', response);
```

**Network Tab**: Monitor API requests and responses

**Redux DevTools** (if implemented): Time-travel debugging

### Common Issues & Solutions

#### Issue 1: MongoDB Connection Failed
**Error**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /path/to/db
```

#### Issue 2: CORS Errors
**Error**: `Access to fetch at 'http://localhost:5000/api/...' blocked by CORS policy`

**Solution**: Verify CORS configuration in `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

#### Issue 3: PDF Not Displaying
**Error**: PDF viewer shows blank or error

**Solution**:
- Verify token is included in request
- Check PDF data is properly stored in database
- Verify Content-Type header is set to `application/pdf`
- Check browser console for errors

#### Issue 4: AI Responses Failing
**Error**: `Error generating [feature]`

**Solution**:
- Verify GROQ_API_KEY is set correctly
- Check API key is valid at console.groq.com
- Verify internet connection
- Check Groq API status
- Review API rate limits

#### Issue 5: File Upload Failing
**Error**: `No file uploaded` or `Only PDF files are allowed`

**Solution**:
- Verify Content-Type is `multipart/form-data`
- Check file size is under 50MB
- Verify file is PDF format
- Check `uploads/documents` directory exists and is writable

### Performance Optimization

#### Backend Optimization

**Database Indexes**:
```javascript
// Add indexes to frequently queried fields
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text' });
```

**Query Optimization**:
```javascript
// Use lean() for read-only queries
const docs = await Document.find().lean();

// Limit fields returned
const docs = await Document.find().select('title createdAt');

// Use pagination
const docs = await Document.find()
  .limit(10)
  .skip((page - 1) * 10);
```

**Caching**:
```javascript
// Cache AI-generated summaries
if (document.summary) {
  return res.json({ summary: document.summary });
}
```

#### Frontend Optimization

**Code Splitting**:
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

**Memoization**:
```javascript
const MemoizedComponent = React.memo(ExpensiveComponent);

const memoizedValue = useMemo(() => {
  return expensiveOperation(data);
}, [data]);
```

**Image Optimization**:
- Compress images before upload
- Use appropriate image formats (WebP, AVIF)
- Lazy load images below fold

### Git Workflow

**Branch Naming**:
- `feature/feature-name`: New features
- `bugfix/issue-description`: Bug fixes
- `hotfix/critical-fix`: Production hotfixes
- `refactor/component-name`: Code refactoring

**Commit Messages**:
```
Add: New feature
Fix: Bug fix
Update: Changes to existing feature
Remove: Removed feature
Refactor: Code refactoring
Docs: Documentation changes
Style: Code style changes
Test: Test additions/changes
```

**Example**:
```bash
git checkout -b feature/quiz-timer
# Make changes
git add .
git commit -m "Add: Timer functionality for quizzes"
git push origin feature/quiz-timer
```

### Resources

**Documentation**:
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Groq API Docs](https://console.groq.com/docs)

**Learning Resources**:
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Patterns](https://reactpatterns.com/)
- [MongoDB University](https://university.mongodb.com/)

**Community**:
- Stack Overflow
- GitHub Issues
- Discord/Slack communities

---

## Appendix

### API Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Database errors, AI API failures, unexpected errors |

### Database Indexes

```javascript
// User
userSchema.index({ email: 1 }, { unique: true });

// Document
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Flashcard
flashcardSchema.index({ user: 1, document: 1 });
flashcardSchema.index({ nextReview: 1 });

// Quiz
quizSchema.index({ user: 1, document: 1 });

// QuizAttempt
quizAttemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });

// ChatHistory
chatHistorySchema.index({ user: 1, document: 1, updatedAt: -1 });
```

### Environment Variables Reference

```env
# Server
NODE_ENV=development|production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ai-learning-assistant

# Authentication
JWT_SECRET=your-secret-key-here

# AI Integration
GROQ_API_KEY=gsk_your_api_key_here

# Frontend (client/.env)
REACT_APP_API_URL=http://localhost:5000/api
```

### File Size Limits

- **PDF Upload**: 50MB maximum
- **JSON Request Body**: 50MB maximum
- **URL Encoded Body**: 50MB maximum

### Groq API Models

- **Model**: `llama-3.1-8b-instant`
- **Context Length**: 8,192 tokens
- **Max Output**: Varies by endpoint (1000-3000 tokens)
- **Rate Limits**: Check Groq console for current limits

---

**Document Version**: 1.0
**Last Updated**: June 2026
**Maintained By**: Development Team

For questions or contributions, please open an issue on GitHub or contact the development team.
