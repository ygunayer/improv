import {ActorContext, ActorHandler} from './actor';

/**
 * Represents the callback type for scheduler terminations that stem from failed executions
 */
type TerminationCallback = (reason: any) => void;

/**
 * Represents a scheduler that allows queueing up functions with arguments and executes them continuously.
 * The context provided in the first execution from outside will be passed along with the actor's state in each
 * each consecutive execution.
 */
export interface Scheduler {
  /**
   * Schedules a function for execution with the given state
   */
  schedule(fn: ActorHandler, state?: any): void;

  /**
   * Reschedules the last executed function with the given state
   * 
   * @param state the state
   */
  rescheduleWithState(state?: any): void;

  /**
   * Stops the scheduler
   */
  stop(): void;

  /**
   * Reschedules the last executed `ActorSpec`
   */
  rescheduleLast(): void;

  /**
   * Executes the first function in the scheduling queue. The context specified in the first `execute()` call will be
   * be passed over to each consecutive executions along with the state provided during scheduling.
   * 
   * @param context the actor context
   */
  execute(context: ActorContext): Promise<void>;
}

/**
 * Creates a generic scheduler capable of scheduling `ActorSpec`s and executing them sequentially.
 * When any of the scheduled executions fail, the scheduler will stop and propagate the error upwards, passing it over
 * to the `onTerminated` callback.
 * 
 * @param onTerminated will be called when any execution fails
 */
export function createScheduler(onTerminated: TerminationCallback): Scheduler {
  type ActorSpec = {fn: ActorHandler, state?: any};
  let queue: ActorSpec[] = [];
  let terminated = false;
  let lastExecuted: null|ActorSpec = null;

  function schedule(fn: ActorHandler, state?: any) {
    if (terminated) {
      return;
    }

    queue.push({fn, state});
  }

  function rescheduleLast() {
    if (!terminated && lastExecuted) {
      queue.push(lastExecuted);
    }
  }

  function rescheduleWithState(state: any) {
    if (!terminated && lastExecuted) {
      queue.push({fn: lastExecuted.fn, state});
    }
  }

  function stop() {
    queue = [];
    terminated = true;
    lastExecuted = null;
  }

  async function execute(context: ActorContext) {
    if (terminated || queue.length < 1) {
      return;
    }

    lastExecuted = queue.splice(0, 1)[0];
    const {fn, state} = lastExecuted;

    try {
      await fn({state, context});
      setImmediate(async () => await execute(context));
    } catch (err) {
      stop();
      onTerminated && onTerminated(err);
    }
  }

  return {schedule, rescheduleLast, rescheduleWithState, execute, stop};
}
