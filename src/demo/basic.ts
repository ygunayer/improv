import {createSystem} from '../engine/system';
import {HandlerArgs} from '../engine/actor';
import {_} from '@ygunayer/patmat';

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize the actor system
 */
const system = createSystem({name: 'demo'});

/**
 * A simple handler that "updates" its state (a sum of all numbers received previously) when it receives a valid number.
 * When the sum reaches 100, the process stops itself.
 * Randomly delays processing each message for 1-3 seconds
 */
async function running({state, context}: HandlerArgs) {
  const {total} = state;

  const delayMs = randomInt(1000, 3000);
  console.log(`[handler] Simulating a random delay of ${delayMs} milliseconds`)
  await delay(delayMs);

  await context.receive(
    [isNaN, msg => {
      console.log(`[handler] Received unexpected message ${msg}`);
      context.repeat();
    }],

    [_, msg => {
      const nextTotal = total + Number(msg);
      if (nextTotal >= 100) {
        console.log(`[handler] Reached a total sum of ${nextTotal}, exiting normally...`);
        context.stop();
      } else {
        console.log(`[handler] Got ${msg} over ${total}, total sum is now ${nextTotal}`);
        context.repeatWithState({total: nextTotal});
      }
    }]
  );
}

// spawns an actor/process that executes the function `handler` (aka the handler), with an initial state of 0 total sum
const p1 = system.spawn(running, {total: 0});

function sendNumber() {
  const num = randomInt(1, 25);
  console.log(`[sender] Sending number ${num}`);
  p1.send(num);
}

/**
 * Sends 7 random numbers between 1 and 25 to the actor
 */
sendNumber();
sendNumber();
sendNumber();
sendNumber();
sendNumber();
sendNumber();
sendNumber();

system.onShutdown(reason => {
  console.log('System has been shut down due to', reason);
});
