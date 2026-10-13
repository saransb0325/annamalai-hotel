/**
 * Minimal native-HTTP client for GPT-6 Luna Decisions.
 * This is a structured decision endpoint, not a chat-completion client.
 */
const DECISIONS_URL = 'https://api.experientiallabs.ai/v1/decisions';
const MODEL = 'gpt-6-luna-decisions';
const DEFAULT_TIMEOUT_MS = 15_000;

function validateRequest({ input, questions }) {
  if (!(typeof input === 'string' || (Array.isArray(input) && input.length > 0))) {
    throw new TypeError('input must be a non-empty string or a non-empty messages array');
  }
  if (Array.isArray(input)) {
    for (const message of input) {
      if (!message || typeof message !== 'object' || !Array.isArray(message.content)) {
        throw new TypeError('each input message must contain a content array');
      }
      for (const part of message.content) {
        if (!part || typeof part !== 'object' || !['input_text', 'input_image'].includes(part.type)) {
          throw new TypeError('message content parts must use input_text or input_image');
        }
        if (part.type === 'input_text' && typeof part.text !== 'string') {
          throw new TypeError('input_text parts require a text string');
        }
        if (part.type === 'input_image' && typeof part.image_url !== 'string') {
          throw new TypeError('input_image parts require an inline data URL/base64 image_url string');
        }
      }
    }
  }
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 32) {
    throw new RangeError('questions must contain between 1 and 32 items');
  }
  for (const [index, question] of questions.entries()) {
    if (!question || typeof question.instructions !== 'string' || !question.instructions.trim()) {
      throw new TypeError(`questions[${index}].instructions is required`);
    }
    if (!['predicate', 'choice', 'score'].includes(question.type)) {
      throw new TypeError(`questions[${index}].type must be predicate, choice, or score`);
    }
    if (question.name !== undefined && (typeof question.name !== 'string' || !question.name.trim())) {
      throw new TypeError(`questions[${index}].name must be a non-empty string when supplied`);
    }
    if (question.type === 'choice') {
      if (!Array.isArray(question.choices) || question.choices.length < 1 || question.choices.length > 64) {
        throw new RangeError(`questions[${index}].choices must contain 1 to 64 options`);
      }
      if (question.choices.some(c => !c || typeof c.value !== 'string' || typeof c.description !== 'string')) {
        throw new TypeError(`questions[${index}].choices need string value and description fields`);
      }
    }
    if (question.type === 'score') {
      if (!Array.isArray(question.levels) || question.levels.length < 2 || question.levels.length > 10) {
        throw new RangeError(`questions[${index}].levels must contain 2 to 10 levels`);
      }
      if (question.levels.some(level => !level || typeof level.value !== 'string' || typeof level.description !== 'string')) {
        throw new TypeError(`questions[${index}].levels need string value and description fields`);
      }
    }
  }
}

async function requestDecision({ input, questions, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const apiKey = process.env.EXPERIENTIAL_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('EXPERIENTIAL_API_KEY is not set. Set it in your local environment before calling the decisions API.');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new RangeError('timeoutMs must be an integer between 1 and 120000');
  }
  validateRequest({ input, questions });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(DECISIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ model: MODEL, input, questions }),
      signal: controller.signal
    });
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`Decisions API returned invalid JSON (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      const detail = data && typeof data.error === 'string' ? data.error : response.statusText;
      throw new Error(`Decisions API HTTP ${response.status}: ${detail || 'request failed'}`);
    }
    return data;
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`Decisions API request timed out after ${timeoutMs}ms; outcome may be unknown. No automatic retry was attempted.`);
    }
    if (error instanceof TypeError && /fetch|network|connect/i.test(error.message)) {
      throw new Error(`Decisions API transport error: ${error.message}. Outcome may be unknown; no automatic retry was attempted.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { requestDecision, validateRequest, DECISIONS_URL, MODEL };
