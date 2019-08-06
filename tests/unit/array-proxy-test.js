import { get, set } from '@ember/object';
import buildArrayProxy from 'ember-deep-buffered-proxy/lib/array-proxy';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import { A } from '@ember/array';

module('Unit | Mixin | array proxy', function() {
  test('it buffers simple values', function (assert) {
    let content = ['travel', 'nature'];
    let proxy = buildArrayProxy(content);

    assert.equal(get(proxy,     'dbp.hasChanges'), false, 'should be pristine');

    proxy.pushObject('lifestyle');

    assert.equal(get(proxy,     'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature', 'lifestyle'], 'proxy should use the new value');
    assert.deepEqual(content,   ['travel', 'nature'], 'content should keep the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel', 'nature', 'lifestyle'],
      added:    ['lifestyle'],
      removed:  []
    }, 'proxy should report local changes');

    proxy.get('dbp').discardChanges();

    assert.equal(get(proxy,     'dbp.hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(proxy, 'content'), ['travel', 'nature'], 'proxy should restore the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');

    proxy.removeObject('nature');

    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      ['travel', 'nature'],
      is:       ['travel'],
      added:    [],
      removed:  ['nature']
    }, 'proxy should report removed objects');

    proxy.get('dbp').applyChanges();

    assert.equal(get(proxy,     'dbp.hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(proxy, 'content'), ['travel'], 'proxy should use the second value');
    assert.deepEqual(content,   ['travel'], 'content should use the second value');

    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes again');
  });

  test('it buffers object values', function (assert) {
    let person = { firstName: 'Joana' };
    let content = [ person ];
    let proxy = buildArrayProxy(content);

    assert.equal(get(proxy,                 'dbp.hasChanges'), false, 'should be pristine');

    run(() => {
      set(proxy.objectAt(0), 'firstName', 'Tilde');
    });

    assert.equal(get(proxy,                 'dbp.hasChanges'), true, 'should become dirty');
    assert.deepEqual(get(proxy.objectAt(0), 'firstName'), 'Tilde', 'proxy should use the new value');
    assert.deepEqual(get(content[0],        'firstName'), 'Joana', 'content should keep the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [{
      content: person,
      was: {
        firstName: 'Joana'
      },
      is: {
        firstName: 'Tilde'
      }
    }], 'proxy should report nested objects changes');

    proxy.get('dbp').discardChanges();

    assert.equal(get(proxy,                  'dbp.hasChanges'), false, 'should become pristine');
    assert.deepEqual(get(proxy.objectAt(0),  'firstName'), 'Joana', 'proxy should restore the original value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes');
    assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes');

    run(() => {
      proxy.objectAt(0).set('firstName', 'Max');
      proxy.get('dbp').applyChanges();
    });

    assert.equal(get(proxy,                  'dbp.hasChanges'), false, 'should become pristine again');
    assert.deepEqual(get(proxy.objectAt(0),  'firstName'), 'Max', 'proxy should use the second value');
    assert.deepEqual(get(content[0],         'firstName'), 'Max', 'content should use the second value');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [],
      is:       [],
      added:    [],
      removed:  []
    }, 'proxy should report no local changes again');
    assert.deepEqual(get(proxy, 'dbp.changes'), [], 'proxy should report no nested objects changes again');
  });

  test('it updates on content changes', function (assert) {
    let person1 = { firstName: 'Joana' };
    let person2 = { firstName: 'Mike' };
    let person3 = { firstName: 'Amelie' };
    let content = A([ person1 ]);
    let proxy = buildArrayProxy(content);

    proxy.addObject(person2);

    assert.deepEqual(proxy.mapBy('dbp.content'), [person1, person2], 'should add person2');

    content.addObject(person3);

    assert.deepEqual(proxy.mapBy('dbp.content'), [person1, person2, person3], 'should add person3');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [person1, person3],
      is:       [person1, person2, person3],
      added:    [person2],
      removed:  []
    }, 'should report local changes');

    content.removeObject(person1);

    assert.deepEqual(proxy.mapBy('dbp.content'), [person2, person3], 'should remove person1');
    assert.deepEqual(get(proxy, 'dbp.localChanges'), {
      was:      [person3],
      is:       [person2, person3],
      added:    [person2],
      removed:  []
    }, 'should report local changes');
  });
});
