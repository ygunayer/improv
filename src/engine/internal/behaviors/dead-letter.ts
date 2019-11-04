import empty from './empty';
import createLogger from '../../../lib/logger';

export default function deadLetter() {
  const logger = createLogger('dead-letter');
  return empty().andThen(msg => logger.debug(`Dead letter actor received message ${msg}`));
}
