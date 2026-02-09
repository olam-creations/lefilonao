import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

let genAI: GoogleGenerativeAI | null = null;
let anthropic: Anthropic | null = null;

export function hasApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
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
