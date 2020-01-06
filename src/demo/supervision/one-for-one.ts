import {_} from '@ygunayer/patmat';
import {createSystem} from '../../engine';
import {oneForOneStrategy} from '../../engine/supervision';
import {delay, timeout, toReceive} from '../../lib/utils';
import {Receive, ActorRef, ActorProps, ActorContext} from '../../engine/types';

/**
 * This demo contains an example implementation of a parallel work queue by simulating downloads.
 * 
 * To download 10 conceptual files, we create a supervisor actor and have it distribute the work evenly in 10 downloader
 * actors. Since each download has a success rate of 75%, and we'd like to make sure that everything is downloaded,
 * we'll be using a `one-for-one` supervision strategy with infinite tolerance for failures.
 * 
 * Below are some implementation notes:
 * - When a download fails, the downloader actor simply terminates itself with the error. This termination is not handled
 * explicitly by the supervisor, but rather left upto improv's internal implementation
 * - Successful downloads are tracked individually by the supervisor so it can tell when everything is finished
 * - We also use the `ask()` pattern to initiate the downlods on the supervisor to simulate a gradual transition to the
 * actor model on an existing codebase
 */
const URLS: string[] = new Array(10).fill(0).map((_, idx) => `https://foo.bar/${idx}.jpg`);

/**
 * Simulates a download with around 75% success rate. Successful downloads will be resolved in 25-35ms, whereas failed
 * ones will be resolved in 10-15ms
 * 
 * @param url an arbitrary url
 */
async function simulateDownload(url) {
  const isSuccessful = Math.random() <= 0.75;
  if (isSuccessful) {
    const duration = 25 + Math.round(Math.random() * 10);
    return delay(duration)
  }

  const duration = 25 + Math.round(Math.random() * 5);
  return timeout(duration);
}

/**
 * Creates actor props for a downloader actor.
 * 
 * @param context the actor context
 */
function downloader(context: ActorContext): ActorProps {
  function idle(): Receive {
    return toReceive(
      [['start', _], ([_, url]) => context.become(downloading(url))]
    );
  }

  function downloading(url: string): Receive {
    const name = context.name();
    console.log(`[downloader:${name}] Now downloading ${url}`);
    simulateDownload(url)
      .then(() => context.self().send(['success']))
      .catch(err => context.self().send(['error', err]));

    return toReceive(
      // if the download is successful, inform the parent so it can stop waiting for the result
      [['success'], () => {
        console.log(`[downloader:${name}] Successfully downloaded ${url}`);
        context.parent().send(['success', url]);
        context.stop();
      }],

      // if the download is failed, shutdown self with the corresponding error and let the parent handle it
      [['error', _], ([_, err]) => {
        console.log(`[downloader:${name}] Failed to download ${url}, terminating actor with an error`);
        context.stop(err);
      }]
    );
  }

  return {receive: idle()};
}

/**
 * Creates actor props for the supervisor
 * 
 * @param context the actor context
 */
function supervisor(context: ActorContext): ActorProps {
  function idle(): Receive {
    return toReceive(
      [['start', _], ([_, urls]) => {
        const replyTo = context.sender();
        console.log(`[supervisor] Received ${urls.length} URLs. Will reply to ${replyTo.path()} once finished.`);
        urls.forEach(url => {
          const child = context.spawn(downloader);
          child.send(['start', url]);
        });
        context.become(running(Date.now(), replyTo, urls));
      }]
    );
  }

  function running(startedAt: number, replyTo: ActorRef, remaining: string[]): Receive {
    const childCount = context.children().length;
    console.log(`[supervisor] ${remaining.length} downloads still pending (children: ${childCount})`);
    return toReceive(
      [['success', _], ([_, url]) => {
        console.log('[supervisor] Got finish notice for URL', url);
        const nextRemaining = remaining.filter(x => x !== url);
        if (nextRemaining.length < 1) {
          console.log(`[supervisor] All downloads finished. Replying to ${replyTo.path} with total duration`);
          const duration = Date.now() - startedAt;
          context.send(replyTo, duration);
          context.stop();
        } else {
          context.become(running(startedAt, replyTo, nextRemaining));
        }
      }]
    );
  }

  return {
    receive: idle(),
    supervisionStrategy: oneForOneStrategy({
      /**
       * Children are allowed to fail infinite times
       */
      maxRetries: Infinity
    })
  };
}

const system = createSystem({name: 'supervision:one-for-one'});
const supervisorActor = system.spawn(supervisor);
supervisorActor
  .ask(['start', URLS], Infinity)
  .then((duration: number) => {
    console.log(`All downloads finished in ${duration} milliseconds`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Download failed', err);
    process.exit(1);
  });
