import { set, get } from '@ember/object';
import ArrayProxy from 'ember-deep-buffered-proxy/lib/array-proxy';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';

module('Unit | Mixin | array proxy / nested objects', function(hooks) {
  hooks.beforeEach(function() {
    this.person = { firstName: 'Joana' };
    this.content = [ this.person ];
    this.proxy = ArrayProxy.wrap(this.content);
  });

  test('it detects changes', function (assert) {
    assert.equal(get(this.proxy,                 'dbp.hasChanges'), false, 'should be pristine');

    run(() => {
      set(this.proxy.objectAt(0), 'firstName', 'Tilde');
    });

    assert.equal(get(this.proxy,                 'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(this.proxy.objectAt(0), 'firstName'), 'Tilde', 'proxy should use the new value');
    assert.deepEqual(get(this.content[0],        'firstName'), 'Joana', 'content should keep the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [{
      content: this.person,
      was: {
        firstName: 'Joana'
      },
      is: {
        firstName: 'Tilde'
      }
    }], 'proxy should report nested objects changes');
  });

  test('it discards changes', function (assert) {
    run(() => {
      set(this.proxy.objectAt(0), 'firstName', 'Tilde');
      this.proxy.get('dbp').discardChanges();
    });

    assert.equal(get(this.proxy,                  'dbp.hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(this.proxy.objectAt(0),  'firstName'), 'Joana', 'proxy should restore the original value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');
  });

  test('it applies changes', function (assert) {
    run(() => {
      this.proxy.objectAt(0).set('firstName', 'Max');
      this.proxy.get('dbp').applyChanges();
    });

    assert.equal(get(this.proxy,                  'dbp.hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(this.proxy.objectAt(0),  'firstName'), 'Max', 'proxy should use the second value');
    assert.deepEqual(get(this.content[0],         'firstName'), 'Max', 'content should use the second value');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes again');
    assert.deepEqual(get(this.proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
  });

  test('it updates on content changes', function (assert) {
    let person1 = this.person;
    let person2 = { firstName: 'Mike' };
    let person3 = { firstName: 'Amelie' };

    this.proxy.addObject(person2);

    assert.deepEqual(this.proxy.mapBy('dbp.content'), [person1, person2], 'should add person2');

    this.content.addObject(person3);

    assert.deepEqual(this.proxy.mapBy('dbp.content'), [person1, person2, person3], 'should add person3');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [person1, person3],
      is:       [person1, person2, person3],
      added:    [person2],
      removed:  []
    }, 'should report local changes');

    this.content.removeObject(person1);

    assert.deepEqual(this.proxy.mapBy('dbp.content'), [person2, person3], 'should remove person1');
    assert.deepEqual(get(this.proxy, 'dbp.localChanges'), {
      was:      [person3],
      is:       [person2, person3],
      added:    [person2],
      removed:  []
    }, 'should report local changes');
  });
});
