# Antigravity integration for GPT-6 Luna Decisions

Antigravity supports custom MCP servers. This adds a local MCP server so the agent can call a separate `gpt6_luna_decision` tool without replacing its chat model.

## Setup

1. Open this repository folder in Antigravity.
2. In the Agent panel, click `...` → **MCP Servers** → **Manage MCP Servers** → **View raw config**.
3. Merge this entry into the existing `mcpServers` object; preserve any existing entries. Replace the placeholder with the absolute path to your local clone, using forward slashes.

```json
{
  "mcpServers": {
    "experiential-luna-decisions": {
      "command": "node",
      "args": ["C:/FULL/PATH/TO/annamalai-hotel/antigravity-decisions-mcp.js"]
    }
  }
}
```

4. Save and refresh/reload the MCP servers (or restart Antigravity). Confirm `experiential-luna-decisions` and its `gpt6_luna_decision` tool appear.

## API key

Set `EXPERIENTIAL_API_KEY` in your Windows user environment before starting Antigravity, then fully restart Antigravity so the server inherits it. Never paste the key into prompts, commit it, or put it in this config. Do not use an OpenAI key; the helper does not call `api.openai.com`.

## Safety

- Use mock tests first: `node --test decisions-helper.test.js`. They do not call the provider.
- Ask for explicit approval before the first live decision call because provider usage may be chargeable.
- The helper makes one POST to `https://api.experientiallabs.ai/v1/decisions`, uses model `gpt-6-luna-decisions`, and never retries after timeouts or network failures.
- The decision output is advice only. Never automatically execute the choice, merge changes, or bypass review.

Official setup steps: https://www.antigravity.google/docs/mcp
