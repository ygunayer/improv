import {_} from '@ygunayer/patmat';
import {createSystem} from '../engine';
import {delay, toReceive} from '../lib/utils';
import {ActorProps, ActorContext} from '../engine/types';

function workActor(context: ActorContext): ActorProps {
  const receive = toReceive(
    [Number, async n => {
      const duration = Math.floor(300 + Math.random() * 200);
      console.log(`[worker] Got message ${n}, will reply in ${duration} milliseconds`);
      await delay(duration);
      context.reply(n < 0.5);
    }]
  );

  return {receive};
}

const system = createSystem({name: 'demo-ask'});
const actor = system.spawn(workActor);

async function askOnce() {
  const n = Math.floor(Math.random() * 1000) / 1000;
  const timeout = 400;
  console.log(`[asker] [${n}] Worker was asked to reply in ${timeout} milliseconds`);
  return actor.ask(n, timeout)
    .then(result => console.log(`[asker] [${n}] ${result}`))
    .catch(() => console.log(`[asker] [${n}] No Reply`));
}

async function ask() {
  await askOnce();
  await askOnce();
  await askOnce();
}

ask().then();
