import {_} from '@ygunayer/patmat';
import {createSystem} from '../engine';
import {toReceive} from '../lib/utils';
import {ActorProps, ActorContext} from '../engine/types';

// Based on https://github.com/ygunayer/erlang-examples/blob/master/pokemon/pokemon.erl

const system = createSystem({name: 'demo-pokemon'});

function pokemonActor(context: ActorContext): ActorProps {
  const pikachu = toReceive(
    ['talk', () => console.log('Pikachu! Pika, pika!')],
    ['thunder_stone', () => {
      console.log('Pikachu is evolving to Raichu!');
      context.become(raichu);
    }],
    [_, msg => console.log(`Pikachu is very sorry but it doesn't quite know what to do with ${msg}`)]
  );

  const raichu = toReceive(
    ['talk', () => console.log('Rai!')],
    ['thunder_stone', () => console.log('Thunder stone has no effect on Raichu.')],
    [_, msg => console.log(`Raichu stares at ${msg} with a puzzled smile.`)]
  );

  return {name: 'pokemon', receive: pikachu};
}

const poke = system.spawn(pokemonActor);
poke.send('talk');
poke.send('fire_stone');
poke.send('thunder_stone');
poke.send('talk');
poke.send('fire_stone');
poke.send('thunder_stone');
poke.send('talk');
