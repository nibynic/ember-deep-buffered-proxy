import EmberMixin from '@ember/object/mixin';
import { Mixin as BaseMixin } from './base-proxy';
import { computed, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import EmberObjectProxy from '@ember/object/proxy';
import { A } from '@ember/array';
import { eq, isProxy, buildProxy, getSubject } from './utils';
import { once, cancel } from '@ember/runloop';

export const Mixin = EmberMixin.create(BaseMixin, {

  subject: alias('content'),

  buffer: computed('subject', function() {
    return {};
  }),

  unknownProperty(key) {
    let buffer = this.get('buffer');
    if (buffer.hasOwnProperty(key)) {
      return buffer[key];
    } else {
      let value = this._super(key);
      if (typeof value === 'object') {
        let proxy = buffer[key] = buildProxy(value);
        if (proxy !== value) {
          this.onceRun = once(this, this.notifyPropertyChange, 'childBuffers');
        }
        value = proxy;
      }
      return value;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get('buffer');
    let oldValue = this.get(`subject.${key}`);
    if (eq(oldValue, value)) {
      delete buffer[key];
    } else {
      buffer[key] = buildProxy(value);
    }
    this.notifyPropertyChange('changes');
  },

  changes: computed('buffer', function() {
    let map = { was: {}, is: {} };
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      let oldValue = this.get(`subject.${key}`);
      if (!eq(oldValue, value)) {
        map.was[key]  = oldValue;
        map.is[key]   = getSubject(value);
      }
    });
    return map;
  }),

  childBuffers: computed('buffer', function() {
    return A(Object.values(this.get('buffer')).filter(isProxy));
  }),

  applyBufferedChanges() {
    this.get('childBuffers').invoke('applyBufferedChanges');
    let subject = this.get('subject');
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      if (isProxy(value)) {
        value = value.get('subject');
      }
      set(subject, key, value);
    });
    this.notifyPropertyChange('buffer');
  },

  discardBufferedChanges() {
    this.notifyPropertyChange('buffer');
  },

  willDestroy() {
    this._super(...arguments);
    cancel(this.onceRun);
  }
});

export default EmberObjectProxy.extend(Mixin);
