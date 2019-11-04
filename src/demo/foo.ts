import {_} from '@ygunayer/patmat';
import {Receive, ActorProps, ActorContext, ActorRef} from '../engine/types';
import {toReceive} from '../lib/utils';
import {createSystem} from '../engine';
import {Identify, Identity} from '../engine/messages/actor';

const system = createSystem({name: 'bacin'});

function anan(context: ActorContext): ActorProps {
  let bacin: ActorRef = null;
  const receive = toReceive(
    [Identity, {messageId: 'bacinin-adi'}, (id: Identity) => {
      console.log(`bacin ${id.ref.path()} imis aq`);
      bacin = id.ref;
      context.send(bacin, 'yarrami ye');
    }]
  );
  context.send(ref1, new Identify('bacinin-adi'));
  return {name: 'anan', receive};
}

function bacin(context: ActorContext): ActorProps {
  const receive: Receive = toReceive(
    [_, async msg => {
      await new Promise(resolve => setTimeout(resolve, 250));
      console.log('AQQQQQQ', msg);
    }]
  );

  return {name: 'bacin', receive};
};

const ref1 = system.spawn(bacin);
system.spawn(anan);
