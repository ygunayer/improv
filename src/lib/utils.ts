import {ActorId} from '../engine/actor';

const generateNanoid = require('nanoid/generate');

export interface Deferred<T> {
  resolve(value?: T | PromiseLike<T>): void;
  reject(err: Error): void;
  promise: Promise<T>;
}

/**
 * Creates a resolvable/rejectable promise container
 */
export function defer<T>(): Deferred<T> {
  let reject: (err: Error) => void;
  let resolve: (value?: T|PromiseLike<T>) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject
  };
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function randomId(): ActorId {
  return generateNanoid(ALPHABET, 16);
}
