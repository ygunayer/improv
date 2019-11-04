import {ExecutionContext} from './generic';
import {PartialFunction} from '@ygunayer/patmat/lib/partial-function';
import {SupervisionStrategy} from './supervision';

/**
 * Represents a listener function that gets executed when something is shutdown with an arbitrary reason
 */
export type ShutdownListener = (reason: any) => any;

/**
 * Represents the receive block of an actor
 */
export type Receive = PartialFunction<any, void|PromiseLike<void>>;

/**
 * Represents the arguments that can be used to spawn an actor
 */
export type ActorSpawnArgs = ActorProps | ((context: ActorContext) => ActorProps);

/**
 * Represents the path to an actor
 */
export interface ActorPath {
  /**
   * A globally unique ID that represents the actor
   */
  uid(): string

  /**
   * The name of this path node. Must be unique among the children of the same parent node
   */
  name(): string;

  /**
   * The parent of this node
   */
  parent(): ActorPath;

  /**
   * The root path that this node stems from
   */
  root(): ActorPath;

  /**
   * Returns the child path with the given name. If no such child is found, returns `null` instead
   * 
   * @param name the name of the child to retrieve
   */
  get(name: string): null|ActorPath;

  /**
   * Converts the path into a string
   */
  toString(): string;
}

/**
 * Represents a reference to an actor
 */
export interface ActorRef {
  /**
   * The path from root actor of the system to this actor
   */
  path(): ActorPath;

  /**
   * Sends an anonymous message to the actor.
   * Note that this message uses the root `deadLetter` actor of the system as the sender.
   * 
   * @param msg the message to send
   */
  send(msg: any): void;

  /**
   * Sends a message to the actor using the given sender
   * 
   * @param msg the message to send
   * @param sender the sender of the message
   */
  tell(msg: any, sender: ActorRef): void;

  /**
   * Returns a promise that gets resolved when the actor replies to a message. While fundamentally contrarian to the actor
   * model's concurrency model, this method may particularly be useful in situations where the calling function is outside
   * the scope of an actor or actor system (e.g. when refactoring a codebase into an actor-based model).
   * 
   * Since the actors only handle one message at a time, and are stateful in nature, promises that are returned from this
   * method may never get resolved, so users are encouraged to provide a sensible (not too short, but not too long either)
   * timeout duration. Infinite durations are also discouraged for the same reasons.
   * 
   * If you find it difficult to come up with a duration, or you find yourself having to use the `ask()` method frequently
   * consider switching to a strictly actor-based model as soon as possible.
   * 
   * @param message the message to send to the actor
   * @param timeout the timeout duration
   */
  ask(message: any, timeout: number): Promise<any>;
}

/**
 * Represents the hooks that will be executed when a lifecycle event occurs for an actor
 */
export interface ActorLifecycleHooks {
  /**
   * Called before an actor is started
   */
  preStart?: () => void;

  /**
   * Called before an actor is restarted
   */
  preRestart?: () => void;

  /**
   * Called after an actor has restarted
   */
  postRestart?: () => void;

  /**
   * Called after an actor has stopped
   */
  postStop?: () => void;
}

/**
 * Represents the properties that define a certain actor
 */
export interface ActorProps {
  /**
   * The name of the actor to spawn. Must be unique among the children of the intended parent actor.
   * When not specified, a random string is used.
   */
  name?: string;

  /**
   * The supervisioning strategy of the actor.
   * When not specified, a one-for-one strategy is used
   */
  supervisionStrategy?: SupervisionStrategy;

  /**
   * The initial receive block of the actor. This behavior can later be changed by the actor through the become/unbecome
   * methods in the context
   */
  receive: Receive;

  /**
   * The default receive timeout in milliseconds (default: Infinity)
   */
  receiveTimeout?: number;

  /**
   * Optional hooks that will be executed when a lifecycle event occurs for an actor
   */
  hooks?: ActorLifecycleHooks;
}

/**
 * Represents an actor system
 */
export interface ActorSystem {
  /**
   * The name of the system
   */
  name(): String;

  /**
   * Spawns an actor with the given spec and returns a reference to it.
   * The spawned actor will become the child of the root `user` actor of the system
   * 
   * @param args the arguments to spawn the actor with
   */
  spawn(args: ActorSpawnArgs): ActorRef;

  /**
   * Registers the given callback function to be executed when the system is being shut down
   * 
   * @param cb the callback function
   */
  onShutdown(cb: ShutdownListener): void;

  /**
   * Returns the default execution context used by the system
   */
  ec(): ExecutionContext;

  /**
   * Returns the dead letter actor of the system
   */
  deadLetter(): ActorRef;
}

/**
 * A proxy object for actors to retrieve contextual information and to take actions related to it
 */
export interface ActorContext {
  /**
   * The name of the actor
   */
  name(): string;

  /**
   * The full path of the actor
   */
  path(): ActorPath;

  /**
   * The system that the actor belongs to
   */
  system(): ActorSystem;

  /**
   * The reference to the actor
   */
  self(): ActorRef;

  /**
   * The reference to the parent of the actor
   */
  parent(): ActorRef;

  /**
   * References to the children of the actor
   */
  children(): ActorRef[];

  /**
   * The supervisioning strategy of the actor
   */
  supervisionStrategy(): SupervisionStrategy;

  /**
   * Instructs the scheduler to use with the given receive block for the next execution
   * 
   * @param receive the receive block of the behavior
   */
  become(receive: Receive): void;

  /**
   * Recursively stops the actor and its children with the given reason
   * 
   * @param reason the reason for the termination
   */
  stop(reason?: any): void;

  /**
   * Spawns an actor with the given spec and returns a reference to it.
   * The spawned actor will become the child of the owner of this context.
   * 
   * @param args the arguments to spawn the actor with
   */
  spawn(args: ActorSpawnArgs): ActorRef;

  /**
   * The reference to the sender of the current message
   */
  sender(): ActorRef;

  /**
   * Sends the given message to the given actor
   * 
   * @param message the message to send
   * @param receipient the reference of the actor to send the message to
   */
  send(receipient: ActorRef, message: any): void;

  /**
   * Sends a message to the sender of the message that's currently being handled
   * 
   * @param message the message to send
   */
  reply(message: any): void;

  /**
   * Returns the receive timeout that's currently in place
   */
  receiveTimeout(): number;

  /**
   * Sets the receive timeout in milliseconds. When timeout occurs, a `ReceiveTimeout` message will be sent to the actor
   * 
   * @param ms timeout in milliseconds
   */
  setReceiveTimeout(ms: number);
}
