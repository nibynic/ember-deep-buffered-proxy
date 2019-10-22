import ObjectProxy from 'ember-deep-buffered-proxy/lib/object-proxy';
import ArrayProxy from 'ember-deep-buffered-proxy/lib/array-proxy';
import { get, set } from '@ember/object';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import { A } from '@ember/array';

module('Unit | Mixin | object proxy / nested arrays', function(hooks) {

  hooks.beforeEach(function() {
    this.tags = ['lifestyle', 'coffee']
    this.content = { tags: this.tags };
    this.proxy = ObjectProxy.wrap(this.content);
  });

  test('it detects changes', function (assert) {
    assert.equal(get(this.proxy,       'dbp.hasChanges'), false, 'should be pristine');

    run(() => {
      A(get(this.proxy, 'tags')).addObject('cookies');
    });

    assert.equal(get(this.proxy,       'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(this.proxy,   'tags').toArray(), ['lifestyle', 'coffee', 'cookies'], 'proxy should use the new value');
    assert.deepEqual(get(this.content, 'tags').toArray(), ['lifestyle', 'coffee'], 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [{
      content:  this.tags,
      was:      ['lifestyle', 'coffee'],
      is:       ['lifestyle', 'coffee', 'cookies'],
      added:    ['cookies'],
      removed:  []
    }], 'proxy should report nested objects changes');
  });

  test('it discards changes', function (assert) {
    this.proxy.get('dbp').discardChanges();

    run(() => {
      assert.equal(get(this.proxy,       'dbp.hasChanges'), false, 'should become pristine');
      assert.deepEqual(get(this.proxy,   'tags').toArray(), ['lifestyle', 'coffee'], 'proxy should restore the original value');
      assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');
    });
  });

  test('it applies changes', function (assert) {
    run(() => {
      A(get(this.proxy, 'tags')).removeObject('lifestyle');
      this.proxy.get('dbp').applyChanges();
    });

    run(() => {
      assert.equal(get(this.proxy,       'dbp.hasChanges'), false, 'should become pristine again');
      assert.deepEqual(get(this.proxy,   'tags').toArray(), ['coffee'], 'proxy should use the second value');
      assert.deepEqual(get(this.content, 'tags').toArray(), ['coffee'], 'content should use the second value');
      assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
    });
  });

  test('it accepts proxy arrays passed to the setter', function (assert) {
    let tags2 = ['plants', 'gardening'];
    let tags2ObjectProxy = ArrayProxy.wrap(tags2);
    run(() => {
      set(this.proxy, 'tags', tags2ObjectProxy);
    });

    assert.equal(get(this.proxy,       'tags'), tags2ObjectProxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was: {
        tags: this.tags
      },
      is: {
        tags: tags2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [{
      content: this.content,
      was: {
        tags: this.tags
      },
      is: {
        tags: tags2
      }
    }], 'proxy should report only local changes');
  });

  test('it accepts plain arrays passed to the setter', function (assert) {
    let tags3 = this.tags.slice();
    run(() => {
      set(this.proxy, 'tags', tags3);
    });

    run(() => {
      assert.deepEqual(get(this.proxy, 'tags.dbp.content'), tags3, 'should handle objects passed to the setter');
      assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no changes');
    });
  });
});
