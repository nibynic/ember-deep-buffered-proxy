import EmberMixin from '@ember/object/mixin';
import { Mixin as BaseMixin } from './base-proxy';
import EmberArrayProxy from '@ember/array/proxy';
import { A } from '@ember/array';
import { get, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { buildProxy } from './internal/build-proxy';
import { getSubject, arrayDiff } from './internal/utils';


export const Mixin = EmberMixin.create(BaseMixin, {

  content: alias('buffer'),

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

  replaceContent(idx, amt, objects) {
    return this._super(idx, amt, objects.map(buildProxy));
  },

  subjectWillChange(subject, start, removeCount) {
    let removed = subject.slice(start, start + removeCount);
    removed.forEach((item) => {
      let proxy = this.findBy('subject', item);
      this.removeObject(proxy);
    });
  },

  subjectDidChange(subject, start, removeCount, addCount) {
    this.addObjects(subject.slice(start, start + addCount));
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

  willDestroy() {
    this._super(...arguments);
    this.get('subject').removeArrayObserver(this, {
      willChange: 'subjectWillChange',
      didChange:  'subjectDidChange'
    });
  }
});

export default EmberArrayProxy.extend(Mixin);
