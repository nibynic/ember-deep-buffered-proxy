import ObjectProxy from 'ember-deep-buffered-proxy/lib/object-proxy';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import sinon from 'sinon';

module('Unit | Mixin | object proxy / method calling', function(hooks) {

  hooks.beforeEach(function() {
    this.stub = sinon.stub();
    this.content = { deleteRecord: this.stub };
    this.proxy = ObjectProxy.wrap(this.content);
    run(() => {
      this.proxy.set('markedForDeleteRecord', true);
    });
  });

  test('it handles markedFor... flags', function (assert) {
    assert.ok(this.stub.notCalled, 'should not call deleteRecord');

    this.proxy.get('dbp').applyChanges();

    assert.ok(this.stub.calledOnce, 'should call deleteRecord on applyChanges');
  });

  test('it calls methods afters all changes were applied', function (assert) {
    this.content.attribute = 'before';
    let attributeOnDelete;
    this.stub.callsFake(
      () => attributeOnDelete = this.content.attribute
    );

    run(() => {
      this.proxy.set('attribute', 'after');
      this.proxy.get('dbp').applyChanges();
    });

    assert.equal(attributeOnDelete, 'after', 'should call deleteRecord after all changes were applied');
  });

  test('it finds method in a multi-level proxy', function (assert) {
    let proxy = ObjectProxy.wrap({
      content: this.content
    });
    run(() => {
      proxy.set('markedForDeleteRecord', true);
    });
    proxy.get('dbp').applyChanges();

    assert.ok(this.stub.calledOnce, 'should find deleteRecord in content content');
  });
});
