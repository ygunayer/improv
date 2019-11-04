/**
 * Represents a construct that can execute the given task
 */
export interface ExecutionContext {
  submit(task: Task)
}

/**
 * Represents a simple asynchronous task
 */
export type Task = () => PromiseLike<void>;
