import buildProxy, { ObjectProxy } from 'ember-deep-buffered-proxy';
import { get, set } from '@ember/object';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import sinon from 'sinon';

module('Unit | Utils | build proxy', function() {

  test('it creates proxy', function (assert) {
    let content = {
      title: 'Post title'
    };
    let proxy = buildProxy(content);

    assert.equal(get(proxy,    'dbp.hasChanges'), false, 'should be pristine');

    run(() => {
      set(proxy, 'title', 'New title');
    });

    assert.equal(get(proxy,    'dbp.hasChanges'), true, 'should become dirty');
  });

  test('it uses provided proxyClassFor', function (assert) {
    const MyProxy = ObjectProxy.extend();
    let content = {
      title: 'Post title',
      author: { firstName: 'Jan' }
    };
    let proxyClassFor = sinon.stub().returns(MyProxy);
    let proxy = buildProxy(content, { proxyClassFor });

    run(() => {
      assert.ok(proxy.get('author') instanceof MyProxy);
    });    
    assert.equal(proxyClassFor.getCall(0).args[0], content);
    assert.equal(proxyClassFor.getCall(1).args[0], content.author);
  });
});
