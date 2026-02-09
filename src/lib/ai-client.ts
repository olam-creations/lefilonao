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

export async function nvidiaGenerate(prompt: string): Promise<string> {
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
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function nvidiaStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
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
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  return response.body!;
}
