import 'server-only';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('A variável de ambiente NEXT_PUBLIC_SUPABASE_URL não foi definida.');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('A variável de ambiente SUPABASE_SERVICE_ROLE_KEY não foi definida.');
}

const baseUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface SupabaseRequestOptions {
  method?: HttpMethod;
  searchParams?: Record<string, string>;
  body?: unknown;
  prefer?: string[];
}

function buildHeaders(hasBody: boolean, prefer?: string[]) {
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY!;
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  if (prefer && prefer.length > 0) {
    headers.Prefer = prefer.join(',');
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function supabaseRequest<T>(path: string, options: SupabaseRequestOptions = {}): Promise<T> {
  const { method = 'GET', searchParams, body, prefer } = options;
  const url = new URL(`${baseUrl}/${path}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: buildHeaders(body !== undefined, prefer),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;

    try {
      const error = await response.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null as T;
  }

  return (await response.json()) as T;
}
