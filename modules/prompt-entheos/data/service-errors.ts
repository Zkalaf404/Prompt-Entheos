export class ValidationError<TFieldErrors extends object = Record<string, string>> extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: TFieldErrors,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
