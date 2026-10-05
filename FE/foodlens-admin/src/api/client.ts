const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Không xử lý được yêu cầu.';
async function send<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`${BASE}${path}`, { ...options, credentials: 'include' }); }
  catch { throw new ApiError(0, 'Không kết nối được backend. Kiểm tra Spring Boot và địa chỉ API.'); }
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = undefined; }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('foodlens:unauthorized'));
    const message = typeof data === 'object' && data && 'message' in data ? String(data.message) : `Yêu cầu thất bại (${response.status})`;
    throw new ApiError(response.status, message);
  }
  if (text && data === undefined) throw new ApiError(response.status, 'API không trả JSON. Kiểm tra cấu hình /api proxy.');
  return data as T;
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers = new Headers();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Lấy token theo cookie hiện tại; không lưu token cũ qua login/logout.
    const csrf = await send<{ headerName: string; token: string }>('/auth/csrf');
    headers.set(csrf.headerName, csrf.token);
  }
  let payload: BodyInit | undefined;
  if (body instanceof FormData || body instanceof URLSearchParams) payload = body;
  else if (body !== undefined) { headers.set('Content-Type', 'application/json'); payload = JSON.stringify(body); }
  return send<T>(path, { method, headers, body: payload });
}
