const express = require('express');
const Groq = require('groq-sdk');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { chunkText } = require('../utils/textChunker');

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// AI routes for chatting with documents, generating summaries, and explaining concepts.
// Chat with document
router.post('/chat/:documentId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const { documentId } = req.params;

    const document = await Document.findOne({ _id: documentId, user: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const chunks = chunkText(document.content || '', 4000);
    const context = `Document Title: ${document.title}\n\nDocument Content:\n${chunks.slice(0, 2).join('\n\n')}`;

    const messages = [
      {
        role: 'system',
        content: `You are an AI learning assistant. Help the user understand and learn from their document. Be concise, accurate, and educational. Always base your responses on the provided document content.\n\nDocument Context:\n${context}`
      },
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ response: aiResponse });
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

    const chunks = chunkText(document.content || '', 4000);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI assistant that creates concise, informative summaries of academic documents. Focus on key concepts, main arguments, and important details.' },
        { role: 'user', content: `Please provide a comprehensive summary of the following document:\n\nTitle: ${document.title}\n\nContent:\n${chunks.join('\n\n')}` }
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

    const chunks = chunkText(document.content || '', 4000);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI tutor that explains concepts clearly and thoroughly. Use the provided document as your primary source.\n\nDocument Context:\nTitle: ${document.title}\nContent: ${chunks.slice(0, 2).join('\n\n')}`
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

module.exports = router;
