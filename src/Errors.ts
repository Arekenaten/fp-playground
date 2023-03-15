export class ParseError extends Error {
  readonly _tag = 'ParseError';

  public constructor(message = '') {
    super(message);
  }
}

export class NetworkError extends Error {
  readonly _tag = 'NetworkError';

  public constructor(message = '') {
    super(message);
  }
}
