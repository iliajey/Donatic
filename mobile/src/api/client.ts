/**
 * Typed fetch wrapper.
 *
 * Base URL resolution:
 *  1. `EXPO_PUBLIC_API_URL` (inlined by babel-preset-expo at bundle time).
 *  2. Safe local-development default `http://127.0.0.1:8000`.
 *
 * On a physical device `localhost`/`127.0.0.1` points at the device itself,
 * so set `EXPO_PUBLIC_API_URL=http://<dev-machine-LAN-IP>:8000` and rebuild.
 */
export const DEFAULT_DEV_API_URL = 'http://127.0.0.1:8000';

function baseUrl(): string {
  let fromEnv: string | undefined;
  if (typeof process !== 'undefined' && process.env) {
    fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  }
  const cleaned = (fromEnv ?? '').trim().replace(/\/$/, '');
  return cleaned || DEFAULT_DEV_API_URL;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export class ApiRequestError extends Error {
  code: string;
  status?: number;
  constructor(err: ApiError) {
    super(err.message);
    this.name = 'ApiRequestError';
    this.code = err.code;
    this.status = err.status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = baseUrl();
  const url = base ? `${base}${path}` : path;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (e) {
    throw new ApiRequestError({
      code: 'NETWORK_ERROR',
      message: e instanceof Error ? e.message : 'Network request failed',
    });
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      if (typeof body?.message === 'string') message = body.message;
    } catch {
      // keep default message
    }
    throw new ApiRequestError({ code: 'HTTP_ERROR', message, status: res.status });
  }
  return (await res.json()) as T;
}

export const api = { fetch: apiFetch, baseUrl };
