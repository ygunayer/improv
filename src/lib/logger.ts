import {randomId} from './utils';

interface Logger {
  trace(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

function createConsoleLogger(name: string): Logger {
  return {
    trace: console.trace.bind(console, `TRACE: [${name}]`),
    debug: console.debug.bind(console, `DEBUG: [${name}]`),
    info: console.info.bind(console, `INFO: [${name}]`),
    warn: console.warn.bind(console, `WARN: [${name}]`),
    error: console.error.bind(console, `ERROR: [${name}]`)
  };
};

const noop = () => {};
function createNullLogger() {
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop
  };
}

const loggingEnabled = process.env.LOG === '1';
export default function createLogger(name) {
  const id = randomId(4);
  return loggingEnabled ? createConsoleLogger(`${name}:${id}`) : createNullLogger();
}
