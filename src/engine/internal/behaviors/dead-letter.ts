import empty from './empty';
import {Receive} from '../../types';
import createLogger from '../../../lib/logger';

export default function deadLetter(): Receive {
  const logger = createLogger('dead-letter');
  return empty().andThen(msg => logger.debug(`Dead letter actor received message ${msg}`));
}
