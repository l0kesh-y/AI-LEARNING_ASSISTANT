const express = require('express');
const { getGroqClient } = require('../utils/groqLoadBalancer');
const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

// Chat with document
router.post('/chat/:documentId', auth, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const { documentId } = req.params;

    const document = await Document.findOne({ _id: documentId, user: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    let chatHistory;
    if (chatId) {
      chatHistory = await ChatHistory.findOne({ _id: chatId, user: req.userId, document: documentId });
    }
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        user: req.userId,
        document: documentId,
        messages: [],
        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });
    }

    chatHistory.messages.push({ role: 'user', content: message });

    const context = `Document Title: ${document.title}\n\nDocument Content:\n${document.content.substring(0, 8000)}`;
    const recentMessages = chatHistory.messages.slice(-10);

    const messages = [
      {
        role: 'system',
        content: `You are an AI learning assistant. Help the user understand and learn from their document. Be concise, accurate, and educational. Always base your responses on the provided document content.\n\nDocument Context:\n${context}`
      },
      ...recentMessages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];

    const groq = getGroqClient();
    const completion = await groq.createCompletion({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    chatHistory.messages.push({ role: 'assistant', content: aiResponse });
    await chatHistory.save();

    res.json({ response: aiResponse, chatId: chatHistory._id });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat request' });
  }
});

// Generate document summary
router.post('/summarize/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findOne({ _id: documentId, user: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.summary) return res.json({ summary: document.summary });

    const groq = getGroqClient();
    const completion = await groq.createCompletion({
      messages: [
        { role: 'system', content: 'You are an AI assistant that creates concise, informative summaries of academic documents. Focus on key concepts, main arguments, and important details.' },
        { role: 'user', content: `Please provide a comprehensive summary of the following document:\n\nTitle: ${document.title}\n\nContent:\n${document.content}` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1500
    });

    const summary = completion.choices[0]?.message?.content || 'Could not generate summary.';
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
    const document = await Document.findOne({ _id: documentId, user: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const groq = getGroqClient();
    const completion = await groq.createCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an AI tutor that explains concepts clearly and thoroughly. Use the provided document as your primary source.\n\nDocument Context:\nTitle: ${document.title}\nContent: ${document.content.substring(0, 6000)}`
        },
        { role: 'user', content: `Please explain the concept of "${concept}" based on the information in this document. Provide a clear, detailed explanation with examples if available.` }
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
router.get('/chat-history/:documentId', auth, cacheMiddleware(30), async (req, res) => {
  try {
    const chatHistories = await ChatHistory.find({ user: req.userId, document: req.params.documentId })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(chatHistories);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/chat/:chatId', auth, cacheMiddleware(30), async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({ _id: req.params.chatId, user: req.userId })
      .populate('document', 'title')
      .lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Groq load balancer stats (admin/health endpoint)
router.get('/lb-stats', auth, (req, res) => {
  try {
    const groq = getGroqClient();
    res.json(groq.getStats());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching LB stats' });
  }
});

module.exports = router;
