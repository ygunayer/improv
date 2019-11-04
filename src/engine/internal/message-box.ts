import {Deferred, defer} from '../../lib/utils';

export class MessageBoxStopped extends Error {
  constructor() {
    super('Mailbox is stopped');
    Object.setPrototypeOf(this, MessageBoxStopped.prototype);
  }
}

export class MessageBoxPaused extends Error {
  constructor() {
    super('Mailbox is paused');
    Object.setPrototypeOf(this, MessageBoxPaused.prototype);
  }
}

/**
 * Represents a multi-producer single-consumer message queue capable of receiving any type of messages, and passes
 * them over to the listener.
 * 
 * The order of the messages will be retained in a FIFO manner.
 */
export interface MessageBox<T> {
  /**
   * Pushes a message to the queue
   * 
   * @param msg the messages
   */
  push(msg: T): void;

  /**
   * Pops the first unhandled message from the queue
   */
  pop(): Promise<T>;

  /**
   * Stops the message box and empties it. Any messages that were in the mailbox will be returned
   */
  stop(): T[];

  /**
   * Pauses the mailbox, causing all recipients to wait until the mailbox is resumed.
   * Messages can still be pushed to the mailbox while it's paused
   */
  pause(): void;

  /**
   * Resumes the mailbox, causing any pending `receive`s to be resolved immediately
   */
  resume(): void;

  /**
   * Inserts the message as the first element of the queue
   * 
   * @param message the message to insert
   */
  unshift(message: T): void;
}

/**
 * Creates an unbounded message box implementation
 */
export function createMessageBox<T>(): MessageBox<T> {
  let messages: T[] = [];
  let waitUntilNonEmpty: Deferred<any> = defer();
  let waitUntilResumed: Deferred<any> = defer();
  let isPaused = false;
  let isStopped = false;

  function push(msg: T) {
    if (isStopped) return;

    messages.push(msg);

    if (!isPaused) {
      waitUntilNonEmpty.resolve();
    }
  }

  function unshift(message: T) {
    if (isStopped) return;

    messages.unshift(message);

    if (!isPaused) {
      waitUntilNonEmpty.resolve();
    }
  }

  async function pop() {
    // this promise is rejected when the message box is paused
    await waitUntilResumed.promise;

    // this promise is rejected when the message box is stopped
    await waitUntilNonEmpty.promise;

    if (messages.length < 1) {
      waitUntilNonEmpty = defer();
      return pop();
    }

    const msg = messages.splice(0, 1)[0];
    if (messages.length > 0) {
      waitUntilNonEmpty.resolve();
    }

    return msg;
  }

  function stop() {
    if (isStopped) return;

    const oldMessages = [].concat(messages);
    const oldWait = waitUntilNonEmpty;

    messages = [];
    waitUntilNonEmpty = defer();

    oldWait.reject(new MessageBoxStopped());
    return oldMessages;
  }

  function resume() {
    if (!isPaused) return;

    isPaused = false;
    waitUntilResumed.resolve();

    if (messages.length > 0) {
      waitUntilNonEmpty.resolve();
    }
  }

  function pause() {
    if (isPaused) return;

    isPaused = true;
    const oldWait = waitUntilResumed;
    waitUntilResumed = defer();
    oldWait.reject(new MessageBoxPaused());
  }

  waitUntilResumed.resolve();

  return {push, pop, resume, stop, pause, unshift};
}
