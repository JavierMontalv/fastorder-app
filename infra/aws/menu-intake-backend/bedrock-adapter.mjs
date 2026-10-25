// Prepared adapter only: inject an authorized SDK client after a measured migration.
// Not imported by the production application and never activates a paid service itself.
export function createBedrockIntakeAdapter({ client, ConverseCommand, modelId }) {
  if (!client?.send || !ConverseCommand || !modelId) throw Error('Configure an authorized client and a verified regional model first.');
  return async ({ prompt, images = [], maxTokens = 1400 }) => {
    if (images.length > 4) throw Error('At most four photos per request.');
    const response = await client.send(new ConverseCommand({ modelId, messages: [{ role: 'user', content: [{ text: prompt }, ...images.map(image => ({ image: { format: 'jpeg', source: { bytes: Buffer.from(image.split(',')[1], 'base64') } } }))] }], inferenceConfig: { maxTokens: Math.min(maxTokens, 1400), temperature: .2 } }));
    return { output: response.output?.message?.content?.map(item => item.text || '').join('') || '', tokensInput: response.usage?.inputTokens || 0, tokensOutput: response.usage?.outputTokens || 0 };
  };
}
