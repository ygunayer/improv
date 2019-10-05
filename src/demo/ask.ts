import {createSystem} from '../engine/system';
import {HandlerArgs, ActorRef} from '../engine/actor';
import {_} from '@ygunayer/patmat';

class WorkItem {
  constructor(public timeout: Number, public cb: (err: Error, result: Number) => void) {}
}

async function workHandler({context}: HandlerArgs) {
  await context.receive(
    [WorkItem, ({ms, cb}) => {
      setTimeout(() => {
        const num = Math.random() < 0.5;
        if (num) {
          cb(new Error(`num ${num} is below 0.5`));
        } else {
          cb(null, num);
        }
      }, ms);
    }]
  );

  context.repeat();
}
const system = createSystem({name: 'ask-demo'});
const actor = system.spawn(workHandler);

async function ask(actor: ActorRef, timeout: Number): Promise<any> {
  return new Promise((resolve, reject) => {
    actor.send(new WorkItem(timeout, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }));
  });
}

ask(actor, 2000)
  .then(console.log.bind(console, 'Successful'))
  .catch(console.error.bind(console, 'Error'));
