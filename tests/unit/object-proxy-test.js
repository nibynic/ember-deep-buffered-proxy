import ObjectProxy from '@ember/object/proxy';
import { get, set } from '@ember/object';
import { ObjectProxyMixin } from 'ember-deep-buffered-proxy';
import { ArrayProxy } from 'ember-deep-buffered-proxy';
import { A } from '@ember/array';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import sinon from 'sinon';

module('Unit | Mixin | object proxy', function() {
  const Proxy = ObjectProxy.extend(ObjectProxyMixin);

  test('it buffers simple values', function (assert) {
    let subject = {
      title: 'Post title'
    };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,    'hasLocalChanges'), false, 'should be pristine');

    run(() => {
      set(proxy, 'title', 'New title');
    });

    assert.equal(get(proxy,    'hasChanges'), true, 'should become dirty');
    assert.equal(get(proxy,    'title'), 'New title', 'proxy should use the new value');
    assert.equal(get(subject,  'title'), 'Post title', 'subject should keep the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was:  { title: 'Post title' },
      is:   { title: 'New title' }
    }, 'proxy should report local changes');

    run(() => {
      proxy.discardChanges();
    });

    assert.equal(get(proxy,    'hasChanges'), false, 'should become pristine');
    assert.equal(get(proxy,    'title'), 'Post title', 'proxy should restore the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was:  {},
      is:   {}
    }, 'proxy should report no local changes');

    run(() => {
      set(proxy, 'title', 'Second title');
      proxy.applyChanges();
    });

    assert.equal(get(proxy,    'hasChanges'), false, 'should become pristine again');
    assert.equal(get(proxy,    'title'), 'Second title', 'proxy should use the second value');
    assert.equal(get(subject,  'title'), 'Second title', 'subject should use the second value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was:  { },
      is:   { }
    }, 'proxy should report no local changes again');
  });


  test('it buffers nested objects', function (assert) {
    let author = { firstName: 'John' };
    let subject = { author: author };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,    'hasChanges'), false, 'should be pristine');

    run(() => set(proxy, 'author.firstName', 'James'));

    assert.equal(get(proxy,    'hasChanges'), true, 'should become dirty');

    proxy.notifyPropertyChange('localChanges');

    assert.equal(get(proxy,    'hasLocalChanges'), false, 'should not detect any local changes');
    assert.equal(get(proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(subject,  'author.firstName'), 'John', 'subject should keep the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'changes'), [{
      subject: author,
      was: {
        firstName: 'John'
      },
      is: {
        firstName: 'James'
      }
    }], 'proxy should report nested objects changes');

    proxy.discardChanges();

    run(() => {
      assert.equal(get(proxy,    'hasChanges'), false, 'should become pristine');
      assert.equal(get(proxy,    'author.firstName'), 'John', 'proxy should restore the original value');
      assert.deepEqual(get(proxy, 'localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'changes'), [], 'proxy should report no nested objects changes');
    });

    run(() => {
      set(proxy, 'author.firstName', 'Zoe');
      proxy.applyChanges();
    });

    run(() => {
      assert.equal(get(proxy,    'hasChanges'), false, 'should become pristine again');
      assert.equal(get(proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
      assert.equal(get(subject,  'author.firstName'), 'Zoe', 'subject should use the second value');
      assert.deepEqual(get(proxy, 'localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(proxy, 'changes'), [], 'proxy should report no nested objects changes again');
    });

    let author2 = { firstName: 'William' };
    let author2Proxy = Proxy.create({ subject: author2 });
    run(() => {
      set(proxy, 'author', author2Proxy);
    });

    assert.equal(get(proxy,    'author'), author2Proxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was: {
        author: author
      },
      is: {
        author: author2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(proxy, 'changes'), [{
      subject: subject,
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
    let subject = { tags: tags };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,       'hasChanges'), false, 'should be pristine');

    run(() => {
      A(get(proxy, 'tags')).addObject('cookies');
    });

    assert.equal(get(proxy,       'hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee', 'cookies'], 'proxy should use the new value');
    assert.deepEqual(get(subject, 'tags').toArray(), ['lifestyle', 'coffee'], 'subject should keep the original value');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was: {},
      is: {}
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'changes'), [{
      subject: tags,
      was:      ['lifestyle', 'coffee'],
      is:       ['lifestyle', 'coffee', 'cookies'],
      added:    ['cookies'],
      removed:  []
    }], 'proxy should report nested objects changes');

    proxy.discardChanges();

    run(() => {
      assert.equal(get(proxy,       'hasChanges'), false, 'should become pristine');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee'], 'proxy should restore the original value');
      assert.deepEqual(get(proxy, 'localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'changes'), [], 'proxy should report no nested objects changes');
    });

    run(() => {
      A(get(proxy, 'tags')).removeObject('lifestyle');
      proxy.applyChanges();
    });

    run(() => {
      assert.equal(get(proxy,       'hasChanges'), false, 'should become pristine again');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['coffee'], 'proxy should use the second value');
      assert.deepEqual(get(subject, 'tags').toArray(), ['coffee'], 'subject should use the second value');
      assert.deepEqual(get(proxy, 'localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes again');
      assert.deepEqual(get(proxy, 'changes'), [], 'proxy should report no nested objects changes again');
    });

    let tags2 = ['plants', 'gardening'];
    let tags2Proxy = ArrayProxy.create({ subject: tags2 });
    run(() => {
      set(proxy, 'tags', tags2Proxy);
    });

    assert.equal(get(proxy,       'tags'), tags2Proxy, 'should handle proxy objects passed to the setter');
    assert.deepEqual(get(proxy, 'localChanges'), {
      was: {
        tags: tags
      },
      is: {
        tags: tags2
      }
    }, 'proxy should report local changes');
    assert.deepEqual(get(proxy, 'changes'), [{
      subject: subject,
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
      assert.deepEqual(get(proxy,       'tags.subject'), tags3, 'should handle objects passed to the setter');
      assert.deepEqual(get(proxy, 'localChanges'), {
        was: {},
        is: {}
      }, 'proxy should report no local changes');
      assert.deepEqual(get(proxy, 'changes'), [], 'proxy should report no changes');
    });
  });

  test('it buffers method calls', function (assert) {
    let attributeOnDelete;
    let stub = sinon.stub().callsFake(
      () => attributeOnDelete = proxy.subject.attribute
    );

    let proxy = Proxy.create({
      subject: {
        attribute: 'before',
        deleteRecord: stub
      }
    });

    run(() => {
      proxy.set('markedForDeleteRecord', true);
      proxy.set('attribute', 'after');
    });

    assert.ok(stub.notCalled, 'should not call deleteRecord');

    proxy.applyChanges();

    assert.ok(stub.calledOnce, 'should call deleteRecord on applyChanges');
    assert.equal(attributeOnDelete, 'after', 'should call deleteRecord after all changes were applied');

    proxy = Proxy.create({
      subject: {
        content: {
          deleteRecord: stub
        }
      }
    });
    stub.reset();
    run(() => {
      proxy.set('markedForDeleteRecord', true);
    });
    proxy.applyChanges();

    assert.ok(stub.calledOnce, 'should find deleteRecord in subject content');
  });
});
