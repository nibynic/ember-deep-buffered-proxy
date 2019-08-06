import EmberObject, { computed } from '@ember/object';
import { InternalMixin, Mixin } from 'ember-deep-buffered-proxy/lib/base-proxy';
import { module, test } from 'qunit';

module('Unit | Mixin | base proxy', function() {
  const InternalProxy = EmberObject.extend(InternalMixin, {
    buffer: computed(() => ({})),
    eachBufferEntry(callback) {
      Object.entries(this.get('buffer')).forEach(([k, v]) => callback(k, v));
    },
    localChanges: computed(() => ({
      was: {},
      is: {}
    })),
    hasLocalChanges: computed('localChanges', function() {
      return Object.keys(this.get('localChanges.is')).length > 0;
    })
  });
  const Proxy = EmberObject.extend(Mixin);
  function buildProxy(attrs = {}) {
    return Proxy.create({ dbp: InternalProxy.create(attrs) });
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
    let proxy = buildProxy({
      childProxies: [
        buildProxy({ hasChanges: false })
      ]
    });

    assert.notOk(proxy.get('dbp.hasChanges'), 'should be false');

    proxy.set('dbp.childProxies.firstObject.dbp.hasChanges', true);

    assert.ok(proxy.get('dbp.hasChanges'), 'should be true');
  });

  test('it collects changes from nested proxies', function (assert) {
    let proxy = buildProxy({
      subject: 'subject-1-savable',

      buffer: {
        title: 'My last blog post',

        author: buildProxy({
          subject: 'subject-2',
          buffer: {
            photo: buildProxy({
              subject: 'subject-3',
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
          subject: 'subject-4-savable',
          buffer: {
            photo: buildProxy({
              subject: 'subject-5',
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
      { subject: 'subject-3', was: { url: '1.jpg' }, is: { url: '2.jpg' } },
      { subject: 'subject-2', was: { firstName: 'John' }, is: { firstName: 'Jamie' } },
      { subject: 'subject-5', was: { url: '3.jpg' }, is: { url: '4.jpg' } },
      { subject: 'subject-1-savable', was: { title: 'My first blog post' }, is: { title: 'My last blog post' } }
    ], 'should return all changed proxies');

    assert.deepEqual(proxy.get('dbp').groupChanges((subject) => subject.match('savable')), [
      {
        subject: 'subject-4-savable',
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
        subject: 'subject-1-savable',
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
