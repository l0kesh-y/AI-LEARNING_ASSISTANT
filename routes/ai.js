const express = require('express');
const Groq = require('groq-sdk');
const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Chat with document
router.post('/chat/:documentId', auth, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const { documentId } = req.params;

    // Get document
    const document = await Document.findOne({
      _id: documentId,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get or create chat history
    let chatHistory;
    if (chatId) {
      chatHistory = await ChatHistory.findOne({
        _id: chatId,
        user: req.userId,
        document: documentId
      });
    }

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        user: req.userId,
        document: documentId,
        messages: [],
        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });
    }

    // Add user message to history
    chatHistory.messages.push({
      role: 'user',
      content: message
    });

    // Prepare context for AI
    const context = `Document Title: ${document.title}\n\nDocument Content:\n${document.content.substring(0, 8000)}`;
    
    // Get recent conversation history
    const recentMessages = chatHistory.messages.slice(-10);
    
    const messages = [
      {
        role: 'system',
        content: `You are an AI learning assistant. Help the user understand and learn from their document. Be concise, accurate, and educational. Always base your responses on the provided document content.

Document Context:
${context}`
      },
      ...recentMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Get AI response
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Add AI response to history
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    await chatHistory.save();

    res.json({
      response: aiResponse,
      chatId: chatHistory._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat request' });
  }
});

// Generate document summary
router.post('/summarize/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if summary already exists
    if (document.summary) {
      return res.json({ summary: document.summary });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that creates concise, informative summaries of academic documents. Focus on key concepts, main arguments, and important details.'
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary of the following document:\n\nTitle: ${document.title}\n\nContent:\n${document.content}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1500
    });

    const summary = completion.choices[0]?.message?.content || 'Could not generate summary.';

    // Save summary to document
    document.summary = summary;
    await document.save();

    res.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ message: 'Error generating summary' });
  }
});

// Explain concept from document
router.post('/explain/:documentId', auth, async (req, res) => {
  try {
    const { concept } = req.body;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      user: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI tutor that explains concepts clearly and thoroughly. Use the provided document as your primary source and explain concepts in an educational, easy-to-understand manner.

Document Context:
Title: ${document.title}
Content: ${document.content.substring(0, 6000)}`
        },
        {
          role: 'user',
          content: `Please explain the concept of "${concept}" based on the information in this document. Provide a clear, detailed explanation with examples if available.`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 1200
    });

    const explanation = completion.choices[0]?.message?.content || 'Could not generate explanation.';

    res.json({ explanation });
  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({ message: 'Error generating explanation' });
  }
});

// Get chat history for document
router.get('/chat-history/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const chatHistories = await ChatHistory.find({
      user: req.userId,
      document: documentId
    }).sort({ updatedAt: -1 });

    res.json(chatHistories);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await ChatHistory.findOne({
      _id: chatId,
      user: req.userId
    }).populate('document', 'title');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;