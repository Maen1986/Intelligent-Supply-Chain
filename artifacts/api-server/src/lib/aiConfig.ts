/**
 * Central AI model configuration.
 *
 * All routes that call the OpenAI chat completions API must import
 * OPENAI_MODEL from here — never hardcode a model name in a route file.
 * Override via the OPENAI_MODEL environment variable if needed.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/** Model used for text-to-speech generation. */
export const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';

/**
 * Convert an OpenAI SDK error into a safe, user-friendly message.
 * Never exposes raw SDK error text (which may include model names,
 * request IDs, or other internals) to the client.
 */
export function friendlyAIError(err: unknown): { message: string; status: number } {
  const anyErr = err as { status?: number; code?: string } | undefined;
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined;

  if (status === 404 || anyErr?.code === 'model_not_found') {
    return {
      message: 'The AI service is misconfigured (unknown model). Please contact support.',
      status: 502,
    };
  }
  if (status === 429) {
    return {
      message: 'The AI service is currently busy. Please try again in a moment.',
      status: 503,
    };
  }
  if (status === 401 || status === 403) {
    return {
      message: 'The AI service is unavailable due to a configuration issue. Please contact support.',
      status: 502,
    };
  }
  return {
    message: 'The AI service could not complete your request. Please try again shortly.',
    status: 502,
  };
}
