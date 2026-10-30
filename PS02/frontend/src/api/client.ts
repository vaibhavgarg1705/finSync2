export interface ApiResponse<T> { data: T; meta: Record<string, unknown> }
export interface ApiError {
  error: { code: string; message: string; details?: unknown; requestId?: string }
}

export const ERROR_MESSAGES: Record<string, string> = {
  DUPLICATE_IMPORT: 'This file has already been imported.',
  PAYMENT_OVER_ALLOCATED: 'Payment amount exceeded by this allocation.',
  INVOICE_OVER_ALLOCATED: 'Invoice total exceeded by this allocation.',
  DUPLICATE_ALLOCATION: 'An active allocation already exists for this pair.',
  STALE_PREVIEW: 'Preview is stale — re-run impact preview.',
  IDEMPOTENCY_CLASH: 'Duplicate request detected.',
  VALIDATION_FAILED: 'Invalid input. Check the highlighted fields.',
  FORBIDDEN: 'You do not have permission for this action.',
}

class ApiClient {
  private token: string | null = null

  setToken(t: string | null) { this.token = t }

  private headers(idempotencyKey?: string): HeadersInit {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) h['Authorization'] = `Bearer ${this.token}`
    if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey
    return h
  }

  private async responseData<T>(res: Response): Promise<T> {
    const json = await res.json()
    if (!res.ok) {
      const err = json as ApiError
      const code = err.error?.code ?? 'UNKNOWN'
      throw new ApiClientError(
        code,
        ERROR_MESSAGES[code] ?? err.error?.message ?? 'Request failed',
        err.error?.details,
      )
    }
    return (json as ApiResponse<T>).data
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const res = await fetch(`/api/v1${path}`, {
      method,
      headers: this.headers(idempotencyKey),
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return this.responseData<T>(res)
  }

  get<T>(path: string) { return this.request<T>('GET', path) }
  post<T>(path: string, body?: unknown, idem?: string) { return this.request<T>('POST', path, body, idem) }
  put<T>(path: string, body?: unknown) { return this.request<T>('PUT', path, body) }

  async postForm<T>(path: string, body: FormData): Promise<T> {
    const headers: Record<string, string> = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    const res = await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers,
      body,
    })
    return this.responseData<T>(res)
  }
}

export class ApiClientError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message) }
}

export const api = new ApiClient()
