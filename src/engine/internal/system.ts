import {spawn, InternalActorRef} from './actor';
import {_} from '@ygunayer/patmat';
import {EventEmitter} from 'events';
import {Default as DefaultExecutionContext} from '../generic/execution-context';
import {ActorRef, ActorSystem, ActorSpawnArgs} from '../types';
import {ExecutionContext} from '../types/generic';
import {createRootNode} from './path';
import empty from './behaviors/empty';
import deadLetter from './behaviors/dead-letter';
import createLogger from '../../lib/logger';

/**
 * Creates an actor system with the given name and execution context.
 * If no execution context is provided, uses the default implementation that is suitable for the environment (e.g. node, browser)
 */
export function createSystem({name, executionContext = DefaultExecutionContext}: {name: string, executionContext?: ExecutionContext}): ActorSystem {
  const logger = createLogger(`system:${name}`);
  let isTerminated = false;
  let shutdownEvents = new EventEmitter();

  const rootPath = createRootNode(name);

  const system = {
    name: () => name,

    ec: () => executionContext,

    spawn: (args: ActorSpawnArgs) => {
      if (isTerminated) {
        throw new Error('This system is terminated and can no longer be used.');
      }

      const ref = spawn(system, userActor, args);
      logger.info(`Actor spawned: ${ref.path()}`);
      return ref;
    },

    onShutdown: (fn: (reason: any) => any) => shutdownEvents.on('shutdown', fn),

    systemRoot: () => systemActor,
    userRoot: () => userActor,
    deadLetter: () => deadLetterActor    
  };

  const rootActor: InternalActorRef = {
    path: () => rootPath,
    send: () => {},
    tell: () => {},
    ask: () => Promise.reject(),
    start: () => {},
    stop: () => {},
    restart: () => {},
    isTerminated: () => isTerminated,
    setActor: () => {}
  };
  const userActor: InternalActorRef = spawn(system, rootActor, {receive: empty(), name: 'user'});
  const systemActor: InternalActorRef = spawn(system, rootActor, {receive: empty(), name: 'system'});
  const deadLetterActor: InternalActorRef = spawn(system, systemActor, {receive: deadLetter(), name: 'deadLetters'});
  logger.debug('System created');

  return system;
};
