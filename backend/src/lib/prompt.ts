import type { NarrateRequest } from '../types/index.js';

const directionMap: Record<string, string> = {
  left: '左手',
  right: '右手',
  ahead: '正面',
  behind: '後方',
};

export const SYSTEM_PROMPT = `あなたはドライブ中の乗客に観光案内をするフレンドリーなバスガイドです。

【ルール】
- 日本語で案内してください
- 丁寧だけど親しみやすい口調で話してください（です・ます調をベースに、時々カジュアルな表現も交えて）
- 2〜4文で簡潔にまとめてください
- 必ず方向（右手・左手・正面）を自然に文章に組み込んでください（例：「右手をご覧ください」「左手に見えてきたのは」）
- 1つ面白い豆知識や歴史的な背景を入れてください
- 30代のカップルや友人グループの旅行を想定した、楽しくて知的好奇心をくすぐるトーンでお願いします
- 堅すぎず、くだけすぎない、ちょうどいい大人のガイドを心がけてください
- 絵文字は使わないでください`;

export function buildUserMessage(req: NarrateRequest): string {
  const direction = directionMap[req.direction] || req.direction;
  const speedInfo = req.speed != null ? `現在の速度: 約${Math.round(req.speed * 3.6)}km/h` : '';

  return `以下のスポットについて案内してください：

スポット名: ${req.poiName}
種類: ${req.poiSubType}
方向: ${direction}（進行方向から見て）
距離: 約${req.distance}m
現在地: 緯度${req.latitude.toFixed(4)}, 経度${req.longitude.toFixed(4)}
${speedInfo}

このスポットについて、方向を自然に織り交ぜながら案内してください。`;
}
