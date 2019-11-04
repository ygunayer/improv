import {_} from '@ygunayer/patmat';
import {ActorProps, ActorContext} from '../engine/types';
import {delay, toReceive} from '../lib/utils';
import {createSystem} from '../engine';
import {ReceiveTimeout} from '../engine/messages/actor';

function adderActor(context: ActorContext): ActorProps {
  const expect2 = () => {
    context.setReceiveTimeout(Infinity);
    console.log('[expect2] Expecting 2 numbers');

    return toReceive(
      [Number, n => context.become(expect1(n))]
    );
  };

  const expect1 = (n: Number) => {
    context.setReceiveTimeout(225);
    console.log('[expect1] Expecting another number over', n);

    return toReceive(
      [Number, n2 => {
        const result = n + n2;
        console.log(`[expect1] Received ${n2} over ${n}, finishing with result ${result}`);
        context.become(finished(result));
      }],

      [ReceiveTimeout, ({duration}) => {
        console.log(`[expect1] Receive timed out after ${duration}, reverting back to [expect2]`);
        context.become(expect2());
      }]
    )
  };

  const finished = (result: Number) => {
    context.setReceiveTimeout(300);
    console.log(`[finished] Finished with result ${result}`);
    return toReceive(
      [ReceiveTimeout, ({duration}) => {
        console.log(`Received no messages after ${duration} milliseconds, stopping...`);
        context.stop();
      }],

      [_, msg => {
        console.log('[finished] Got message', msg);
      }]
    );
  };

  return {receive: expect2(), name: 'adder'};
}

/**
 * Sends a message after a random delay between 175-275 milliseconds
 * 
 * @param msg the message to send
 */
async function sendDelayed(msg): Promise<void> {
  const duration = 175 + (Math.random() * 100);
  //console.log(`Waiting for ${duration} milliseconds before sending a message`);
  return delay(duration).then(() => actor.send(msg));
}

const system = createSystem({name: 'demo-adder'});
const actor = system.spawn(adderActor);

async function sendMessages() {
  await sendDelayed(5);
  await sendDelayed('foo');
  await sendDelayed(100);
  await sendDelayed('foo');
  await sendDelayed(200);
  await sendDelayed('foo');
  await sendDelayed(300);
  await sendDelayed('foo');
  await sendDelayed(400);
  await sendDelayed('foo');
}

sendMessages().then();
