import {_, match} from '@ygunayer/patmat';
import {Task, ExecutionContext} from '../types/generic';

/**
 * Represents the callback type for scheduler terminations that are caused by failed executions
 */
export type TerminationCallback = (reason: any) => void;

interface ScheduleAction {}
class ScheduleTask { constructor(public task: Task) {} }
class RescheduleLast {}
class Stop {}

export const ScheduleActions = {
  /**
   * Schedules the given task for execution at the next iteration
   */
  Schedule: (task: Task) => new ScheduleTask(task),

  /**
   * Schedules the last executed task for execution at the next iteration
   */
  RepeatLast: new RescheduleLast(),

  /**
   * Schedules the scheduler to stop at the next iteration
   */
  Stop: new Stop()
};

/**
 * Represents a construct that can execute asynchronous tasks, and allows specifying the action to take for the next execution.
 */
export interface Scheduler {
  /**
   * Schedules the action to be taken before the next execution
   */
  scheduleNext(action: ScheduleAction): void;

  /**
   * Consumes the last action that was scheduled and executes the resulting task
   */
  execute(): Promise<void>;

  /**
   * Stops the scheduler
   */
  stop(): void;
}

/**
 * Creates a basic scheduler that can handle tasks in the given execution context
 * 
 * @param executionContext the execution context
 * @param onTerminated the callback to invoke when an execution fails
 */
export function createScheduler(executionContext: ExecutionContext, onTerminated: TerminationCallback) {
  const noop: Task = async () => {};

  let lastHandled: Task = noop;
  let currentAction: ScheduleAction = null;
  let stopped = false;

  function scheduleNext(action: ScheduleAction) {
    if (stopped) return;
    currentAction = action;
  }

  function stop() {
    stopped = true;
    currentAction = ScheduleActions.Stop;
    lastHandled = noop;
  }

  async function execute() {
    if (stopped) return;

    const nextTask: Task = match<ScheduleAction, Task>(currentAction).case(
      [Stop, () => { stop(); return noop; }],
      [RescheduleLast, () => lastHandled],
      [ScheduleTask, (scheduled: ScheduleTask) => scheduled.task]
    );

    currentAction = ScheduleActions.Stop;
    lastHandled = nextTask;
    try {
      await nextTask();
      executionContext.submit(async () => execute());
    } catch (err) {
      stop();
      onTerminated(err);
    }
  }

  return {scheduleNext, execute, stop};
}
