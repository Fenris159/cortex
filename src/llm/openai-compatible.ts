import OpenAI from 'npm:openai';
import type { CompletionChunk, CompletionOptions, CompletionResult, LLMProvider } from './types.ts';

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly defaultModel: string;
  protected client: OpenAI;
  protected pricing: Record<string, { in: number; out: number }>;

  constructor(
    name: string,
    defaultModel: string,
    baseUrl: string,
    apiKey: string,
    pricing: Record<string, { in: number; out: number }>,
  ) {
    this.name = name;
    this.defaultModel = defaultModel;
    this.pricing = pricing;
    this.client = new OpenAI({ apiKey, baseURL: baseUrl });
  }

  async complete(options: CompletionOptions): Promise<CompletionResult> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (options.systemPrompt) {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await this.client.chat.completions.create({
      model: options.model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: false,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const tokensIn = response.usage?.prompt_tokens ?? 0;
    const tokensOut = response.usage?.completion_tokens ?? 0;
    const rates = this.pricing[options.model] ?? { in: 2.5, out: 10.0 };
    const costUsd = (tokensIn * rates.in + tokensOut * rates.out) / 1_000_000;

    return { content, model: options.model, tokensIn, tokensOut, costUsd };
  }

  async *stream(options: CompletionOptions): AsyncIterable<CompletionChunk> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (options.systemPrompt) {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const stream = await this.client.chat.completions.create({
      model: options.model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let tokensIn = 0;
    let tokensOut = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) yield { delta, done: false };
      if (chunk.usage) {
        tokensIn = chunk.usage.prompt_tokens ?? 0;
        tokensOut = chunk.usage.completion_tokens ?? 0;
      }
    }

    const rates = this.pricing[options.model] ?? { in: 2.5, out: 10.0 };
    const costUsd = (tokensIn * rates.in + tokensOut * rates.out) / 1_000_000;
    yield { delta: '', done: true, tokensIn, tokensOut, costUsd };
  }
}
