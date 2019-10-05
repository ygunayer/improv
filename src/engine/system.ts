import {ActorRef, ActorContext, ActorHandler, spawn} from './actor';
import {_} from '@ygunayer/patmat';
import { EventEmitter } from 'events';

type ShutdownListener = (reason: any) => any;

/**
 * Represents an actor system
 */
export interface ActorSystem {
  /**
   * The name of the system
   */
  name(): String;

  /**
   * Spawns an actor to handle the specified spec
   * 
   * @param handler the handler function
   * @param state the initial state (optional)
   */
  spawn(handler: ActorHandler, state?: any): ActorRef;

  /**
   * Registers the given callback function to be executed when the system is being shut down.
   * 
   * @param cb the callback function
   */
  onShutdown(cb: ShutdownListener): void;
}

/**
 * Creates an actor system with the given name.
 */
export function createSystem({name}: {name: string}): ActorSystem {
  let isTerminated = false;
  let shutdownEvents = new EventEmitter();

  const fakeSupervisor: ActorRef = {
    addr: () => ({
      id: () => 'reaper'
    }),
    send: (msg: any) => onShutdown(msg)
  };
  function onShutdown(reason: any) {
    if (isTerminated) {
      return;
    }

    console.info(`Root process ${rootSupervisor} has been shut down due to`, reason);
    isTerminated = true;
    shutdownEvents.emit('shutdown', {reason});
  }

  const system = {
    name: () => name,

    spawn: (fn: ActorHandler, state?: any) => {
      if (isTerminated) {
        throw new Error('This system is terminated and can no longer be used.');
      }

      return spawn(system, rootSupervisor, fn, state);
    },

    onShutdown: (fn: ShutdownListener) => shutdownEvents.on('shutdown', fn)
  };

  const rootHandler: ActorHandler = async ({context}: {context: ActorContext}) => {
    console.log(`Spawning ${context.self().addr().id()} as the root process for system ${name}`);
    await context.receive(
      [_, () => context.repeat()]
    );
  };

  const rootSupervisor = spawn(system, fakeSupervisor, rootHandler, {});

  return system;
};
