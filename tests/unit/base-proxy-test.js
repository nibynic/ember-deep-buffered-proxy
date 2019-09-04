import EmberObject, { computed, defineProperty } from '@ember/object';
import { DriverMixin, ClassMixin } from 'ember-deep-buffered-proxy/lib/base-proxy';
import { module, test } from 'qunit';

module('Unit | Mixin | base proxy', function() {
  const Proxy = EmberObject.extend({}).reopenClass(ClassMixin, {
    Driver: EmberObject.extend(DriverMixin, {
      buffer: computed({
        get: () => ({}),
        set: (k, v) => v
      }),
      eachBufferEntry(callback) {
        Object.entries(this.get('buffer')).forEach(([k, v]) => callback(k, v));
      },
      localChanges: computed({
        get: () => ({ was: {}, is: {} }),
        set: (k, v) => v
      }),
      hasLocalChanges: computed('localChanges', function() {
        return Object.keys(this.get('localChanges.is')).length > 0;
      })
    })
  });
  function buildProxy(attrs = {}) {
    return Proxy.create({ dbp: Proxy.Driver.create(attrs) });
  }
  function override(object, key, value) {
    defineProperty(object, key, computed({
      get: () => value,
      set: (k, v) => v
    }));
  }

  test('it detects child proxies', function (assert) {
    let author = buildProxy();
    let proxy = buildProxy({
      buffer: {
        author: author,
        reviewer: {}
      }
    });

    assert.deepEqual(proxy.get('dbp.childProxies'), [ author ], 'should return author');
  });

  test('it observes changes in nested proxies', function (assert) {
    let child = buildProxy();
    override(child.dbp, 'hasChanges', false);

    let proxy = buildProxy();
    override(proxy.dbp, 'childProxies', [child]);

    assert.notOk(proxy.get('dbp.hasChanges'), 'should be false');

    child.set('dbp.hasChanges', true);

    assert.ok(proxy.get('dbp.hasChanges'), 'should be true');
  });

  test('it collects changes from nested proxies', function (assert) {
    let proxy = buildProxy({
      content: 'content-1-savable',

      buffer: {
        title: 'My last blog post',

        author: buildProxy({
          content: 'content-2',
          buffer: {
            photo: buildProxy({
              content: 'content-3',
              localChanges: {
                was:  { url: '1.jpg' },
                is:   { url: '2.jpg' }
              }
            })
          },
          localChanges: {
            was:  { firstName: 'John' },
            is:   { firstName: 'Jamie' }
          }
        }),

        reviewer: buildProxy({
          content: 'content-4-savable',
          buffer: {
            photo: buildProxy({
              content: 'content-5',
              localChanges: {
                was:  { url: '3.jpg' },
                is:   { url: '4.jpg' }
              }
            })
          },
          localChanges: {
            was:  {},
            is:   {}
          }
        })

      },
      localChanges: {
        was: {
          title: 'My first blog post'
        },
        is: {
          title: 'My last blog post'
        }
      }
    });

    assert.deepEqual(proxy.get('dbp.changes'), [
      { content: 'content-3', was: { url: '1.jpg' }, is: { url: '2.jpg' } },
      { content: 'content-2', was: { firstName: 'John' }, is: { firstName: 'Jamie' } },
      { content: 'content-5', was: { url: '3.jpg' }, is: { url: '4.jpg' } },
      { content: 'content-1-savable', was: { title: 'My first blog post' }, is: { title: 'My last blog post' } }
    ], 'should return all changed proxies');

    assert.deepEqual(proxy.get('dbp').groupChanges((content) => content.match('savable')), [
      {
        content: 'content-4-savable',
        was: {
          photo: {
            url: '3.jpg'
          }
        },
        is: {
          photo: {
            url: '4.jpg'
          }
        }
      }, {
        content: 'content-1-savable',
        was: {
          title: 'My first blog post',
          author: {
            firstName: 'John',
            photo: {
              url: '1.jpg'
            }
          }
        },
        is: {
          title: 'My last blog post',
          author: {
            firstName: 'Jamie',
            photo: {
              url: '2.jpg'
            }
          }
        }
      }
    ], 'should return grouped changes');
  });
});
