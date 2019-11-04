import {Scheduler, createScheduler, ScheduleActions} from '../generic/scheduler';
import {ActorSystem, ActorContext, Receive} from '../types';
import * as ActorMessages from '../messages/actor';
import {MessageBoxStopped, MessageBoxPaused, MessageBox} from './message-box';
import {_} from '@ygunayer/patmat';
import {InternalActorRef} from './actor';
import createLogger from '../../lib/logger';
import {awaitWithTimeout, TimedOut} from '../../lib/utils';
import {Envelope} from './messages';

/**
 * Represents a scheduler that's capable of handling the changing behaviors of an actor
 */
export interface ActorScheduler {
  /**
   * Starts the scheduler with the initial receive block
   * 
   * @param receive the receive block of the actor
   */
  start(receive: Receive): void;

  /**
   * Instructs the scheduler to use with the given receive block for the next execution
   * 
   * @param receive the receive block of the actor
   */
  become(receive: Receive): void;

  /**
   * Recursively stops the actor and its children with the given reason
   * 
   * @param reason the reason for the termination
   */
  stop(reason?: any): void;
}

export interface ActorSchedulerArgs {
  system: ActorSystem;
  context: ActorContext;
  messageBox: MessageBox<Envelope>;
}

export function createActorScheduler({system, context, messageBox}: ActorSchedulerArgs): ActorScheduler {
  const logger = createLogger('actor-scheduler');
  let started = false;
  let stopped = false;

  const scheduler: Scheduler = createScheduler(system.ec(), err => {
    terminateWithReason(ActorMessages.Exited.Crashed(context.self(), err));
  });

  function terminateWithReason(reason: ActorMessages.Exited) {
    logger.info(`Actor ${reason.ref} is being terminated due to`, reason);
    context.parent().tell(reason, reason.ref);
    context.children().forEach(child => {
      (child as InternalActorRef).stop();
    });
    stopped = true;
    scheduler.stop();
  }

  async function actWith(receive: Receive) {
    scheduler.scheduleNext(ScheduleActions.RepeatLast);

    let envelope: Envelope;
    const receiveTimeout = context.receiveTimeout();
    try {
      envelope = await awaitWithTimeout(messageBox.pop(), receiveTimeout);
      logger.debug(`Relaying message ${JSON.stringify(envelope.message)} to actor ${context.path()}`);
    } catch (err) {
      if (err instanceof MessageBoxStopped) {
        return;
      }

      if (err instanceof MessageBoxPaused) {
        return;
      }

      if (err instanceof TimedOut) {
        logger.debug(`Receive timed out after ${receiveTimeout} ms, sending timeout message to actor`);
        envelope = Envelope.create({
          sender: context.self(),
          recipient: context.self(),
          message: new ActorMessages.ReceiveTimeout(receiveTimeout)
        });
      } else {
        throw err;
      }
    }

    context.sender = () => envelope.sender;
    await receive.apply(envelope.message);
  }

  function become(receive: Receive) {
    if (!started || stopped) return;
    const nextTask = async () => await actWith(receive);
    scheduler.scheduleNext(ScheduleActions.Schedule(nextTask));
  }

  function stop(reason: any) {
    if (!started || stopped) return;
    logger.debug(`Actor scheduler stopped`);

    if (!(reason instanceof ActorMessages.Exited)) {
      reason = ActorMessages.Exited.Normal(context.self(), reason);
    }

    terminateWithReason(reason);
  }

  function start(receive: Receive) {
    if (started) return;
    logger.debug(`Actor scheduler created`);
    started = true;
    become(receive);
    scheduler.execute();
  }

  return {become, stop, start};
}
