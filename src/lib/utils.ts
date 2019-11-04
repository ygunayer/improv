import {Receive} from '../engine/types';
import {toPartialFunction} from '@ygunayer/patmat';
import {Case} from '@ygunayer/patmat/types';

const generateNanoid = require('nanoid/generate');

export interface Deferred<T> {
  resolve(value?: T | PromiseLike<T>): void;
  reject(err: Error): void;
  promise: Promise<T>;
}

export interface Cancellable<T> extends Promise<T> {
  cancel(): void;
}

export class Cancelled extends Error {
  constructor() {
    super('Operation was cancelled');
    Object.setPrototypeOf(this, Cancelled.prototype);
  }
}

export class TimedOut extends Error {
  constructor() {
    super('Operation has timed out');
    Object.setPrototypeOf(this, TimedOut.prototype);
  }
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

export function delay(duration: number): Cancellable<void> {
  const d = defer<void>();

  function cancel() {
    clearTimeout(timer); 
    d.reject(new Cancelled());
    timer = null;
  }

  let timer = setTimeout(() => d.resolve(), duration);
  const result = d.promise as any;
  result.cancel = cancel;
  return result;
}

export function timeout(duration: number): Cancellable<void> {
  const del = delay(duration);
  const def = defer<void>();

  del
    .then(() => def.reject(new TimedOut()))
    .catch(err => {
      if (err instanceof Cancelled) {
        def.resolve();
        return;
      }

      if (err instanceof TimedOut) {
        def.resolve();
        return;
      }

      def.reject(err);
    });

  const result = def.promise as any;
  result.cancel = del.cancel;
  return result;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
/**
 * Creates a random ID of the given length
 * 
 * @param size the length of the ID to create (default: 16)
 */
export function randomId(size: number = 16): string {
  return generateNanoid(ALPHABET, size);
}

export function toReceive(...cases: Case<any, void|PromiseLike<void>>[]): Receive {
  return toPartialFunction(cases);
}

export function awaitWithTimeout<T>(awaitable: PromiseLike<T>, duration: number): PromiseLike<T> {
  if (duration < 1 || duration === Infinity) {
    return awaitable;
  }

  const timer = timeout(duration);
  return Promise.race([
    timer.then(() => awaitable),
    awaitable.then(result => { timer.cancel(); return result; })
  ]);
}
