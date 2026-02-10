import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

let genAI: GoogleGenerativeAI | null = null;
let anthropic: Anthropic | null = null;

export function hasApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY || !!process.env.ANTHROPIC_API_KEY || !!process.env.NVIDIA_API_KEY;
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function hasNvidiaKey(): boolean {
  return !!process.env.NVIDIA_API_KEY;
}

export function hasOllamaConfig(): boolean {
  // Par defaut, on suppose que localhost:11434 est accessible si la variable est set ou en dev
  return !!process.env.OLLAMA_BASE_URL || process.env.NODE_ENV === 'development';
}

export function getGeminiModel(modelName = 'gemini-2.0-flash'): GenerativeModel {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI.getGenerativeModel({ model: modelName });
}

export function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';

export async function nvidiaGenerate(prompt: string, signal?: AbortSignal, maxTokens = 8000): Promise<string> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Appel specifique pour le raisonnement complexe (DeepSeek-R1).
 */
export async function deepseekReason(prompt: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-ai/deepseek-r1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6, // Legerement plus haut pour le raisonnement
      max_tokens: 16000,
    }),
    signal,
  });

  if (!response.ok) throw new Error(`DeepSeek R1 Error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

const OLLAMA_DEFAULT_URL = 'http://127.0.0.1:11434';
const OLLAMA_MODEL = 'llama3'; // ou 'mistral'

export async function ollamaGenerate(prompt: string, signal?: AbortSignal): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || OLLAMA_DEFAULT_URL;
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_ctx: 8192 // Contexte etendu pour les DCE
        }
      }),
      signal,
    });

    if (!response.ok) {
      // Si 404, le modele n'est peut-etre pas pull
      if (response.status === 404) throw new Error(`Modele ${OLLAMA_MODEL} non trouve sur Ollama`);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response ?? '';
  } catch (error) {
    // Fail silently if Ollama is not running in dev to allow fallback
    throw new Error(`Ollama unreachable: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

export async function nvidiaStream(prompt: string, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('NVIDIA stream body is null');
  }

  return response.body;
}
