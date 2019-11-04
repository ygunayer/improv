import {ActorRef} from '../types';

export enum ExitNature {
  Normal,
  Crashed,
  Killed
}

/**
 * A predefined message that signals that an actor has exited with an arbitrary reason
 */
export class Exited { constructor(readonly ref: ActorRef, readonly nature: string|ExitNature, readonly reason?: any) {} }

export module Exited {
  /**
   * A shortcut method to create an `Exited` message with the `Normal` nature, which states that the actor has exited
   * normally and should not be considered as failed
   * 
   * @param ref the reference of the actor that has exited
   * @param reason the reason the actor has exited (optional)
   */
  export function Normal(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Normal, reason); }

  /**
   * A shortcut method to create an `Exited` message with the `Crashed` nature, which states that the actor has crashed
   * while handling a message, ans therefore should be considered as failed
   * 
   * @param ref 
   * @param reason 
   */
  export function Crashed(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Crashed, reason); }

  /**
   * A shortcut method to create an `Exited` message with the `Killed` nature, which states that the actor was stopped
   * due to supervisioning rules, and should not be considered as failed
   * 
   * @param ref 
   * @param reason 
   */
  export function Killed(ref: ActorRef, reason?: any): Exited { return new Exited(ref, ExitNature.Killed, reason); }
}

/**
 * A predefined message that 
 */
export const Kill = Symbol();

export const Stop = Symbol();

export class Identify { constructor(readonly messageId?: any) {} }

export class Identity { constructor(readonly ref: ActorRef, readonly messageId?: any) {} }

export class ReceiveTimeout { constructor(readonly duration: number) {} }
