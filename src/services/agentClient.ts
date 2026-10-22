import { HealthStatus, TemplateType } from '../types';
import { TEMPLATES } from './schemas';

export interface StreamCallbacks {
  onStarted?: (runId: string) => void;
  onStream?: (streamingUrl: string) => void;
  onProgress?: (purpose: string, timestamp: number) => void;
  onHeartbeat?: () => void;
  onComplete?: (status: string, result: any, error?: any) => void;
  onError?: (err: { code: string; message: string }) => void;
}

function getRequestHeaders(tinyFishApiKey?: string, accessCode?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (tinyFishApiKey && tinyFishApiKey.trim()) {
    headers['x-tinyfish-key'] = tinyFishApiKey.trim();
  }
  if (accessCode && accessCode.trim()) {
    headers['x-access-code'] = accessCode.trim();
  }
  return headers;
}

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return { tinyfishServerKey: false, llm: 'none', accessCodeRequired: false };
  }
}

export async function testTinyFishConnection(
  tinyFishApiKey: string,
  accessCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/agent/test-connection', {
      method: 'POST',
      headers: getRequestHeaders(tinyFishApiKey, accessCode),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error?.message || 'Connection test failed' };
    }
    return { success: true, message: data.message || 'Connected successfully to TinyFish!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while testing connection' };
  }
}

export async function cancelAgentRun(
  runId: string,
  tinyFishApiKey: string,
  accessCode: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/agent/cancel', {
      method: 'POST',
      headers: getRequestHeaders(tinyFishApiKey, accessCode),
      body: JSON.stringify({ runId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runAgentStream(
  params: {
    url: string;
    goal: string;
    template: TemplateType;
    stealth: boolean;
    tinyFishApiKey: string;
    accessCode: string;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const templateMeta = TEMPLATES[params.template] || TEMPLATES.custom;
  const schema = templateMeta.schema;

  let response: Response;
  try {
    response = await fetch('/api/agent/stream', {
      method: 'POST',
      headers: getRequestHeaders(params.tinyFishApiKey, params.accessCode),
      body: JSON.stringify({
        url: params.url,
        goal: params.goal,
        schema,
        stealth: params.stealth,
      }),
      signal,
    });
  } catch (netErr: any) {
    if (signal?.aborted) return;
    callbacks.onError?.({ code: 'NETWORK_ERROR', message: netErr.message || 'Could not connect to server' });
    return;
  }

  if (!response.ok) {
    try {
      const errJson = await response.json();
      callbacks.onError?.(errJson.error || { code: 'HTTP_ERROR', message: `Server error ${response.status}` });
    } catch {
      callbacks.onError?.({ code: 'HTTP_ERROR', message: `Server returned error ${response.status}` });
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.({ code: 'STREAM_ERROR', message: 'Unable to open response stream' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          processClientBlock(buffer);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        processClientBlock(part);
      }
    }

    function processClientBlock(part: string) {
      if (!part.trim()) return;
      const lines = part.split(/\r?\n/);
      let currentEvent = 'message';
      const dataLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          dataLines.push(trimmed.slice(5).trim());
        }
      }

      if (dataLines.length === 0) return;

      const rawData = dataLines.join('\n');
      let parsed: any;
      try {
        parsed = JSON.parse(rawData);
      } catch {
        parsed = { message: rawData };
      }

      if (currentEvent === 'started' || parsed.run_id) {
        callbacks.onStarted?.(parsed.run_id);
      } else if (currentEvent === 'stream' || parsed.streaming_url) {
        callbacks.onStream?.(parsed.streaming_url);
      } else if (currentEvent === 'progress' || parsed.purpose) {
        callbacks.onProgress?.(parsed.purpose, parsed.timestamp || Date.now());
      } else if (currentEvent === 'heartbeat') {
        callbacks.onHeartbeat?.();
      } else if (
        currentEvent === 'complete' ||
        parsed.status === 'COMPLETED' ||
        parsed.status === 'FAILED' ||
        parsed.result !== undefined ||
        parsed.items !== undefined
      ) {
        const resultData =
          parsed.result !== undefined
            ? parsed.result
            : parsed.items !== undefined
            ? { items: parsed.items }
            : parsed;
        callbacks.onComplete?.(
          parsed.status || (resultData ? 'COMPLETED' : 'FAILED'),
          resultData,
          parsed.error
        );
      } else if (currentEvent === 'error' || parsed.code || parsed.error) {
        const errObj = parsed.error || parsed;
        callbacks.onError?.({
          code: errObj.code || 'ERROR',
          message: errObj.message || 'Agent encountered an error',
        });
      }
    }
  } catch (err: any) {
    if (!signal?.aborted) {
      callbacks.onError?.({ code: 'STREAM_ABORTED', message: err.message || 'Stream processing failed' });
    }
  }
}

export async function parseNaturalWatch(
  text: string,
  tinyFishApiKey: string,
  accessCode: string
): Promise<any> {
  const res = await fetch('/api/ai/parse-watch', {
    method: 'POST',
    headers: getRequestHeaders(tinyFishApiKey, accessCode),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to parse tracker instructions');
  }
  return await res.json();
}

export async function scoreWatchItems(
  params: {
    profile: string;
    goal: string;
    items: Array<{ key: string; text: string }>;
  },
  tinyFishApiKey: string,
  accessCode: string
): Promise<Array<{ key: string; score: number; reason: string }>> {
  try {
    const res = await fetch('/api/ai/score', {
      method: 'POST',
      headers: getRequestHeaders(tinyFishApiKey, accessCode),
      body: JSON.stringify(params),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.scores) ? data.scores : [];
  } catch {
    return [];
  }
}
