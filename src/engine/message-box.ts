import {Deferred, defer} from "../lib/utils";

/**
 * Represents a multi-producer single-consumer message queue capable of receiving any type of messages, and passes
 * them over to the listener.
 * 
 * The order of the messages will be retained.
 */
export interface MessageBox {
  /**
   * Sends a message to the queue
   * 
   * @param msg the messages
   */
  send(msg: any): void;

  /**
   * Receives the first unhandled message from the queue
   */
  receive(): Promise<any>;

  /**
   * Resets the queue, emptying it and resolving any pending `receive()` calls with `undefined`
   */
  reset(): void;
}

/**
 * Creates a generic message box
 */
export function createMessageBox(): MessageBox {
  let messages: any[] = [];
  let waitUntilNonEmpty: Deferred<any> = defer();
  return {
    send: msg => {
      messages.push(msg);
      waitUntilNonEmpty.resolve();
    },

    receive: async () => {
      await waitUntilNonEmpty.promise;
      waitUntilNonEmpty = defer();
      if (messages.length < 1) {
        return;
      }

      const msg = messages.splice(0, 1)[0];
      if (messages.length > 0) {
        waitUntilNonEmpty.resolve();
      }
      return msg;
    },

    reset: () => {
      messages = [];
      waitUntilNonEmpty.resolve();
    }
  };
}
