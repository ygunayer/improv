import {createSystem} from '../engine/system';
import {HandlerArgs} from '../engine/actor';
import {_} from '@ygunayer/patmat';

// Based on https://github.com/ygunayer/erlang-examples/blob/master/pokemon/pokemon.erl

const system = createSystem({name: 'demo'});

async function pikachu({context}: HandlerArgs) {
  await context.receive(
    ['talk', () => {
      console.log('Pikachu! Pika, pika!');
      context.repeat();
    }],

    ['thunder_stone', () => {
      console.log('Pikachu is evolving to Raichu!');
      context.continueWith(raichu)
    }],

    [_, msg => {
      console.log(`Pikachu is very sorry but it doesn't quite know what to do with ${msg}`)
      context.repeat();
    }]
  );
}

async function raichu({context}: HandlerArgs) {
  await context.receive(
    ['talk', () => console.log('Rai!')],

    ['thunder_stone', () => console.log('Thunder stone has no effect on Raichu.')],

    [_, msg => console.log(`Raichu stares at ${msg} with a puzzled smile.`)]
  );

  context.repeat();
}

const poke = system.spawn(pikachu);
poke.send('talk');
poke.send('anan');
poke.send('fire_stone');
poke.send('thunder_stone');
poke.send('talk');
poke.send('fire_stone');
poke.send('thunder_stone');
poke.send('talk');
