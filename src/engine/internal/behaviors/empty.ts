import {Receive} from '../../types';
import {toReceive} from '../../../lib/utils';
import {_} from '@ygunayer/patmat';

const Empty: Receive = toReceive(
  [_, () => {}]
);

export default function empty(): Receive {
  return Empty;
};
