import {Task, ExecutionContext} from '../types/generic';
import createLogger from '../../lib/logger';

/**
 * Creates an execution context that uses the appropriate scheduling mechanism for the environment that it's invoked in.
 * 
 * On node, uses `process.nextTick`. On browsers, uses `setTimeout` with a timeout of 0ms instead
 */
function createDefault(): ExecutionContext {
  const logger = createLogger('execution-context:default');
  return {
    submit: (task: Task) => {
      process.nextTick(async () => {
        try { await task(); }
        catch (err) {
          logger.warn('Execution failed', err);
        }
      });
    }
  };
}

export const Default: ExecutionContext = createDefault();
