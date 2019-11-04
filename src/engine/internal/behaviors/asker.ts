import {_} from '@ygunayer/patmat';
import {defer, toReceive, TimedOut, randomId} from '../../../lib/utils';
import {ActorContext, ActorSpawnArgs, ActorProps, ActorRef} from '../../types';
import {ReceiveTimeout} from '../../messages/actor';

export type Asker = {promise: PromiseLike<any>, args: ActorSpawnArgs}

export function asker(message: any, timeout: number, target: ActorRef) {
  const d = defer<any>();

  function create(context: ActorContext): ActorProps {
    context.send(target, message);
    return {
      name: `asker-${randomId()}`,
      receiveTimeout: timeout,
      receive: toReceive(
        [ReceiveTimeout, () => {
          d.reject(new TimedOut());
          context.stop();
        }],

        [_, result => {
          d.resolve(result);
        }]
      )
    };
  }

  return {
    promise: d.promise,
    args: create
  }
}
