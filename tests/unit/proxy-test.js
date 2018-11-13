import ObjectProxy from '@ember/object/proxy';
import { get, set } from '@ember/object';
import { ProxyMixin } from 'ember-deep-buffered-proxy';
import { ArrayProxy } from 'ember-deep-buffered-proxy';
import { A } from '@ember/array';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';

module('Unit | Mixin | proxy mixin', function() {
  const Proxy = ObjectProxy.extend(ProxyMixin);

  test('it buffers simple values', function (assert) {
    let subject = {
      title: 'Post title'
    };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,    'hasBufferedChanges'), false, 'should be pristine');

    set(proxy, 'title', 'New title');

    assert.equal(get(proxy,    'isDirty'), true, 'should become dirty');
    assert.equal(get(proxy,    'title'), 'New title', 'proxy should use the new value');
    assert.equal(get(subject,  'title'), 'Post title', 'subject should keep the original value');

    proxy.discardBufferedChanges();

    assert.equal(get(proxy,    'isDirty'), false, 'should become pristine');
    assert.equal(get(proxy,    'title'), 'Post title', 'proxy should restore the original value');

    set(proxy, 'title', 'Second title');
    proxy.applyBufferedChanges();

    assert.equal(get(proxy,    'isDirty'), false, 'should become pristine again');
    assert.equal(get(proxy,    'title'), 'Second title', 'proxy should use the second value');
    assert.equal(get(subject,  'title'), 'Second title', 'subject should use the second value');
  });


  test('it buffers nested objects', function (assert) {
    let subject = {
      author: {
        firstName: 'John'
      }
    };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,    'isDirty'), false, 'should be pristine');

    run(() => set(proxy, 'author.firstName', 'James'));

    assert.equal(get(proxy,    'isDirty'), true, 'should become dirty');

    assert.equal(get(proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(subject,  'author.firstName'), 'John', 'subject should keep the original value');

    proxy.discardBufferedChanges();

    run(() => {
      assert.equal(get(proxy,    'isDirty'), false, 'should become pristine');
      assert.equal(get(proxy,    'author.firstName'), 'John', 'proxy should restore the original value');
    });

    run(() => {
      set(proxy, 'author.firstName', 'Zoe');
      proxy.applyBufferedChanges();
    });

    run(() => {
      assert.equal(get(proxy,    'isDirty'), false, 'should become pristine again');
      assert.equal(get(proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
      assert.equal(get(subject,  'author.firstName'), 'Zoe', 'subject should use the second value');
    });

    let author = Proxy.create({ subject: { firstName: 'William' } });
    set(proxy, 'author', author);

    assert.equal(get(proxy,    'author'), author, 'should handle proxy objects passed to the setter');
  });

  test('it buffers nested arrays', function (assert) {
    let subject = {
      tags: ['lifestyle', 'coffee']
    };
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,       'isDirty'), false, 'should be pristine');

    run(() => {
      A(get(proxy, 'tags')).addObject('cookies');
    });

    assert.equal(get(proxy,       'isDirty'), true, 'should become dirty');

    assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee', 'cookies'], 'proxy should use the new value');
    assert.deepEqual(get(subject, 'tags').toArray(), ['lifestyle', 'coffee'], 'subject should keep the original value');

    proxy.discardBufferedChanges();

    run(() => {
      assert.equal(get(proxy,       'isDirty'), false, 'should become pristine');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['lifestyle', 'coffee'], 'proxy should restore the original value');
    });

    run(() => {
      A(get(proxy, 'tags')).removeObject('lifestyle');
      proxy.applyBufferedChanges();
    });

    run(() => {
      assert.equal(get(proxy,       'isDirty'), false, 'should become pristine again');
      assert.deepEqual(get(proxy,   'tags').toArray(), ['coffee'], 'proxy should use the second value');
      assert.deepEqual(get(subject, 'tags').toArray(), ['coffee'], 'subject should use the second value');
    });

    let tags = ArrayProxy.create({ subject: ['plants', 'gardening'] });

    set(proxy, 'tags', tags);

    assert.equal(get(proxy,       'tags'), tags, 'should handle proxy objects passed to the setter');
  });
});
