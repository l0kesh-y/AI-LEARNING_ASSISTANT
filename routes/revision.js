const express = require('express');
const { getGroqClient } = require('../utils/groqLoadBalancer');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { chunkText } = require('../utils/textChunker');

const router = express.Router();

// Routes for generating revision questions and evaluating spoken answers with AI.
/**
 * POST /api/revision/generate/:documentId
 * Generate a set of spoken revision questions from document content.
 * Returns N open-ended questions (not MCQ) to test understanding.
 */
router.post('/generate/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { count = 5 } = req.body;

    const document = await Document.findOne({ _id: documentId, user: req.userId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const chunks = chunkText(document.content || '', 4000);
    const groq = getGroqClient();
    const completion = await groq.createCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an educational tutor creating spoken revision questions. 
Generate ${count} open-ended questions that test deep understanding of the document. 
Questions should require a spoken explanation, not just yes/no.
Return ONLY a valid JSON array of objects with:
- "question": the question text (string)
- "keyPoints": array of 3-5 key concepts the answer should cover (strings)
- "difficulty": "easy" | "medium" | "hard"
No extra text, just the JSON array.`
        },
        {
          role: 'user',
          content: `Create ${count} revision questions for:\n\nTitle: ${document.title}\n\nContent:\n${chunks.slice(0, 2).join('\n\n')}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    let questions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ message: 'Error parsing AI response' });
    }

    res.json({
      documentId,
      documentTitle: document.title,
      questions,
      sessionDurationSeconds: 300 // 5 minutes total
    });
  } catch (error) {
    console.error('Revision generate error:', error);
    res.status(500).json({ message: 'Error generating revision questions' });
  }
});

/**
 * POST /api/revision/evaluate
 * Evaluate a spoken answer against a question using AI.
 */
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { question, keyPoints, spokenAnswer, documentId } = req.body;

    if (!question || !spokenAnswer) {
      return res.status(400).json({ message: 'question and spokenAnswer are required' });
    }

    let documentContext = '';
    if (documentId) {
      const document = await Document.findOne({ _id: documentId, user: req.userId });
      if (document) {
        const chunks = chunkText(document.content || '', 3000);
        documentContext = `\n\nDocument context: ${chunks.slice(0, 2).join('\n\n')}`;
      }
    }

    const groq = getGroqClient();
    const completion = await groq.createCompletion({
      messages: [
        {
          role: 'system',
          content: `You are a fair and encouraging educational evaluator.
Evaluate the student's spoken answer against the question and key concepts.
Return ONLY valid JSON with:
{
  "score": <0-100 integer>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "coveredPoints": ["<key points the student mentioned>"],
  "missedPoints": ["<key points that were missing>"],
  "passed": <true if score >= 60>
}${documentContext}`
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nExpected key points: ${(keyPoints || []).join(', ')}\n\nStudent's spoken answer: "${spokenAnswer}"\n\nEvaluate the answer.`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    let evaluation;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('Evaluation parse error:', parseError);
      return res.status(500).json({ message: 'Error parsing AI evaluation' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Revision evaluate error:', error);
    res.status(500).json({ message: 'Error evaluating answer' });
  }
});

module.exports = router;
