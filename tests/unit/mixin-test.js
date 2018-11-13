import ObjectProxy from '@ember/object/proxy';
import { get, set } from '@ember/object';
import ProxyMixin from 'ember-deep-buffered-proxy/mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | mixin', function(hooks) {
  const Proxy = ObjectProxy.extend(ProxyMixin);
  hooks.beforeEach(function() {
    this.content = {
      title: 'Post title',
      author: {
        firstName: 'John'
      },
      comments: [
        { text: 'firstComment' },
        { text: 'secondComment' }
      ],
      tags: [
        'travel', 'nature'
      ]
    };
    this.proxy = Proxy.create({ content: this.content });
  });


  test('it buffers simple values', function (assert) {
    assert.equal(get(this.proxy,    'hasBufferedChanges'), false, 'should be pristine');

    set(this.proxy, 'title', 'New title');

    assert.equal(get(this.proxy,    'isDirty'), true, 'should become dirty');
    assert.equal(get(this.proxy,    'title'), 'New title', 'proxy should use the new value');
    assert.equal(get(this.content,  'title'), 'Post title', 'content should keep the original value');

    this.proxy.discardBufferedChanges();

    assert.equal(get(this.proxy,    'isDirty'), false, 'should become pristine');
    assert.equal(get(this.proxy,    'title'), 'Post title', 'proxy should restore the original value');

    set(this.proxy, 'title', 'Second title');
    this.proxy.applyBufferedChanges();

    assert.equal(get(this.proxy,    'isDirty'), false, 'should become pristine again');
    assert.equal(get(this.proxy,    'title'), 'Second title', 'proxy should use the second value');
    assert.equal(get(this.content,  'title'), 'Second title', 'content should use the second value');
  });


  test('it buffers nested objects', function (assert) {
    assert.equal(get(this.proxy,    'isDirty'), false, 'should be pristine');

    set(this.proxy, 'author.firstName', 'James');

    assert.equal(get(this.proxy,    'isDirty'), true, 'should become dirty');
    assert.equal(get(this.proxy,    'author.firstName'), 'James', 'proxy should use the new value');
    assert.equal(get(this.content,  'author.firstName'), 'John', 'content should keep the original value');

    this.proxy.discardBufferedChanges();

    assert.equal(get(this.proxy,    'isDirty'), false, 'should become pristine');
    assert.equal(get(this.proxy,    'author.firstName'), 'John', 'proxy should restore the original value');

    set(this.proxy, 'author.firstName', 'Zoe');
    this.proxy.applyBufferedChanges();

    assert.equal(get(this.proxy,    'isDirty'), false, 'should become pristine again');
    assert.equal(get(this.proxy,    'author.firstName'), 'Zoe', 'proxy should use the second value');
    assert.equal(get(this.content,  'author.firstName'), 'Zoe', 'content should use the second value');

    let author = Proxy.create({ content: { firstName: 'William' } });
    set(this.proxy, 'author', author);

    assert.equal(get(this.proxy,    'author'), author, 'should handle proxy objects passed to setter');
  });
});
