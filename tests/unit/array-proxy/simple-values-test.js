import { get } from '@ember/object';
import ArrayProxy from 'ember-deep-buffered-proxy/lib/array-proxy';
import { module, test } from 'qunit';

module('Unit | Mixin | array proxy / simple values', function(hooks) {
  hooks.beforeEach(function() {
    this.content = ['travel', 'nature'];
    this.proxy = ArrayProxy.wrap(this.content);
  });

  test('it detects changes on add', function (assert) {
    assert.equal(get(this.proxy,     'dbp.hasChanges'), false, 'should be pristine');

    this.proxy.pushObject('lifestyle');

    assert.equal(get(this.proxy,     'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(this.proxy, 'content'), ['travel', 'nature', 'lifestyle'], 'proxy should use the new value');
    assert.deepEqual(this.content,   ['travel', 'nature'], 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel', 'nature', 'lifestyle'],
      added:    ['lifestyle'],
      removed:  []
    }, 'proxy should report local changes');
  });

  test('it detects changes on remove', function (assert) {
    this.proxy.removeObject('nature');

    assert.equal(get(this.proxy,     'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(this.proxy, 'content'), ['travel'], 'proxy should use the new value');
    assert.deepEqual(this.content,   ['travel', 'nature'], 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel'],
      added:    [],
      removed:  ['nature']
    }, 'proxy should report removed objects');
  });

  test('it discards changes', function (assert) {
    this.proxy.pushObject('lifestyle');
    this.proxy.get('dbp').discardChanges();

    assert.equal(get(this.proxy,     'dbp.hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(this.proxy, 'content'), ['travel', 'nature'], 'proxy should restore the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');
  });

  test('it applies changes', function (assert) {
    this.proxy.removeObject('nature');
    this.proxy.get('dbp').applyChanges();

    assert.equal(get(this.proxy,     'dbp.hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(this.proxy, 'content'), ['travel'], 'proxy should use the second value');
    assert.deepEqual(this.content,   ['travel'], 'content should use the second value');

    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes again');
  });

  test('it updates on content changes', function (assert) {
    this.proxy.addObject('culture');

    assert.deepEqual(this.proxy.get('content'), ['travel', 'nature', 'culture']);

    this.content.addObject('sports');

    assert.deepEqual(this.proxy.get('content'), ['travel', 'nature', 'culture', 'sports']);
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      ['travel', 'nature', 'sports'],
      is:       ['travel', 'nature', 'culture', 'sports'],
      added:    ['culture'],
      removed:  []
    }, 'should report local changes');

    this.content.removeObject('travel');

    assert.deepEqual(this.proxy.get('content'), ['nature', 'culture', 'sports']);
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      ['nature', 'sports'],
      is:       ['nature', 'culture', 'sports'],
      added:    ['culture'],
      removed:  []
    }, 'should report local changes');
  });
});
