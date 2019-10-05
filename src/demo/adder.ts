import {createSystem} from '../engine/system';
import {HandlerArgs} from '../engine/actor';
import {_} from '@ygunayer/patmat';

async function expect2({context}: HandlerArgs) {
  console.log('expect2');

  await context.receive(
    [Number, n => {
      context.continueWith(expect1, n)
    }],

    [_, () => {
      console.log('sie');
      context.repeat();
    }]
  );
}

async function expect1({context, state}: HandlerArgs) {
  const timeout = setTimeout(() => {
    context.continueWith(expect2);
  }, 2000);
  console.log('expect1', state);

  await context.receive(
    [Number, async n => {
      clearTimeout(timeout);

      const result = state + n;
      console.log('soktdu', result)
      context.continueWith(finished, result)
    }],

    [_, () => {
      clearTimeout(timeout);

      console.log('sie aaaaaa');
      context.repeat();
    }]
  );
}

async function finished({context, state}: HandlerArgs) {
  console.log('finish', state);
  await context.receive(
    [_, msg => console.log('anan', msg, state)]
  );
  context.repeat();
}

const system = createSystem({name: 'anan'});
const actor = system.spawn(expect2);

actor.send(5);
actor.send('bacin');
actor.send(2);
actor.send('bacin');
actor.send(200);
actor.send('bacin');
