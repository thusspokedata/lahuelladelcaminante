/**
 * Custom error classes for authentication and authorization
 */

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserNotActiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotActiveError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
