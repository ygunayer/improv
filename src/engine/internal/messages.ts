import {ActorRef} from '../types';
import {randomId} from '../../lib/utils';

export const Stop = Symbol();

export const Restart = Symbol();

/**
 * Represents a message of with both the sender and recipient is known
 */
export interface Envelope {
  /**
   * The correlation id. Useful for associating multiple messages with one another
   */
  correlationId: string;

  /**
   * The unique message id
   */
  messageId: string;

  /**
   * The message itself
   */
  message: any;

  /**
   * The sender of the message
   */
  sender: ActorRef;

  /**
   * The intended recipient of the message
   */
  recipient: ActorRef
}

export module Envelope {
  export interface EnvelopeCreateArgs {
    sender: ActorRef;
    recipient: ActorRef;
    message: any;
    correlationId?: string
  };

  export function create({sender, recipient, message, correlationId}: EnvelopeCreateArgs): Envelope {
    return {
      messageId: randomId(16),
      correlationId: correlationId || randomId(16),
      sender,
      recipient,
      message
    };
  }

  export function respondTo({envelope, message}: {envelope: Envelope, message: any}) {
    return create({
      sender: envelope.recipient,
      recipient: envelope.sender,
      correlationId: envelope.correlationId,
      message
    });
  }
}
