import EmberMixin from '@ember/object/mixin';
import { Mixin as BaseMixin } from './base-proxy';
import EmberArrayProxy from '@ember/array/proxy';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { buildProxy, getSubject, isProxy } from './internal/utils';


export const Mixin = EmberMixin.create(BaseMixin, {

  content: alias('buffer'),

  buffer: computed('subject', function() {
    return A(this.get('subject').slice());
  }),

  objectAt(idx) {
    let value = this._super(...arguments);
    let proxy = buildProxy(value);
    if (value !== proxy) {
      this.replace(idx, 1, [proxy]);
    }
    return proxy;
  },

  changes: computed('subject.[]', 'buffer.[]', function() {
    let subject = this.get('subject');
    let buffer = this.get('buffer').map(getSubject);
    let map = {
      added:    buffer.filter((item) => !subject.includes(item)),
      removed:  subject.filter((item) => !buffer.includes(item)),
      was:      [],
      is:       []
    };
    if (map.added.length || map.removed.length) {
      map.was = subject.slice();
      map.is  = buffer;
    }
    return map;
  }),

  childBuffers: computed('buffer.[]', function() {
    return A(this.get('buffer').filter(isProxy));
  }),

  discardBufferedChanges() {
    this.notifyPropertyChange('buffer');
  },

  applyBufferedChanges() {
    this.get('buffer').invoke('applyBufferedChanges');
    let newValues = this.get('buffer').map(getSubject);
    let subject = this.get('subject');
    A(subject).replace(0, subject.length, newValues);
    this.notifyPropertyChange('buffer');
  }
});

export default EmberArrayProxy.extend(Mixin);
