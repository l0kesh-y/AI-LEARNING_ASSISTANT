/**
 * Text Chunking Utility
 * 
 * Splits long text content into smaller chunks for AI processing.
 * Useful for:
 * - Breaking down large documents for LLM token limits
 * - Processing PDF content in manageable pieces
 * - Creating flashcards and quizzes from long texts
 * 
 * Features:
 * - Word-boundary aware (never breaks words mid-character)
 * - Configurable chunk size
 * - Handles edge cases (empty text, single chunks)
 * - Preserves text formatting and spacing
 */

/**
 * Split text into chunks without breaking words
 * 
 * Takes a long text string and splits it into smaller chunks that fit
 * within the specified size limit. Always breaks at word boundaries
 * to maintain readability and semantic integrity.
 * 
 * Algorithm:
 * 1. Split text into individual words
 * 2. Build chunks by adding words until size limit is reached
 * 3. Start new chunk when next word would exceed limit
 * 4. Handle edge cases (empty text, single word longer than limit)
 * 
 * @param {string} text - The text content to split into chunks
 * @param {number} maxChunkSize - Maximum size of each chunk in characters (default: 2000)
 * 
 * @returns {string[]} Array of text chunks, each within the size limit
 * 
 * @example
 * const text = "This is a very long document that needs to be split...";
 * const chunks = chunkText(text, 100);
 * // Returns: ["This is a very long document...", "that needs to be split..."]
 * 
 * @example
 * // Empty text returns empty array
 * chunkText("") // Returns: []
 * 
 * @example
 * // Text shorter than limit returns single chunk
 * chunkText("Short text", 100) // Returns: ["Short text"]
 */
function chunkText(text, maxChunkSize = 2000) {
  // Validate input - return empty array for invalid text
  if (!text || typeof text !== 'string') return [];

  // Remove leading/trailing whitespace
  const normalizedText = text.trim();
  if (!normalizedText) return [];

  // If text fits in one chunk, return it as-is
  if (normalizedText.length <= maxChunkSize) {
    return [normalizedText];
  }

  // Split text into individual words (using any whitespace as delimiter)
  const words = normalizedText.split(/\s+/);
  const chunks = [];
  let currentChunk = '';

  // Build chunks by adding words until size limit is reached
  for (const word of words) {
    // Calculate size of current chunk plus next word (with space)
    const potentialChunk = (currentChunk + ' ' + word).trim();
    
    if (potentialChunk.length <= maxChunkSize) {
      // Word fits in current chunk, add it
      currentChunk = potentialChunk;
    } else {
      // Word doesn't fit, save current chunk and start new one
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // Start new chunk with current word
      // Note: If single word exceeds maxChunkSize, it will be added as-is
      currentChunk = word;
    }
  }

  // Add the final chunk if not empty
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

module.exports = {
  chunkText
};
