#!/usr/bin/env node
'use strict';

// Antigravity MCP bridge. It only calls the separate Decisions endpoint via the helper.
const readline = require('node:readline');
const { requestDecision } = require('./decisions-helper');

const serverInfo = { name: 'experiential-luna-decisions', version: '1.0.0' };
const schema = {
  type: 'object',
  properties: {
    input: { description: 'Decision context as text or supported messages', oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'object' } }
    ] },
    questions: {
      type: 'array', minItems: 1, maxItems: 32,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          instructions: { type: 'string' },
          type: { type: 'string', enum: ['predicate', 'choice', 'score'] },
          choices: { type: 'array', maxItems: 64, items: { type: 'object', properties: { value: { type: 'string' }, description: { type: 'string' } }, required: ['value', 'description'] } },
          levels: { type: 'array', minItems: 2, maxItems: 10, items: { type: 'object', properties: { value: { type: 'string' }, description: { type: 'string' } }, required: ['value', 'description'] } }
        },
        required: ['instructions', 'type']
      }
    },
    reviewQuestionIndex: { type: 'integer', minimum: 0, description: 'Zero-based question index for the main decision' },
    timeoutMs: { type: 'integer', minimum: 1, maximum: 120000 }
  },
  required: ['input', 'questions', 'reviewQuestionIndex']
};

function send(value) { process.stdout.write(JSON.stringify(value) + '\n'); }
function rpcError(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }

async function handle(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    if (message && 'id' in message) rpcError(message.id, -32600, 'Invalid request');
    return;
  }
  if (message.method.startsWith('notifications/')) return;
  if (!('id' in message)) return;
  const id = message.id;

  if (message.method === 'initialize') {
    send({ jsonrpc: '2.0', id, result: {
      protocolVersion: message.params && message.params.protocolVersion || '2024-11-05',
      capabilities: { tools: {} }, serverInfo
    }});
    return;
  }
  if (message.method === 'ping') { send({ jsonrpc: '2.0', id, result: {} }); return; }
  if (message.method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: [{
      name: 'gpt6_luna_decision',
      description: 'Obtain structured decision advice from GPT-6 Luna Decisions. This tool does not execute decisions or merge code.',
      inputSchema: schema
    }] }});
    return;
  }
  if (message.method !== 'tools/call') { rpcError(id, -32601, 'Method not found'); return; }
  const params = message.params || {};
  if (params.name !== 'gpt6_luna_decision') { rpcError(id, -32602, 'Unknown tool'); return; }

  try {
    const args = params.arguments || {};
    if (!Number.isInteger(args.reviewQuestionIndex) || args.reviewQuestionIndex < 0 ||
        !Array.isArray(args.questions) || args.reviewQuestionIndex >= args.questions.length) {
      throw new TypeError('reviewQuestionIndex must be a valid zero-based index into questions');
    }
    const response = await requestDecision({
      input: args.input, questions: args.questions, timeoutMs: args.timeoutMs
    });
    const answers = Array.isArray(response && response.answers) ? response.answers : null;
    const decision = answers ? (answers[args.reviewQuestionIndex] ?? null) : null;
    const refused = !!decision && typeof decision === 'object' &&
      (decision.refusal === true || decision.type === 'refusal' || decision.status === 'refused');
    const output = {
      model: 'gpt-6-luna-decisions',
      reviewQuestionIndex: args.reviewQuestionIndex,
      decisionStatus: decision === null ? 'answer_unavailable' : refused ? 'declined' : 'returned',
      decision,
      answers,
      usage: response && response.usage !== undefined ? response.usage : null,
      note: 'Advice is not a guarantee. Review it yourself; never auto-execute a choice, merge code, or bypass human review.'
    };
    send({ jsonrpc: '2.0', id, result: {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      isError: false
    }});
  } catch (error) {
    send({ jsonrpc: '2.0', id, result: {
      content: [{ type: 'text', text: error && error.message ? error.message : 'Decision request failed' }],
      isError: true
    }});
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', line => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); }
  catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
  handle(message).catch(() => {
    if (message && 'id' in message) rpcError(message.id, -32603, 'Internal server error');
  });
});
