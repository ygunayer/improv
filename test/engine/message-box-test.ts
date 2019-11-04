import test from 'ava';
import {defer} from '../../src/lib/utils';
import {createMessageBox} from '../../src/engine/internal/message-box';

test.beforeEach(t => {
  t.timeout(100);
});

test('1. test single message with late pop call', async t => {
  const box = createMessageBox();

  const expected = 'foo';
  box.push('foo');

  const actual = await box.pop();
  t.is(actual, expected);
});

test('2. test single message with early pop call', async t => {
  const box = createMessageBox();

  const expected = 'foo';
  const d = defer();

  box.pop()
    .then(d.resolve)
    .catch(d.reject);

  box.push('foo');

  const actual = await d.promise;
  t.is(actual, expected);
});

test('3. test delayed message', async t => {
  const box = createMessageBox();

  const expected = 'foo';
  const d = defer();
  const delay = 250;
  t.timeout(delay * 2);

  box.pop()
    .then(d.resolve)
    .catch(d.reject);

  let t0 = Date.now();
  setTimeout(() => box.push('foo'), delay);

  const actual = await d.promise;
  t.is(actual, expected);
  t.true((Date.now() - t0) >= delay);
});

test('4. test multiple messages and order with early pop call', async t => {
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
  t.deepEqual(actual, expected);
});

test('5. test multiple messages and order with late pop call', async t => {
  const box = createMessageBox();

  const expected = ['foo', 'bar', 'baz'];

  box.push('foo');
  box.push('bar');
  box.push('baz');

  const a = await box.pop();
  const b = await box.pop();
  const c = await box.pop();

  const actual = [a, b, c];
  t.deepEqual(actual, expected);
});
