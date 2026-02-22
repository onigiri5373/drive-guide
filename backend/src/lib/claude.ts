import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt.js';
import type { NarrateRequest } from '../types/index.js';

let client: Anthropic | null = null;

function isApiKeySet(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key !== 'sk-ant-your-api-key-here' && key.length > 10;
}

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

const directionText: Record<string, string> = {
  left: '左手をご覧ください。',
  right: '右手をご覧ください。',
  ahead: '正面に見えてまいりました。',
  behind: '今通り過ぎたところに',
};

function generateDemoNarration(req: NarrateRequest): string {
  const dir = directionText[req.direction] || '';
  const distText = req.distance < 500 ? 'すぐそこに' : `約${Math.round(req.distance)}m先に`;

  const templates = [
    `${dir}${distText}「${req.poiName}」が見えてきましたよ。${req.poiSubType}として地元でも人気のスポットです。ドライブの途中にぜひ覚えておいてくださいね。`,
    `さて、${dir}${distText}見えるのが「${req.poiName}」です。この辺りは歴史ある場所で、散策するのにもぴったりですよ。次の休憩ポイントの候補にいかがでしょうか。`,
    `${dir}${distText}「${req.poiName}」がありますね。${req.poiSubType}として知られるこの場所、実は隠れた名所なんですよ。お時間があればぜひ立ち寄ってみてください。`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

export async function generateNarration(req: NarrateRequest): Promise<string> {
  // Demo mode: return mock narration if no API key
  if (!isApiKeySet()) {
    console.log('[DEMO MODE] Generating mock narration for:', req.poiName);
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateDemoNarration(req);
  }

  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserMessage(req),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}
