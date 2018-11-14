import ArrayProxy from '@ember/array/proxy';
import { get, set } from '@ember/object';
import { ArrayProxyMixin } from 'ember-deep-buffered-proxy';
import { module, test } from 'qunit';

module('Unit | Mixin | array proxy', function() {
  const Proxy = ArrayProxy.extend(ArrayProxyMixin);

  test('it buffers simple values', function (assert) {
    let subject = ['travel', 'nature'];
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,     'hasChanges'), false, 'should be pristine');

    proxy.pushObject('lifestyle');

    assert.equal(get(proxy,     'hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature', 'lifestyle'], 'proxy should use the new value');
    assert.deepEqual(subject,   ['travel', 'nature'], 'subject should keep the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel', 'nature', 'lifestyle'],
      added:    ['lifestyle'],
      removed:  []
    }, 'proxy should report local changes');

    proxy.discardChanges();

    assert.equal(get(proxy,     'hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature'], 'proxy should restore the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');

    proxy.removeObject('nature');

    assert.deepEqual(get(proxy, 'localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel'],
      added:    [],
      removed:  ['nature']
    }, 'proxy should report removed objects');

    proxy.applyChanges();

    assert.equal(get(proxy,     'hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(proxy, 'content'), ['travel'], 'proxy should use the second value');
    assert.deepEqual(subject,   ['travel'], 'subject should use the second value');

    assert.deepEqual(get(proxy, 'localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes again');
  });

  test('it buffers object values', function (assert) {
    let subject = [
      { firstName: 'Joana' },
      { firstName: 'Victor' }
    ];
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,                 'hasChanges'), false, 'should be pristine');

    set(proxy.objectAt(0), 'firstName', 'Tilde');

    assert.equal(get(proxy,                 'hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy.objectAt(0), 'firstName'), 'Tilde', 'proxy should use the new value');
    assert.deepEqual(get(subject[0],        'firstName'), 'Joana', 'subject should keep the original value');

    proxy.discardChanges();

    assert.equal(get(proxy,                  'hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(proxy.objectAt(0),  'firstName'), 'Joana', 'proxy should restore the original value');

    proxy.objectAt(0).set('firstName', 'Max');
    proxy.applyChanges();

    assert.equal(get(proxy,                  'hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(proxy.objectAt(0),  'firstName'), 'Max', 'proxy should use the second value');
    assert.deepEqual(get(subject[0],         'firstName'), 'Max', 'subject should use the second value');
  });
});
