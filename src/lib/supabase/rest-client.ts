export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseClientOptions {
  fetch?: typeof fetch;
}

export interface UpsertOptions {
  onConflict?: string;
}

interface SupabaseConfig {
  url: string;
  key: string;
  fetch: typeof fetch;
}

const encodeFilterValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
};

const encodeInValue = (value: string | number): string => {
  if (typeof value === "number") {
    return String(value);
  }

  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

const normalizeError = (payload: any, response: Response): SupabaseError => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : response.statusText;
    const details = typeof record.details === "string" ? record.details : undefined;
    const hint = typeof record.hint === "string" ? record.hint : undefined;
    const code = typeof record.code === "string" ? record.code : undefined;

    return {
      message,
      details,
      hint,
      code,
      status: response.status,
    };
  }

  return {
    message: response.statusText || "Request failed",
    status: response.status,
  };
};

const appendHeaderValue = (headers: Map<string, string>, name: string, value: string) => {
  const current = headers.get(name);
  headers.set(name, current ? `${current},${value}` : value);
};

class SupabaseQueryBuilder<T> implements PromiseLike<SupabaseResponse<T>> {
  private method: string = "GET";
  private body?: string;
  private headers = new Map<string, string>();
  private queryParams = new URLSearchParams();
  private expect: "single" | "maybe" | null = null;

  constructor(private readonly config: SupabaseConfig, private readonly table: string) {}

  select(columns: string) {
    if (this.method === "GET") {
      this.method = "GET";
    }

    this.queryParams.set("select", columns);
    return this as SupabaseQueryBuilder<T>;
  }

  insert(values: unknown) {
    this.method = "POST";
    this.setBody(values);
    appendHeaderValue(this.headers, "Prefer", "return=representation");
    return this as SupabaseQueryBuilder<T>;
  }

  upsert(values: unknown, options?: UpsertOptions) {
    this.method = "POST";
    this.setBody(values);
    appendHeaderValue(this.headers, "Prefer", "return=representation");
    appendHeaderValue(this.headers, "Prefer", "resolution=merge-duplicates");

    if (options?.onConflict) {
      this.queryParams.set("on_conflict", options.onConflict);
    }

    return this as SupabaseQueryBuilder<T>;
  }

  update(values: unknown) {
    this.method = "PATCH";
    this.setBody(values);
    appendHeaderValue(this.headers, "Prefer", "return=representation");
    return this as SupabaseQueryBuilder<T>;
  }

  delete() {
    this.method = "DELETE";
    appendHeaderValue(this.headers, "Prefer", "return=representation");
    return this as SupabaseQueryBuilder<T>;
  }

  eq(column: string, value: unknown) {
    this.queryParams.append(column, `eq.${encodeFilterValue(value)}`);
    return this as SupabaseQueryBuilder<T>;
  }

  in(column: string, values: (string | number)[]) {
    const formatted = values.map((value) => encodeInValue(value)).join(",");
    this.queryParams.append(column, `in.(${formatted})`);
    return this as SupabaseQueryBuilder<T>;
  }

  maybeSingle() {
    this.expect = "maybe";
    this.queryParams.set("limit", "1");
    return this as SupabaseQueryBuilder<T>;
  }

  single() {
    this.expect = "single";
    this.queryParams.set("limit", "1");
    return this as SupabaseQueryBuilder<T>;
  }

  async execute(): Promise<SupabaseResponse<T>> {
    const url = new URL(`${this.config.url}/rest/v1/${this.table}`);
    this.queryParams.forEach((value, key) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const headers: Record<string, string> = {
      apikey: this.config.key,
      Authorization: `Bearer ${this.config.key}`,
    };

    this.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (this.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await this.config.fetch(url.toString(), {
      method: this.method,
      headers,
      body: this.body,
    });

    const text = await response.text();
    const payload = text ? safeParseJson(text) : null;

    if (!response.ok) {
      return {
        data: null,
        error: normalizeError(payload, response),
      };
    }

    if (this.expect) {
      if (Array.isArray(payload)) {
        if (payload.length === 0) {
          if (this.expect === "single") {
            return {
              data: null,
              error: {
                message: "No rows returned",
                status: response.status,
              },
            };
          }

          return { data: null, error: null };
        }

        const [first, ...rest] = payload;

        if (this.expect === "single" && rest.length > 0) {
          return {
            data: null,
            error: {
              message: "Multiple rows returned",
              status: response.status,
            },
          };
        }

        return { data: first as T, error: null };
      }

      if (payload === null || payload === undefined) {
        if (this.expect === "single") {
          return {
            data: null,
            error: {
              message: "No rows returned",
              status: response.status,
            },
          };
        }

        return { data: null, error: null };
      }

      return { data: payload as T, error: null };
    }

    return {
      data: (payload as T) ?? null,
      error: null,
    };
  }

  then<TResult1 = SupabaseResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private setBody(value: unknown) {
    this.body = JSON.stringify(value);
    this.headers.set("Content-Type", "application/json");
  }
}

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

class SupabaseRestClient {
  constructor(private readonly config: SupabaseConfig) {}

  from<T = any>(table: string): SupabaseQueryBuilder<T> {
    return new SupabaseQueryBuilder<T>(this.config, table);
  }
}

export type SupabaseClient = SupabaseRestClient;

export const createClient = (
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions,
): SupabaseClient => {
  const fetcher = options?.fetch ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    throw new Error("A fetch implementation is required to use the Supabase client.");
  }

  return new SupabaseRestClient({
    url: supabaseUrl.replace(/\/$/, ""),
    key: supabaseKey,
    fetch: fetcher.bind(globalThis),
  });
};
