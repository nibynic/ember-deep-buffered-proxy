import EmberMixin from '@ember/object/mixin';
import { Mixin as BaseMixin } from './base-proxy';
import { computed, set, get } from '@ember/object';
import { alias } from '@ember/object/computed';
import EmberObjectProxy from '@ember/object/proxy';
import { buildProxy } from './internal/build-proxy';
import { eq, getSubject } from './internal/utils';
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
      let proxy = buffer[key] = buildProxy(value);
      if (proxy !== value) {
        this.onceRun = once(this, this.notifyPropertyChange, 'childProxies');
      }
      return proxy;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get('buffer');
    let oldValue = this.get(`subject.${key}`);
    if (!eq(buffer[key], value)) {
      if (eq(oldValue, value)) {
        delete buffer[key];
      } else {
        buffer[key] = buildProxy(value);
      }
      this.notifyPropertyChange(key);
      this.notifyPropertyChange('localChanges');
    }
  },

  localChanges: computed('buffer', function() {
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

  eachBufferEntry(callback) {
    Object.entries(this.get('buffer')).forEach(([k, v]) => callback(k, v));
  },

  applyLocalChanges() {
    let subject = this.get('subject');
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      if (!eq(get(subject, key), value)) {
        set(subject, key, getSubject(value));
      }
    });
    this.notifyPropertyChange('buffer');
  },

  willDestroy() {
    this._super(...arguments);
    cancel(this.onceRun);
  }
});

export default EmberObjectProxy.extend(Mixin);
