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

  buffer: computed('subject', function() {
    return A(this.get('subject').map(buildProxy));
  }),

  replaceContent(idx, amt, objects) {
    return this._super(idx, amt, objects.map(buildProxy));
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
    return this.get('localChanges.added.length') || this.get('localChanges.removed.length');
  }),

  eachBufferEntry(callback) {
    this.get('buffer').forEach((v, i) => callback(i, v));
  },

  applyLocalChanges() {
    let newValues = this.get('buffer').map(getSubject);
    let subject = this.get('subject');
    A(subject).replace(0, get(subject, 'length'), newValues);
    this.notifyPropertyChange('buffer');
  }
});

export default EmberArrayProxy.extend(Mixin);
