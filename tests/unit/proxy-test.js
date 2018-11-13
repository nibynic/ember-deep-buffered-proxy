import ObjectProxy from '@ember/object/proxy';
import { get, set } from '@ember/object';
import { ProxyMixin } from 'ember-deep-buffered-proxy';
import { module, test } from 'qunit';

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

    set(proxy, 'author.firstName', 'James');

    assert.equal(get(proxy,    'isDirty'), true, 'should become dirty');

    assert.equal(get(proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(subject,  'author.firstName'), 'John', 'subject should keep the original value');

    proxy.discardBufferedChanges();

    assert.equal(get(proxy,    'isDirty'), false, 'should become pristine');
    assert.equal(get(proxy,    'author.firstName'), 'John', 'proxy should restore the original value');

    set(proxy, 'author.firstName', 'Zoe');
    proxy.applyBufferedChanges();

    assert.equal(get(proxy,    'isDirty'), false, 'should become pristine again');
    assert.equal(get(proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
    assert.equal(get(subject,  'author.firstName'), 'Zoe', 'subject should use the second value');

    let author = Proxy.create({ subject: { firstName: 'William' } });
    set(proxy, 'author', author);

    assert.equal(get(proxy,    'author'), author, 'should handle proxy objects passed to the setter');
  });
});
