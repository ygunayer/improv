require('mocha');
const {expect} = require('chai');
const {defer} = require('../../../dist/lib/utils');
const {createMessageBox} = require('../../../dist/engine/internal/message-box');

const DEFAULT_DELAY = 10;

function stopwatch(fn, minDelay = DEFAULT_DELAY) {
  const t0 = Date.now();
  const timeout = setTimeout(fn, minDelay);
  return {
    timeout: () => timeout,
    delay: () => minDelay,
    assert: () => {
      const duration = Date.now() - t0;
      expect(duration, `Expected a delay over ${minDelay} but elapsed time was ${duration}`).to.gte(minDelay);
    }
  };
}

describe('engine/internal/message-box', () => {
  
  describe('createMessageBox', () => {
    it('should create an empty box', () => {
      const box = createMessageBox();
      expect(box.isEmpty()).to.be.true;
    });
  });


  describe('push', () => {
    it('should insert an item into the box', () => {
      const box = createMessageBox();
      box.push(42);
      expect(box.isEmpty()).to.be.false;
    });
  });


  describe('pop', () => {
    it('should remove an item from the box', async () => {
      const box = createMessageBox();
      const expected = 42;
      box.push(expected);
      const actual = await box.pop();
      expect(box.isEmpty()).to.be.true;
      expect(actual).to.equal(expected);
    });

    it('should retain order of messages in FIFO manner', async () => {
      const in1 = 42;
      const in2 = 50;
      const box = createMessageBox();
      box.push(in1);
      box.push(in2);

      const out1 = await box.pop();
      const out2 = await box.pop();
      expect(out1).to.equal(in1);
      expect(out2).to.equal(in2);
    });

    it('should wait until a message is pushed', async () => {
      const box = createMessageBox();
      const expected = 'foo';

      const d = defer();
      box.pop().then(d.resolve).catch(d.reject);

      const watch = stopwatch(() => box.push(expected));

      const actual = await d.promise;
      expect(actual).to.equal(expected);
      watch.assert();
    });

    it('should wait until a message is pushed and retain order', async () => {
      const box = createMessageBox();

      const expected = ['foo', 'bar', 'baz'];
      const d = defer();

      box.pop()
        .then(async a => {
          const b = await box.pop();
          const c = await box.pop();
          d.resolve([a, b, c]);
        })
        .catch(d.reject);

      box.push('foo');
      box.push('bar');
      box.push('baz');

      const actual = await d.promise;
      expect(actual).to.deep.equal(expected);
    });
  });


  describe('unshift', () => {
    it('should insert an item into the box', () => {
      const box = createMessageBox();
      box.push(42);
      expect(box.isEmpty()).to.be.false;
    });

    it('should insert an item as the first one', async () => {
      const in1 = 42;
      const in2 = 50;
      const in0 = 100;
      const box = createMessageBox();
      box.push(in1);
      box.push(in2);
      box.unshift(in0);

      const out1 = await box.pop();
      const out2 = await box.pop();
      const out3 = await box.pop();
      expect(out1).to.equal(in0);
      expect(out2).to.equal(in1);
      expect(out3).to.equal(in2);
    });
  });


  describe('pause', () => {
    it('should cause pop calls to wait forever (exec order: pause, pop, push)', async () => {
      const box = createMessageBox();
      const d = defer();
      box.pause();

      box.pop()
        .then(r => d.reject(new Error(`pop() should have failed but got ${r}`)));
      box.push(42);

      const watch = stopwatch(() => d.resolve());

      await d.promise;
      watch.assert();
    });
    
    it('should cause pop calls to wait forever (exec order: pop, pause, push)', async () => {
      const box = createMessageBox();
      const d = defer();

      box.pop()
        .then(r => d.reject(new Error(`pop() should have failed but got ${r}`)));

      box.pause();
      box.push(42);

      const watch = stopwatch(() => d.resolve());

      await d.promise;
      watch.assert();
    });
  });

});
