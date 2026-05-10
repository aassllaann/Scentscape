/**
 * Server-side fetch wrapper that respects HTTPS_PROXY / HTTP_PROXY env vars.
 * Use this instead of global fetch in API routes that call external services.
 *
 * Configure in .env.local:
 *   HTTPS_PROXY=http://127.0.0.1:7890
 */
import { fetch as undiciFetch, ProxyAgent, Agent } from 'undici';

let _dispatcher: ProxyAgent | Agent | undefined;

function getDispatcher(): ProxyAgent | Agent | undefined {
  if (_dispatcher !== undefined) return _dispatcher;
  const proxy =
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    process.env.https_proxy ??
    process.env.http_proxy;
  _dispatcher = proxy ? new ProxyAgent(proxy) : new Agent({ connectTimeout: 30_000 });
  return _dispatcher;
}

export async function proxyFetch(url: string, init: RequestInit = {}): Promise<Response> {
  // undici's fetch accepts `dispatcher` in its options
  return undiciFetch(url, {
    ...(init as Parameters<typeof undiciFetch>[1]),
    dispatcher: getDispatcher(),
  }) as unknown as Response;
}
