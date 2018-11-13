import ArrayProxy from '@ember/array/proxy';
import { get } from '@ember/object';
import { ArrayProxyMixin } from 'ember-deep-buffered-proxy';
import { module, test } from 'qunit';

module('Unit | Mixin | mixin', function() {
  const Proxy = ArrayProxy.extend(ArrayProxyMixin);

  test('it buffers simple values', function (assert) {
    let subject = ['travel', 'nature'];
    let proxy = Proxy.create({ subject: subject });

    assert.equal(get(proxy,     'isDirty'), false, 'should be pristine');

    proxy.pushObject('lifestyle');

    assert.equal(get(proxy,     'isDirty'), true, 'should become dirty');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature', 'lifestyle'], 'proxy should use the new value');
    assert.deepEqual(subject,   ['travel', 'nature'], 'subject should keep the original value');

    proxy.discardBufferedChanges();

    assert.equal(get(proxy,     'isDirty'), false, 'should become pristine');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature'], 'proxy should restore the original value');

    proxy.pushObject('coffee');
    proxy.applyBufferedChanges();

    assert.equal(get(proxy,     'isDirty'), false, 'should become pristine again');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature', 'coffee'], 'proxy should use the second value');
    assert.deepEqual(subject,   ['travel', 'nature', 'coffee'], 'subject should use the second value');
  });
});
