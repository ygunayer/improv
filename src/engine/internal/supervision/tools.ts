import {ActorRef} from '../../types';

/**
 * Represents a struct that can capture the failures of a specific actor, and return if the failures exceed the allowed limit
 */
export interface FailureCounter {
  /**
   * Captures a failure and returns whether or not the total number of failures exceed the given amount for the given
   * time range
   */
  capture(): boolean;

  /**
   * Returns the reference to the actor of which the failures are being counted
   */
  ref(): ActorRef;
}

/**
 * Creates a failure counter for the given actor
 * 
 * @param maxRetries 
 * @param threshold 
 * @param ref 
 */
export function failureCounter(ref: ActorRef, maxRetries: number, threshold: number): FailureCounter {
  let retries = 0;
  let captureTimeBegin = Infinity;
  return {
    capture: (): boolean => {
      retries++;
      captureTimeBegin = Math.min(Date.now(), captureTimeBegin);

      const elapsed = Date.now() - captureTimeBegin;

      // failure occured within the allowed time range
      // capture it and keep the window begin time intact
      if (elapsed <= threshold) {
        return retries <= maxRetries;
      }

      // failure did not occur within the allowed time range
      // reset counter and 
      captureTimeBegin = Date.now();
      retries = 1;
      return false;
    },

    ref: () => ref
  };
}
