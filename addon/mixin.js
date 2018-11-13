import Mixin from '@ember/object/mixin';
import { computed, set } from '@ember/object';
import ObjectProxy from '@ember/object/proxy';
import { A } from '@ember/array';
import { eq, isProxy, IS_PROXY } from './utils';

const DeepBufferedProxy = Mixin.create({

  [IS_PROXY]: true,

  childBuffers: computed(function() {
    return A();
  }),

  buffer: computed(function() {
    return {};
  }),

  unknownProperty(key) {
    let buffer = this.get('buffer');
    if (buffer.hasOwnProperty(key)) {
      return buffer[key];
    } else {
      let value = this._super(key);
      if (typeof value === 'object') {
        value = buffer[key] = this.buildProxyFor(value);
      }
      return value;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get('buffer');
    let oldValue = this.get(`content.${key}`);
    if (eq(oldValue, value)) {
      delete buffer[key];
    } else {
      buffer[key] = this.buildProxyFor(value);
    }
    this.notifyPropertyChange('hasBufferedChanges');
  },

  buildProxyFor(value) {
    if (typeof value === 'object' && !isProxy(value)) {
      value = Proxy.create({ content: value });
      this.get('childBuffers').pushObject(value);
    }
    return value;
  },

  hasBufferedChanges: computed('buffer', function() {
    return Object.keys(this.get('buffer')).length > 0;
  }),

  isDirty: computed('childBuffers.@each.isDirty', 'hasBufferedChanges', function() {
    return this.get('hasBufferedChanges') || this.get('childBuffers').isAny('isDirty');
  }),

  applyBufferedChanges() {
    this.get('childBuffers').invoke('applyBufferedChanges');
    let content = this.get('content');
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      if (isProxy(value)) {
        value = value.get('content');
      }
      set(content, key, value);
    });
    this.notifyPropertyChange('buffer');
    this.get('childBuffers').clear();
  },

  discardBufferedChanges() {
    this.notifyPropertyChange('buffer');
    this.get('childBuffers').clear();
  }
});

export default DeepBufferedProxy;

export const Proxy = ObjectProxy.extend(DeepBufferedProxy);
