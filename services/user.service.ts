

const BASE: string = '';

/** * Utility Types to handle the transformation logic 
 */
type Normalized<T> = T extends Array<infer U>
  ? Normalized<U>[]
  : T extends object
  ? { [K in keyof T]: K extends '_id' ? string : Normalized<T[K]> } & { id?: string }
  : T;

/** * Helper to get token (Assumed implementation) 
 */
const getToken = (): string | null => localStorage.getItem('token');

/** * Normalize MongoDB _id → id recursively 
 */
export function norm<T>(data: T): Normalized<T> {
  if (Array.isArray(data)) {
    return data.map(norm) as any;
  }

  if (data && typeof data === 'object') {
    const out = { ...data } as any;

    // Standard ID normalization
    if (out._id !== undefined && out.id === undefined) {
      out.id = String(out._id);
    }

    // JobID Specific Logic
    if (out.jobId && typeof out.jobId === 'object') {
      out.jobIdObj = norm(out.jobId);
      out.jobId = String(out.jobId._id || out.jobId.id || '');
    } else if (out.jobId) {
      out.jobId = String(out.jobId);
    }

    // Recursively normalize other object properties
    Object.keys(out).forEach(key => {
      if (out[key] && typeof out[key] === 'object' && key !== 'jobIdObj') {
        out[key] = norm(out[key]);
      }
    });

    return out;
  }

  return data as any;
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(BASE + path, { ...options, headers });
  
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string)             => apiFetch<T>(path),
  post:   <T>(path: string, body: any)  => apiFetch<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: any)  => apiFetch<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: any)  => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)             => apiFetch<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const res = await fetch(BASE + path, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data as T;
  },
};