import { Mixin as BaseMixin, InternalMixin as BaseInternalMixin } from './base-proxy';
import EmberArrayProxy from '@ember/array/proxy';
import { A } from '@ember/array';
import EmberObject, { get, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { buildProxy } from './internal/build-proxy';
import { getSubject, arrayDiff } from './internal/utils';


const ProxyInternal = EmberObject.extend(BaseInternalMixin, {
  init() {
    this._super(...arguments);
    A(this.get('subject')).addArrayObserver(this, {
      willChange: 'subjectWillChange',
      didChange:  'subjectDidChange'
    });
  },

  buffer: computed(function() {
    return A(this.get('subject').map(buildProxy));
  }),

  subjectWillChange(subject, start, removeCount) {
    let removed = subject.slice(start, start + removeCount);
    let buffer = this.get('buffer');
    removed.forEach((item) => {
      let proxy = buffer.findBy('dbp.subject', item);
      buffer.removeObject(proxy);
    });
  },

  subjectDidChange(subject, start, removeCount, addCount) {
    this.get('buffer').addObjects(subject.slice(start, start + addCount).map(buildProxy));
  },

  localChanges: computed('subject.[]', 'buffer.[]', function() {
    let subject = this.get('subject');
    let buffer = this.get('buffer').map(getSubject);
    let map = {
      added:    arrayDiff(buffer, subject),
      removed:  arrayDiff(subject, buffer),
      was:      [],
      is:       []
    };
    if (map.added.length || map.removed.length) {
      map.was = subject.slice();
      map.is  = buffer;
    }
    return map;
  }),

  hasLocalChanges: computed('localChanges', function() {
    return this.get('localChanges.added.length') > 0 || this.get('localChanges.removed.length') > 0;
  }),

  eachBufferEntry(callback) {
    this.get('buffer').forEach((v, i) => callback(i, v));
  },

  applyLocalChanges() {
    if (this.get('hasLocalChanges')) {
      let newValues = this.get('buffer').map(getSubject);
      let subject = this.get('subject');
      A(subject).replace(0, get(subject, 'length'), newValues);
    }
    this.notifyPropertyChange('buffer');
  },

  discardLocalChanges() {
    this._super(...arguments);
    this.notifyPropertyChange('[]');
  },

  willDestroy() {
    this._super(...arguments);
    this.get('subject').removeArrayObserver(this, {
      willChange: 'subjectWillChange',
      didChange:  'subjectDidChange'
    });
  }
});

const ArrayProxy = EmberArrayProxy.extend(BaseMixin, {
  content: alias('dbp.buffer'),

  replaceContent(idx, amt, objects) {
    return this._super(idx, amt, objects.map(buildProxy));
  }
});

export default function(subject) {
  return ArrayProxy.create({
    dbp: ProxyInternal.create({ subject: A(subject) })
  });
}
