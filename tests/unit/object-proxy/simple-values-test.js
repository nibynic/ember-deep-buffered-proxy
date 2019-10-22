import ObjectProxy from 'ember-deep-buffered-proxy/lib/object-proxy';
import { get, set } from '@ember/object';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import EmberObject, { computed } from '@ember/object';

module('Unit | Mixin | object proxy / simple values', function(hooks) {

  hooks.beforeEach(function() {
    this.content = {
      title: 'Post title'
    };
    this.proxy = ObjectProxy.wrap(this.content);
  });

  test('it detects changes', function (assert) {
    assert.equal(get(this.proxy,    'dbp.hasLocalChanges'), false, 'should be pristine');

    run(() => {
      set(this.proxy, 'title', 'New title');
    });

    assert.equal(get(this.proxy,    'dbp.hasChanges'), true, 'should become dirty');
    assert.equal(get(this.proxy,    'title'), 'New title', 'proxy should use the new value');
    assert.equal(get(this.content,  'title'), 'Post title', 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:  { title: 'Post title' },
      is:   { title: 'New title' }
    }, 'proxy should report local changes');
  });

  test('it discards changes', function (assert) {
    run(() => {
      set(this.proxy, 'title', 'New title');
      this.proxy.get('dbp').discardChanges();
    });

    assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(this.proxy,    'title'), 'Post title', 'proxy should restore the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:  {},
      is:   {}
    }, 'proxy should report no local changes');
  });

  test('it applies changes', function (assert) {
    run(() => {
      set(this.proxy, 'title', 'Second title');
      this.proxy.get('dbp').applyChanges();
    });

    assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(this.proxy,    'title'), 'Second title', 'proxy should use the second value');
    assert.equal(get(this.content,  'title'), 'Second title', 'content should use the second value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:  { },
      is:   { }
    }, 'proxy should report no local changes');
  });

  test('it updates on content changes', function (assert) {
    run(() => {
      set(this.content, 'title', 'Third title');
    });

    assert.equal(get(this.proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(this.proxy,    'title'), 'Third title', 'proxy should use the third value');
    assert.equal(get(this.content,  'title'), 'Third title', 'content should use the third value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:  { },
      is:   { }
    }, 'proxy should report no local changes');
  });

  test('it propagates changes to computed properties', function (assert) {
    let derivative = EmberObject.extend({
      title: computed('proxy.title', function() {
        return this.get('proxy.title');
      })
    }).create({ proxy: this.proxy });

    assert.equal(derivative.get('title'), 'Post title');

    run(() => {
      set(this.proxy, 'title', 'New title');
    });

    assert.equal(derivative.get('title'), 'New title');

    this.proxy.get('dbp').discardChanges();

    assert.equal(derivative.get('title'), 'Post title');
  });
});
