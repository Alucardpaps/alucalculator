import type { Metadata } from 'next';
import AIConnectClient from './AIConnectClient';

export const metadata: Metadata = {
  title: 'AI Connection',
  description: 'Connect AluCAD OS to your own AI account (OpenRouter, Gemini, OpenAI, Claude or local Ollama). Keys stay in your browser.',
  robots: { index: false, follow: true },
};

export default function Page() {
  return <AIConnectClient />;
}
