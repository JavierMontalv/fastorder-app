import test from 'node:test';
import assert from 'node:assert/strict';
import { createBedrockIntakeAdapter } from '../../infra/aws/menu-intake-backend/bedrock-adapter.mjs';
test('future adapter normalizes usage and bounds output without a live invocation', async () => {
  let sent;
  const adapter = createBedrockIntakeAdapter({ modelId: 'test-only', ConverseCommand: class { constructor(input) { this.input = input; } }, client: { async send(command) { sent = command.input; return { output: { message: { content: [{ text: '{"items":[]}' }] } }, usage: { inputTokens: 20, outputTokens: 10 } }; } } });
  const result = await adapter({ prompt: 'test', maxTokens: 9000 });
  assert.equal(sent.inferenceConfig.maxTokens, 1400); assert.equal(result.tokensInput, 20);
  assert.throws(() => createBedrockIntakeAdapter({}));
});
