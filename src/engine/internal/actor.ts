import {_} from '@ygunayer/patmat';
import {randomId, toReceive} from '../../lib/utils';
import {createMessageBox} from './message-box';
import * as ActorMessages from '../messages/actor';
import * as SystemMessages from './messages';
import {Envelope} from './messages';
import {createActorScheduler} from './scheduler';
import {ActorContext, ActorRef, ActorSystem, ActorProps, Receive, ActorSpawnArgs, ActorLifecycleHooks} from '../types';
import {InternalActorPath} from './path';
import {oneForOneStrategy} from './supervision';
import {FailureCounter} from './supervision/tools';
import createLogger from '../../lib/logger';
import {asker} from './behaviors/asker';

export interface InternalActorRef extends ActorRef {
  start(): void;
  stop(reason?: any): void;
  restart(): void;
  isTerminated(): boolean;
}

const EmptyHooks: ActorLifecycleHooks = {
  preStart: () => {},
  preRestart: () => {},
  postRestart: () => {},
  postStop: () => {}
};

/**
 * Spawns a process that handles the given function.
 */
export function spawn(system: ActorSystem, parentRef: ActorRef, args: ActorSpawnArgs): InternalActorRef {
  type ChildEntry = {key: string, ref: InternalActorRef, counter: FailureCounter};

  let isTerminated = false;
  let isStarted = false;

  const sendToDeadLetter: Receive = toReceive(
    [_, msg => system.deadLetter().tell(msg, context.self())]
  );

  /**
   * Handles internal (supervisioning, lifecycle, etc.) messages
   */
  const handleInternalMessages: Receive = toReceive(
    [SystemMessages.Stop, (reason?: any) => {
      if (!(reason instanceof ActorMessages.Exited)) {
        reason = ActorMessages.Exited.Normal(ref, reason);
      }

      logger.debug(`Actor is being stopped due to ${reason}, pausing message box and stopping all children`);
      messageBox.pause();

      children.forEach(child => {
        const childReason = ActorMessages.Exited.Killed(child.ref, reason);
        child.ref.stop(childReason);
      });

      const remainingMessages = messageBox.stop();
      scheduler.stop();
      remainingMessages.forEach(msg => system.deadLetter().send(msg));
      logger.debug(`${children.size} children were stopped, ${remainingMessages.length} messages were sent to dead-letters`);

      parentRef && parentRef.send(reason);
      hooks.postStop();
    }],

    [SystemMessages.Restart, () => {
      hooks.preRestart();
      logger.debug('Received restart message, pausing message box')
      // when the message box is paused, the scheduler aborts the wait for the next message and begins waiting until the
      // message box is resumed, even if more messages are received
      messageBox.pause();

      children.forEach(child => child.ref.restart());
      // TODO replace actor cells

      messageBox.resume();
      logger.debug(`${children.size} children were restarted and message box was resumed`);
      hooks.postRestart();
    }],

    [ActorMessages.Identify, (msg: ActorMessages.Identify) => {
      logger.debug('Identification message received, replying with identity');
      context.reply(new ActorMessages.Identity(ref, msg.messageId))
    }]
  );

  function wrapReceive(receive: Receive): Receive {
    return handleInternalMessages.orElse(receive).orElse(sendToDeadLetter);
  }

  const ref: InternalActorRef = {
    path: () => path,
    send: (message: any) => ref.tell(message, system.deadLetter()),
    tell: (message: any, sender: ActorRef) => {
      const envelope = Envelope.create({
        sender,
        recipient: ref,
        message
      });
      messageBox.push(envelope);
    },
    ask: (message: any, timeout: number): Promise<any> => {
      const {promise, args} = asker(message, timeout, ref);
      system.spawn(args);
      return promise;
    },

    // INTERNAL API
    start: () => {
      if (isTerminated || isStarted) return;
      logger.debug('Starting actor');
      scheduler.start(wrapReceive(props.receive));
    },

    stop: () => {
      if (isTerminated) return;
      context.setReceiveTimeout(Infinity);
      isTerminated = true;
      logger.debug('Stopping actor');
      const envelope = Envelope.create({
        sender: ref,
        recipient: ref,
        message: SystemMessages.Stop
      });
      messageBox.unshift(envelope);
    },

    restart: () => {
      if (isTerminated) return;
      isTerminated = true;
      logger.debug('Restarting actor');
      const envelope = Envelope.create({
        sender: ref,
        recipient: ref,
        message: SystemMessages.Restart
      });
      messageBox.unshift(envelope)
    },

    isTerminated: () => isTerminated
  };

  const context: ActorContext = {
    name: () => name,
    path: () => path,
    system: () => system,
    self: () => ref,
    parent: () => parentRef,
    become: (receive: Receive) => {
      if (isTerminated) return;
      logger.debug(`Actor is now becoming ${receive}`);
      scheduler.become(wrapReceive(receive));
    },
    sender: () => system.deadLetter(),
    send: (recipient: ActorRef, message: any) => recipient.tell(message, ref),
    reply: (message: any) => context.sender().tell(message, ref),
    spawn: (props: ActorProps): ActorRef => {
      if (isTerminated) return;
      return spawn(system, ref, props);
    },
    stop: (reason: any) => {
      if (isTerminated) return;
      logger.debug(`Actor is being stopped due to ${reason}`);
      ref.stop(reason);
    },
    supervisionStrategy: () => supervisionStrategy,
    children: () => Array.from(children.values()).map(child => child.ref),
    receiveTimeout: () => receiveTimeout,
    setReceiveTimeout: n => {
      if (isTerminated) return;
      receiveTimeout = n;
    }
  };

  const props = typeof args === 'function' ? args(context) : args;

  const hooks = Object.assign({}, EmptyHooks, props.hooks);
  const name = props.name || randomId();
  const logger = createLogger(`actor:${name}`);
  const path = (parentRef.path() as InternalActorPath).add(name);
  const supervisionStrategy = props.supervisionStrategy || oneForOneStrategy(); // TODO do something
  const messageBox = createMessageBox<Envelope>();
  const children = new Map<string, ChildEntry>();
  let receiveTimeout = props.receiveTimeout || Infinity;
  hooks.preStart();

  const scheduler = createActorScheduler({system, context, messageBox});
  ref.start();
  return ref;
}