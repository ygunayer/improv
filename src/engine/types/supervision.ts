import {PartialFunction} from '@ygunayer/patmat/lib/partial-function';

export enum FailureAction {
  
}

export interface SupervisionStrategyCreationOptions {
  maxRetries?: number;
  timeThreshold?: number;
}

/**
 * 
 */
export interface SupervisionStrategyOptions {
  maxRetries(): number;
  timeThreshold(): number;
}

/**
 * Represents a supervision strategy
 */
export interface SupervisionStrategy {
  options(): SupervisionStrategyOptions;
}
