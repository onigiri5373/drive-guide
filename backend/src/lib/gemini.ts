import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt.js';
import type { NarrateRequest } from '../types/index.js';

let genAI: GoogleGenerativeAI | null = null;

export function isApiKeySet(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'your-gemini-api-key-here' && key.length > 10;
}

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

const directionText: Record<string, string> = {
  left: '左手をご覧ください。',
  right: '右手をご覧ください。',
  ahead: '正面に見えてまいりました。',
  behind: '今通り過ぎたところに',
};

const subTypeLabels: Record<string, string> = {
  attraction: '観光スポット',
  museum: '博物館',
  viewpoint: '展望スポット',
  artwork: 'アート作品',
  information: '観光案内所',
  hotel: 'ホテル',
  castle: 'お城',
  monument: '記念碑',
  memorial: '記念碑',
  ruins: '遺跡',
  archaeological_site: '遺跡',
  shrine: '神社',
  temple: 'お寺',
  church: '教会',
  peak: '山頂',
  cliff: '崖',
  beach: 'ビーチ',
  hot_spring: '温泉',
  park: '公園',
  garden: '庭園',
};

function getSubTypeLabel(subType: string): string {
  return subTypeLabels[subType] || subType;
}

function generateDemoNarration(req: NarrateRequest): string {
  const dir = directionText[req.direction] || '';
  const distText = req.distance < 500 ? 'すぐそこに' : `約${Math.round(req.distance)}m先に`;
  const typeLabel = getSubTypeLabel(req.poiSubType);

  const templates = [
    `${dir}${distText}「${req.poiName}」が見えてきましたよ。${typeLabel}として地元でも人気のスポットです。ドライブの途中にぜひ覚えておいてくださいね。`,
    `さて、${dir}${distText}見えるのが「${req.poiName}」です。この辺りは歴史ある場所で、散策するのにもぴったりですよ。次の休憩ポイントの候補にいかがでしょうか。`,
    `${dir}${distText}「${req.poiName}」がありますね。${typeLabel}として知られるこの場所、実は隠れた名所なんですよ。お時間があればぜひ立ち寄ってみてください。`,
    `おっ、${dir}${distText}「${req.poiName}」がありますよ！ここは${typeLabel}で、知る人ぞ知る穴場スポットなんです。写真映えもするので、機会があればぜひ寄ってみてくださいね。`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// Circuit breaker: skip API calls for a period after consecutive failures
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_BREAKER_THRESHOLD = 2; // Open circuit after 2 failures
const CIRCUIT_BREAKER_COOLDOWN = 5 * 60_000; // Skip API for 5 minutes

export async function generateNarration(req: NarrateRequest): Promise<string> {
  // Demo mode: return mock narration if no API key
  if (!isApiKeySet()) {
    console.log('[DEMO MODE] Generating mock narration for:', req.poiName);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateDemoNarration(req);
  }

  // Circuit breaker: skip API if recently failing
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && Date.now() < circuitOpenUntil) {
    console.log('[Gemini] Circuit open - using demo narration (API quota exhausted)');
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateDemoNarration(req);
  }

  try {
    const ai = getClient();
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(buildUserMessage(req));
    const text = result.response.text();

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    // Success - reset circuit breaker
    consecutiveFailures = 0;
    console.log('[Gemini] Narration generated successfully for:', req.poiName);
    return text;
  } catch (err: any) {
    consecutiveFailures++;
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
    console.warn(`[Gemini] API failed (${consecutiveFailures}x), falling back to demo:`, err.message?.slice(0, 100) || err);
    return generateDemoNarration(req);
  }
}
