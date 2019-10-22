import ObjectProxy from 'ember-deep-buffered-proxy/lib/object-proxy';
import { get, set } from '@ember/object';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';

module('Unit | Mixin | object proxy / nested objects', function(hooks) {

  hooks.beforeEach(function() {
    this.author = { firstName: 'John' };
    this.content = { author: this.author };
    this.proxy = ObjectProxy.wrap(this.content);
  });

  test('it detects changes', function (assert) {
    assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should be pristine');

    run(() => set(this.proxy, 'author.firstName', 'James'));

    assert.equal(get(this.proxy,    'dbp.hasChanges'), true, 'should become dirty');

    this.proxy.get('dbp').notifyPropertyChange('localChanges');

    assert.equal(get(this.proxy,    'dbp.hasLocalChanges'), false, 'should not detect any local changes');
    assert.equal(get(this.proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(this.content,  'author.firstName'), 'John', 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [{
      content: this.author,
      was: {
        firstName: 'John'
      },
      is: {
        firstName: 'James'
      }
    }], 'proxy should report nested objects changes');
  });

  test('it discards changes', function (assert) {
    run(() => {
      set(this.proxy, 'author.firstName', 'James');
      this.proxy.get('dbp').discardChanges();
    });

    run(() => {
      assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should become pristine');
      assert.equal(get(this.proxy,    'author.firstName'), 'John', 'proxy should restore the original value');
      assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');
    });
  });

  test('it applies changes', function (assert) {
    run(() => {
      set(this.proxy, 'author.firstName', 'Zoe');
      this.proxy.get('dbp').applyChanges();
    });

    run(() => {
      assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should become pristine again');
      assert.equal(get(this.proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
      assert.equal(get(this.content,  'author.firstName'), 'Zoe', 'content should use the second value');
      assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
    });
  });

  test('it accepts proxy objects passed to the setter', function (assert) {
    let author2 = { firstName: 'William' };
    let author2ObjectProxy = ObjectProxy.wrap(author2);
    run(() => {
      set(this.proxy, 'author', author2ObjectProxy);
    });

    assert.equal(get(this.proxy,    'author'), author2ObjectProxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was: {
        author: this.author
      },
      is: {
        author: author2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [{
      content: this.content,
      was: {
        author: this.author
      },
      is: {
        author: author2
      }
    }], 'proxy should report only local changes');
  });
});
