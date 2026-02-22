import type { NarrationRequest, NarrationResponse } from '../types/guide';
import { API_BASE_URL } from '../constants';

export async function requestNarration(
  params: NarrationRequest
): Promise<NarrationResponse> {
  const response = await fetch(`${API_BASE_URL}/narrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(`Narration API error: ${response.status} - ${text}`);
  }

  return response.json();
}
