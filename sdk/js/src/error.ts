import type { OBPProblem } from "./types.js";

export class OBPError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly detail?: string;
  public readonly instance?: string;

  constructor(problem: OBPProblem) {
    super(problem.title);
    this.name = "OBPError";
    this.status = problem.status;
    this.type = problem.type;
    this.detail = problem.detail;
    this.instance = problem.instance;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isConflict(): boolean {
    return this.status === 409;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}
