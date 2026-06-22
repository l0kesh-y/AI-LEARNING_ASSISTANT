# AI Learning Assistant - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3000)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │Dashboard│ │Documents│ │Flashcards│ │ Quizzes  │      │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └──────────┘      │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │          React Router (Navigation)                │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │    AuthContext (Global State Management)         │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Axios API Client (HTTP/REST Communication)      │    │   │
│  │  │  - Request Interceptor (Add JWT Token)           │    │   │
│  │  │  - Response Interceptor (Handle 401 Errors)      │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST (JSON)
                              │ Authorization: Bearer <JWT>
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Express.js Server (Port 5000)                   │   │
│  │                                                           │   │
│  │  ┌───────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │   CORS    │  │   JSON   │  │  Multer │  │ Static  │  │   │
│  │  │ Middleware│  │  Parser  │  │  Upload │  │  Files  │  │   │
│  │  └───────────┘  └──────────┘  └─────────┘  └─────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │          Authentication Middleware                │    │   │
│  │  │  - Verify JWT Token                               │    │   │
│  │  │  - Extract userId from token                      │    │   │
│  │  │  - Attach userId to request                       │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │              API Routes                          │     │   │
│  │  │  /api/auth       - Authentication               │     │   │
│  │  │  /api/documents  - Document Management          │     │   │
│  │  │  /api/ai         - AI Features                  │     │   │
│  │  │  /api/flashcards - Flashcard Management         │     │   │
│  │  │  /api/quizzes    - Quiz Management              │     │   │
│  │  │  /api/progress   - Analytics & Progress         │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │                           │
                    │ Mongoose ODM              │ HTTP API
                    │                           │
                    ▼                           ▼
┌────────────────────────────────┐  ┌──────────────────────────┐
│        DATA LAYER               │  │    EXTERNAL SERVICES     │
│                                 │  │                          │
│  ┌──────────────────────────┐  │  │  ┌────────────────────┐  │
│  │      MongoDB Database    │  │  │  │    Groq AI API     │  │
│  │                          │  │  │  │                    │  │
│  │  Collections:            │  │  │  │  Model:            │  │
│  │  - users                 │  │  │  │  LLaMA 3.1 8B      │  │
│  │  - documents             │  │  │  │                    │  │
│  │  - flashcards            │  │  │  │  Features:         │  │
│  │  - quizzes               │  │  │  │  - Chat            │  │
│  │  - quizattempts          │  │  │  │  - Summarization   │  │
│  │  - chathistories         │  │  │  │  - Explanation     │  │
│  │                          │  │  │  │  - Generation      │  │
│  └──────────────────────────┘  │  │  └────────────────────┘  │
└────────────────────────────────┘  └──────────────────────────┘
```

## Data Flow Diagrams

### 1. User Registration/Login Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │   Enter Credentials │                     │                     │
 │──────────────────►  │                     │                     │
 │                     │                     │                     │
 │                     │  POST /auth/login   │                     │
 │                     │──────────────────►  │                     │
 │                     │                     │                     │
 │                     │                     │  Find User by Email │
 │                     │                     │──────────────────►  │
 │                     │                     │                     │
 │                     │                     │  User Document      │
 │                     │                     │ ◄───────────────────│
 │                     │                     │                     │
 │                     │                     │  Compare Password   │
 │                     │                     │  (bcrypt)           │
 │                     │                     │                     │
 │                     │                     │  Generate JWT       │
 │                     │                     │  (7 day expiry)     │
 │                     │                     │                     │
 │                     │  { token, user }    │                     │
 │                     │ ◄───────────────────│                     │
 │                     │                     │                     │
 │                     │  Store token in     │                     │
 │                     │  localStorage       │                     │
 │                     │                     │                     │
 │   Dashboard Page    │                     │                     │
 │ ◄───────────────────│                     │                     │
```

### 2. PDF Upload and Processing Flow

```
User                Frontend              Backend              Database              Groq AI
 │                     │                     │                     │                     │
 │   Select PDF File   │                     │                     │                     │
 │──────────────────►  │                     │                     │                     │
 │                     │                     │                     │                     │
 │                     │  POST /documents/   │                     │                     │
 │                     │  upload (multipart) │                     │                     │
 │                     │──────────────────►  │                     │                     │
 │                     │                     │                     │                     │
 │                     │                     │  Multer saves file  │                     │
 │                     │                     │  to disk            │                     │
 │                     │                     │                     │                     │
 │                     │                     │  pdf-parse extracts │                     │
 │                     │                     │  text content       │                     │
 │                     │                     │                     │                     │
 │                     │                     │  Convert PDF to     │                     │
 │                     │                     │  Base64             │                     │
 │                     │                     │                     │                     │
 │                     │                     │  Create Document    │                     │
 │                     │                     │──────────────────►  │                     │
 │                     │                     │                     │                     │
 │                     │                     │  Document Saved     │                     │
 │                     │                     │ ◄───────────────────│                     │
 │                     │                     │                     │                     │
 │                     │                     │  Delete local file  │                     │
 │                     │                     │                     │                     │
 │                     │  { document }       │                     │                     │
 │                     │ ◄───────────────────│                     │                     │
 │                     │                     │                     │                     │
 │   Success Message   │                     │                     │                     │
 │ ◄───────────────────│                     │                     │                     │
```

### 3. AI Chat with Document Flow

```
User              Frontend            Backend            Database            Groq AI
 │                   │                   │                   │                   │
 │  Type Message     │                   │                   │                   │
 │────────────────►  │                   │                   │                   │
 │                   │                   │                   │                   │
 │                   │  POST /ai/chat/   │                   │                   │
 │                   │  :documentId      │                   │                   │
 │                   │────────────────►  │                   │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Get Document     │                   │
 │                   │                   │────────────────►  │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Document Data    │                   │
 │                   │                   │ ◄─────────────────│                   │
 │                   │                   │                   │                   │
 │                   │                   │  Get/Create Chat  │                   │
 │                   │                   │  History          │                   │
 │                   │                   │────────────────►  │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Chat History     │                   │
 │                   │                   │ ◄─────────────────│                   │
 │                   │                   │                   │                   │
 │                   │                   │  Prepare context  │                   │
 │                   │                   │  (doc + history)  │                   │
 │                   │                   │                   │                   │
 │                   │                   │  groq.chat.       │                   │
 │                   │                   │  completions      │                   │
 │                   │                   │────────────────────────────────────►  │
 │                   │                   │                   │                   │
 │                   │                   │                   │  Process with     │
 │                   │                   │                   │  LLaMA 3.1 8B     │
 │                   │                   │                   │                   │
 │                   │                   │  AI Response      │                   │
 │                   │                   │ ◄─────────────────────────────────────│
 │                   │                   │                   │                   │
 │                   │                   │  Save messages to │                   │
 │                   │                   │  chat history     │                   │
 │                   │                   │────────────────►  │                   │
 │                   │                   │                   │                   │
 │                   │  { response,      │                   │                   │
 │                   │    chatId }       │                   │                   │
 │                   │ ◄─────────────────│                   │                   │
 │                   │                   │                   │                   │
 │  Display Response │                   │                   │                   │
 │ ◄─────────────────│                   │                   │                   │
```

### 4. Flashcard Generation Flow

```
User              Frontend            Backend            Database            Groq AI
 │                   │                   │                   │                   │
 │  Request Cards    │                   │                   │                   │
 │────────────────►  │                   │                   │                   │
 │                   │                   │                   │                   │
 │                   │  POST /flashcards/│                   │                   │
 │                   │  generate/:docId  │                   │                   │
 │                   │────────────────►  │                   │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Get Document     │                   │
 │                   │                   │────────────────►  │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Document Data    │                   │
 │                   │                   │ ◄─────────────────│                   │
 │                   │                   │                   │                   │
 │                   │                   │  Request JSON     │                   │
 │                   │                   │  flashcards       │                   │
 │                   │                   │────────────────────────────────────►  │
 │                   │                   │                   │                   │
 │                   │                   │                   │  Generate cards   │
 │                   │                   │                   │  with AI          │
 │                   │                   │                   │                   │
 │                   │                   │  JSON array       │                   │
 │                   │                   │ ◄─────────────────────────────────────│
 │                   │                   │                   │                   │
 │                   │                   │  Parse JSON       │                   │
 │                   │                   │  response         │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Bulk insert      │                   │
 │                   │                   │  flashcards       │                   │
 │                   │                   │────────────────►  │                   │
 │                   │                   │                   │                   │
 │                   │                   │  Saved cards      │                   │
 │                   │                   │ ◄─────────────────│                   │
 │                   │                   │                   │                   │
 │                   │  { flashcards }   │                   │                   │
 │                   │ ◄─────────────────│                   │                   │
 │                   │                   │                   │                   │
 │  Display Cards    │                   │                   │                   │
 │ ◄─────────────────│                   │                   │                   │
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Components                         │
│                                                                  │
│  ┌────────────┐         ┌────────────┐         ┌────────────┐  │
│  │   Login    │────────►│ AuthContext│◄────────│  Register  │  │
│  └────────────┘         └─────┬──────┘         └────────────┘  │
│                               │                                 │
│                               │ Provides: user, token, login,   │
│                               │ logout, updateUser              │
│                               │                                 │
│       ┌───────────────────────┴───────────────────────┐        │
│       │                                                 │        │
│       ▼                                                 ▼        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Dashboard  │  │ Documents  │  │ Flashcards │  │ Quizzes  │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘ │
│        │               │               │               │        │
│        └───────────────┴───────────────┴───────────────┘        │
│                        │                                         │
│                        │ Uses                                    │
│                        ▼                                         │
│              ┌──────────────────┐                                │
│              │   API Client     │                                │
│              │   (Axios)        │                                │
│              │  - Interceptors  │                                │
│              │  - Token Mgmt    │                                │
│              └────────┬─────────┘                                │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ HTTP/REST
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Routes                              │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────┐  ┌──────────┐  ┌────────┐ │
│  │  /auth  │  │/documents│  │ /ai  │  │/flashcard│  │/quizzes│ │
│  └────┬────┘  └────┬─────┘  └───┬──┘  └────┬─────┘  └───┬────┘ │
│       │            │            │          │            │        │
│       └────────────┴────────────┴──────────┴────────────┘        │
│                    │                                              │
│                    │ Uses                                         │
│                    ▼                                              │
│       ┌────────────────────────────────┐                         │
│       │         Mongoose Models        │                         │
│       │  - User    - Flashcard         │                         │
│       │  - Document - Quiz             │                         │
│       │  - ChatHistory - QuizAttempt   │                         │
│       └────────────┬───────────────────┘                         │
└────────────────────┼───────────────────────────────────────────┘
                     │
                     │ ODM Operations
                     │
                     ▼
            ┌─────────────────┐
            │    MongoDB      │
            │   Collections   │
            └─────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
│                                                                  │
│  1. Transport Security                                           │
│     └─ HTTPS (Production)                                        │
│                                                                  │
│  2. Authentication Layer                                         │
│     ├─ JWT Token Generation (7 day expiry)                       │
│     ├─ Password Hashing (bcrypt, 10 rounds)                      │
│     └─ Token Verification Middleware                             │
│                                                                  │
│  3. Authorization Layer                                          │
│     └─ User-Resource Ownership Validation                        │
│        (All queries include user: req.userId)                    │
│                                                                  │
│  4. Input Validation                                             │
│     ├─ File Type Validation (PDF only)                           │
│     ├─ File Size Limit (50MB)                                    │
│     ├─ Request Body Size Limits                                  │
│     └─ Mongoose Schema Validation                                │
│                                                                  │
│  5. CORS Protection                                              │
│     └─ Configured for specific origins (production)              │
│                                                                  │
│  6. API Security                                                 │
│     └─ GROQ_API_KEY stored in environment variables              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Production Environment                          │
│                                                                  │
│  ┌────────────────┐                                              │
│  │   CDN / Netlify│                                              │
│  │   (Frontend)   │                                              │
│  │   - React Build│                                              │
│  │   - Static Files│                                              │
│  └───────┬────────┘                                              │
│          │                                                        │
│          │ API Calls                                              │
│          │                                                        │
│          ▼                                                        │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │  Render.com      │          │  MongoDB Atlas   │             │
│  │  (Backend)       │──────────│  (Database)      │             │
│  │  - Express Server│          │  - Replica Set   │             │
│  │  - Node.js       │          │  - Auto Backup   │             │
│  └────────┬─────────┘          └──────────────────┘             │
│           │                                                       │
│           │ AI API Calls                                          │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────┐                                            │
│  │   Groq AI API    │                                            │
│  │   - LLaMA 3.1    │                                            │
│  └──────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: June 2026
