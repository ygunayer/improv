import {PartialFunction} from '@ygunayer/patmat/lib/partial-function';

/**
 * An enumeration of actions that a supervisor can decide to take when a child fails
 */
export enum Decision {
  /**
   * Resumes message processing for the failing actor, essentially ignoring the failure
   */
  Resume,

  /**
   * Restarts the failing actor and resumes message processing from where it was left off
   */
  Restart,

  /**
   * Stops the actor
   */
  Stop,

  /**
   * Escalates the failure upwards in the hierarchy, essentially rethrowing the error
   */
  Escalate
};

/**
 * Represents a set of options that a supervision strategy can be built from
 */
export interface SupervisionStrategyOptions {
  /**
   * The number of restarts an actor is allowed to go through.
   */
  maxRetries?: number;

  /**
   * Time window in milliseconds to accumulate the failure count of an actor
   */
  timeThreshold?: number;
}

/**
 * Represents a supervision strategy
 */
export interface SupervisionStrategy {
  /**
   * Returns the options the strategy was initialized with
   */
  options(): SupervisionStrategyOptions;

  decide(reason: any): Decision
}

/**
 * A partial function type that can be used to determine what action to take when a certain kind of failure occurs
 */
export type Decider = PartialFunction<any, Decision>;

/**
 * A constant that contains the default options for individual strategies
 */
export const DefaultOptions = {
  OneForOne: () => ({
    maxRetries: 5,
    timeThreshold: 10000
  })
};

/**
 * Implements a one-for-one supervisioning strategy, meaning that when a child actor fails, only that actor and its
 * descendants are restarted or stopped.
 * 
 * @param options the supervisioning options
 */
export function oneForOneStrategy(options?: SupervisionStrategyOptions): SupervisionStrategy {
  const solidOptions = Object.assign({}, DefaultOptions.OneForOne(), options || {});
  return {
    options: () => solidOptions
  };
};
