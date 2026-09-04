/** Standard envelope returned by the real backend for most endpoints. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Server-side paginated result. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
  }
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
