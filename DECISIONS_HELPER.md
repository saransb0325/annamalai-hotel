# GPT-6 Luna Decisions helper

This adds a small, separate decision helper. It does not replace the website's existing chat model and is not a chat-completions facade.

## Requirements

- Node.js 18+ (built-in `fetch`; no new dependencies)
- Set `EXPERIENTIAL_API_KEY` in your local environment. Never put the key in source control, browser code, logs, or chat.

PowerShell (current terminal only):

```powershell
$env:EXPERIENTIAL_API_KEY = "YOUR_KEY_LOCALLY"
```

Do not commit the key or paste it into an issue/PR.

## Example

```js
const { requestDecision } = require('./decisions-helper');

const result = await requestDecision({
  input: 'Review this concise diff: replace an unchecked user input with validated input.',
  questions: [
    {
      name: 'safe_to_merge',
      instructions: 'Is this change safe to merge based on the provided information?',
      type: 'predicate'
    },
    {
      name: 'risk',
      instructions: 'Choose the most appropriate risk level.',
      type: 'choice',
      choices: [
        { value: 'low', description: 'No material risk found' },
        { value: 'medium', description: 'Some risk or missing context' },
        { value: 'high', description: 'Material risk identified' }
      ]
    },
    {
      name: 'confidence',
      instructions: 'Rate the strength of evidence.',
      type: 'score',
      levels: [
        { value: 'low', description: 'Weak evidence' },
        { value: 'medium', description: 'Some supporting evidence' },
        { value: 'high', description: 'Strong supporting evidence' }
      ]
    }
  ]
});
console.log(result);
```

Input may also be a messages array whose content parts use `input_text` and `input_image`; image content should be inline base64/data URL as required by the API contract.

## Tests

```sh
node --test decisions-helper.test.js
```

Tests mock `fetch`; they do not contact the paid API. The helper validates limits (32 questions, 64 choice options, 2–10 score levels), uses a bounded timeout, sends one POST to `https://api.experientiallabs.ai/v1/decisions`, and does not retry. On timeout/transport failure, the remote outcome may be unknown; check provider usage before considering a manual repeat.

Treat returned answers as advice, not guarantees. Answers correspond to question order; an answer may indicate refusal. Never automatically execute a returned choice, merge changes, or bypass human review. Check provider response fields and usage in the actual response; the helper returns parsed JSON without guessing a schema.

## Scope

Files added on branch `feat/gpt-6-luna-decisions`:
- `decisions-helper.js`
- `decisions-helper.test.js`
- `DECISIONS_HELPER.md`

No existing website files or chat-model settings are changed. No live API request is made by tests.
