// RFC 7807 Problem Details

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly type: string;
  readonly detail?: string;
  readonly extra?: Record<string, unknown>;

  constructor(
    status: number,
    type: string,
    title: string,
    detail?: string,
    extra?: Record<string, unknown>,
  ) {
    super(title);
    this.name = 'AppError';
    this.status = status;
    this.type = type;
    this.detail = detail;
    this.extra = extra;
  }

  toProblem(instance?: string): ProblemDetail {
    return {
      type: this.type,
      title: this.message,
      status: this.status,
      ...(this.detail && { detail: this.detail }),
      ...(instance && { instance }),
      ...this.extra,
    };
  }
}

const BASE = 'https://openbooking.example/errors';

export const Errors = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      404,
      `${BASE}/not-found`,
      `${resource} not found`,
      id ? `${resource} with id '${id}' does not exist` : undefined,
    ),

  conflict: (detail: string) =>
    new AppError(409, `${BASE}/conflict`, 'Conflict', detail),

  validationError: (detail: string, errors?: unknown) =>
    new AppError(422, `${BASE}/validation-error`, 'Validation Error', detail, {
      errors,
    }),

  unauthorized: (detail?: string) =>
    new AppError(401, `${BASE}/unauthorized`, 'Unauthorized', detail),

  forbidden: (detail?: string) =>
    new AppError(403, `${BASE}/forbidden`, 'Forbidden', detail),

  tooManyRequests: (detail?: string) =>
    new AppError(429, `${BASE}/too-many-requests`, 'Too Many Requests', detail),

  badRequest: (detail: string) =>
    new AppError(400, `${BASE}/bad-request`, 'Bad Request', detail),

  gone: (detail: string) =>
    new AppError(410, `${BASE}/gone`, 'Gone', detail),

  internal: (detail?: string) =>
    new AppError(500, `${BASE}/internal-error`, 'Internal Server Error', detail),
};
