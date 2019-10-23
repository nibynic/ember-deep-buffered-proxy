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

  test('it uses provided proxyClassFor method', function (assert) {
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

  test('it uses provided serialize method', function (assert) {
    let date1 = new Date('2019-03-21');
    let date2 = new Date('2019-03-21');
    let content = {
      createdAt: date1
    };
    let serialize = sinon.stub().callsFake((d) => d && d.getTime());
    let proxy = buildProxy(content, { serialize });

    run(() => {
      proxy.set('createdAt', date2);
    });
    assert.equal(serialize.getCall(1).args[0], date2);
    assert.equal(serialize.getCall(2).args[0], date1);
    assert.equal(proxy.get('dbp.hasChanges'), false);
  });
});
