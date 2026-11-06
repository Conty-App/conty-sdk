export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface Clock {
  now(): number;
}

export type RandomId = () => string;

export interface Deps {
  fetch: Fetch;
  clock: Clock;
  randomId: RandomId;
}
