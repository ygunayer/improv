import {randomId} from '../lib/utils';
import {Scheduler, createScheduler} from './scheduler';
import {MessageBox, createMessageBox} from './message-box';
import Messages from './messages';
import {_, match, Types} from '@ygunayer/patmat';
import {ActorSystem} from './system';

/**
 * Represents the argument type of an actor handler
 */
export interface HandlerArgs {
  /**
   * The actor context
   */
  context: ActorContext;

  /**
   * The internal state of the actor
   */
  state: any
}

/**
 * Represents a function that can execute an actor behavior
 */
export type ActorHandler = (args: HandlerArgs) => void;

/**
 * Represents an actor ID
 */
export type ActorId = string;

/**
 * Represents an address to an actor
 */
export interface ActorAddress {
  /**
   * The unique ID of the actro
   */
  id(): ActorId;
}

/**
 * Represents a reference to an actor
 */
export interface ActorRef {
  /**
   * The actor address
   */
  addr(): ActorAddress;

  /**
   * Sends a message to an actor
   * 
   * @param msg the message to send
   */
  send(msg: any): void;
}

/**
 * A proxy object for actors to retrieve contextual information and to take actions related to it
 */
export interface ActorContext {
  /**
   * The system the actor is currently in
   */
  system(): ActorSystem;

  /**
   * The ref of this actor
   */
  self(): ActorRef;

  /**
   * The ref of this actor's parent
   */
  parent(): ActorRef;

  /**
   * Spawns an actor to handle the specified spec
   * 
   * @param handler the handler function
   * @param state the initial state (optional)
   */
  spawn(handler: ActorHandler, state?: any): ActorRef;

  /**
   * Receives the first unhandled message from the message box
   */
  receive<T>(...cases: Types.AsyncCase<any, T>[]): PromiseLike<T>;

  /**
   * Instructs the scheduler to continue with the specified handler and state on the next execution
   * 
   * @param fn the handler function
   * @param state the state
   */
  continueWith(fn: ActorHandler, state?: any): void;

  /**
   * Instructs the scheduler to repeat the last handler and state for the next execution
   */
  repeat(): void;

  /**
   * Instructs the scheduler to repeat the last handler with the given state for the next execution
   */
  repeatWithState(state: any): void;

  /**
   * Stops the actor with the specified reason
   * 
   * @param reason the reason for the termination
   */
  stop(reason?: any): void;
}

/**
 * Spawns a process that handles the given function.
 */
export function spawn(system: ActorSystem, parentRef: ActorRef, fn: ActorHandler, state?: any): ActorRef {
  const id: ActorId = randomId();
  const mbox: MessageBox = createMessageBox();

  const ref: ActorRef = {
    addr: () => ({
      id: () => id
    }),
    send: msg => mbox.send(msg)
  };

  const scheduler: Scheduler = createScheduler(err => {
    context.stop();
    parentRef && parentRef.send(Messages.Actor.Exited.Crashed(ref, err));
  });

  const context: ActorContext = {
    system: () => system,
    self: () => ref,
    parent: () => parentRef,
    stop: (reason: any = null) => {
      mbox.reset();
      scheduler.stop();
      parentRef && parentRef.send(reason || Messages.Actor.Exited.Normal(ref));
    },
    continueWith: (fn: ActorHandler, state: any) => scheduler.schedule(fn, state),
    repeat: () => scheduler.rescheduleLast(),
    repeatWithState: (state: any) => scheduler.rescheduleWithState(state),
    spawn: (fn: ActorHandler, state?: any) => spawn(system, ref, fn, state),
    receive: async <T>(...cases: Types.AsyncCase<any, T>[]|Types.SyncCase<any, T>): Promise<T> => {
      const msg = await mbox.receive();
      return match<any, T>(msg).case(...cases);
    }
  };

  scheduler.schedule(fn, state);
  scheduler.execute(context);

  return ref;
}
