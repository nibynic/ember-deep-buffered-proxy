import ObjectProxy from 'ember-deep-buffered-proxy/lib/object-proxy';
import ArrayProxy from 'ember-deep-buffered-proxy/lib/array-proxy';
import { get, set } from '@ember/object';
import { A } from '@ember/array';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import sinon from 'sinon';
import EmberObject, { computed } from '@ember/object';

module('Unit | Mixin | object proxy', function() {

  test('it buffers simple values', function (assert) {
    let content = {
      title: 'Post title'
    };
    let proxy = ObjectProxy.wrap(content);

    assert.equal(get(proxy,    'dbp.hasLocalChanges'), false, 'should be pristine');

    run(() => {
      set(proxy, 'title', 'New title');
    });

    assert.equal(get(proxy,    'dbp.hasChanges'), true, 'should become dirty');
    assert.equal(get(proxy,    'title'), 'New title', 'proxy should use the new value');
    assert.equal(get(content,  'title'), 'Post title', 'content should keep the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:  { title: 'Post title' },
      is:   { title: 'New title' }
    }, 'proxy should report local changes');

    run(() => {
      proxy.get('dbp').discardChanges();
    });

    assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(proxy,    'title'), 'Post title', 'proxy should restore the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:  {},
      is:   {}
    }, 'proxy should report no local changes');

    run(() => {
      set(proxy, 'title', 'Second title');
      proxy.get('dbp').applyChanges();
    });

    assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(proxy,    'title'), 'Second title', 'proxy should use the second value');
    assert.equal(get(content,  'title'), 'Second title', 'content should use the second value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:  { },
      is:   { }
    }, 'proxy should report no local changes');

    set(content, 'title', 'Third title');

    assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should become pristine');
    assert.equal(get(proxy,    'title'), 'Third title', 'proxy should use the third value');
    assert.equal(get(content,  'title'), 'Third title', 'content should use the third value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:  { },
      is:   { }
    }, 'proxy should report no local changes');
  });

  test('it propagates changes to computed properties', function (assert) {
    let content = {
      title: 'Post title'
    };
    let proxy = ObjectProxy.wrap(content);
    let derivative = EmberObject.extend({
      title: computed('proxy.title', function() {
        return this.get('proxy.title');
      })
    }).create({ proxy });

    assert.equal(derivative.get('title'), 'Post title');

    run(() => {
      set(proxy, 'title', 'New title');
    });

    assert.equal(derivative.get('title'), 'New title');

    proxy.get('dbp').discardChanges();

    assert.equal(derivative.get('title'), 'Post title');
  });


  test('it buffers nested objects', function (assert) {
    let author = { firstName: 'John' };
    let content = { author: author };
    let proxy = ObjectProxy.wrap(content);

    assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should be pristine');

    run(() => set(proxy, 'author.firstName', 'James'));

    assert.equal(get(proxy,    'dbp.hasChanges'), true, 'should become dirty');

    proxy.get('dbp').notifyPropertyChange('localChanges');

    assert.equal(get(proxy,    'dbp.hasLocalChanges'), false, 'should not detect any local changes');
    assert.equal(get(proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(content,  'author.firstName'), 'John', 'content should keep the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [{
      content: author,
      was: {
        firstName: 'John'
      },
      is: {
        firstName: 'James'
      }
    }], 'proxy should report nested objects changes');

    proxy.get('dbp').discardChanges();

    run(() => {
      assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should become pristine');
      assert.equal(get(proxy,    'author.firstName'), 'John', 'proxy should restore the original value');
      assert.deepEqual(get(proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');
    });

    run(() => {
      set(proxy, 'author.firstName', 'Zoe');
      proxy.get('dbp').applyChanges();
    });

    run(() => {
      assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should become pristine again');
      assert.equal(get(proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
      assert.equal(get(content,  'author.firstName'), 'Zoe', 'content should use the second value');
      assert.deepEqual(get(proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
    });

    let author2 = { firstName: 'William' };
    let author2ObjectProxy = ObjectProxy.wrap(author2);
    run(() => {
      set(proxy, 'author', author2ObjectProxy);
    });

    assert.equal(get(proxy,    'author'), author2ObjectProxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was: {
        author: author
      },
      is: {
        author: author2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [{
      content: content,
      was: {
        author: author
      },
      is: {
        author: author2
      }
    }], 'proxy should report only local changes');
  });

  test('it buffers nested arrays', function (assert) {
    let tags = ['lifestyle', 'coffee']
    let content = { tags: tags };
    let proxy = ObjectProxy.wrap(content);

    assert.equal(get(proxy,       'dbp.hasChanges'), false, 'should be pristine');

    run(() => {
      A(get(proxy, 'tags')).addObject('cookies');
    });

    assert.equal(get(proxy,       'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee', 'cookies'], 'proxy should use the new value');
    assert.deepEqual(get(content, 'tags').toArray(), ['lifestyle', 'coffee'], 'content should keep the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [{
      content: tags,
      was:      ['lifestyle', 'coffee'],
      is:       ['lifestyle', 'coffee', 'cookies'],
      added:    ['cookies'],
      removed:  []
    }], 'proxy should report nested objects changes');

    proxy.get('dbp').discardChanges();

    run(() => {
      assert.equal(get(proxy,       'dbp.hasChanges'), false, 'should become pristine');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee'], 'proxy should restore the original value');
      assert.deepEqual(get(proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');
    });

    run(() => {
      A(get(proxy, 'tags')).removeObject('lifestyle');
      proxy.get('dbp').applyChanges();
    });

    run(() => {
      assert.equal(get(proxy,       'dbp.hasChanges'), false, 'should become pristine again');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['coffee'], 'proxy should use the second value');
      assert.deepEqual(get(content, 'tags').toArray(), ['coffee'], 'content should use the second value');
      assert.deepEqual(get(proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
    });

    let tags2 = ['plants', 'gardening'];
    let tags2ObjectProxy = ArrayProxy.wrap(tags2);
    run(() => {
      set(proxy, 'tags', tags2ObjectProxy);
    });

    assert.equal(get(proxy,       'tags'), tags2ObjectProxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was: {
        tags: tags
      },
      is: {
        tags: tags2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [{
      content: content,
      was: {
        tags: tags
      },
      is: {
        tags: tags2
      }
    }], 'proxy should report only local changes');

    let tags3 = tags.slice();
    run(() => {
      set(proxy, 'tags', tags3);
    });

    run(() => {
      assert.deepEqual(get(proxy, 'tags.dbp.content'), tags3, 'should handle objects passed to the setter');
      assert.deepEqual(get(proxy, 'dbp.localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no changes');
    });
  });

  test('it buffers method calls', function (assert) {
    let attributeOnDelete;
    let stub = sinon.stub().callsFake(
      () => attributeOnDelete = proxy.get('dbp.content.attribute')
    );

    let proxy = ObjectProxy.wrap({
      attribute: 'before',
      deleteRecord: stub
    });

    run(() => {
      proxy.set('markedForDeleteRecord', true);
      proxy.set('attribute', 'after');
    });

    assert.ok(stub.notCalled, 'should not call deleteRecord');

    proxy.get('dbp').applyChanges();

    assert.ok(stub.calledOnce, 'should call deleteRecord on applyChanges');
    assert.equal(attributeOnDelete, 'after', 'should call deleteRecord after all changes were applied');

    proxy = ObjectProxy.wrap({
      content: {
        deleteRecord: stub
      }
    });
    stub.reset();
    run(() => {
      proxy.set('markedForDeleteRecord', true);
    });
    proxy.get('dbp').applyChanges();

    assert.ok(stub.calledOnce, 'should find deleteRecord in content content');
  });
});
