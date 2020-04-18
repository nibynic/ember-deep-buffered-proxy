import { DriverMixin, ClassMixin } from './base-proxy';
import EmberObject, { computed, set, get } from '@ember/object';
import buildProxy from './internal/build-proxy';
import { eq, getContent } from './internal/utils';
import { once, cancel } from '@ember/runloop';
import { classify, camelize } from '@ember/string';
import { assert } from '@ember/debug';
import config from './internal/config';

const Driver = EmberObject.extend(DriverMixin, {

  buffer: computed('content', function() {
    return {};
  }),

  onceRuns: null,

  notifyAfterGet() {
    this.notifyOnce('childProxies');
  },

  notifyAfterSet(key) {
    this.proxy.notifyPropertyChange(key);
    this.notifyOnce('localChanges');
    this.notifyOnce('childProxies');
  },

  notifyOnce(key) {
    this.onceRuns = this.onceRuns || {};
    let method = `notify${classify(key)}Change`;
    this[method] = this[method] || function() {
      this.notifyPropertyChange(key);
    };
    this.onceRuns[key] = once(this, this[method]);
  },

  localChanges: computed('buffer', function() {
    let map = { was: {}, is: {} };
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      let oldValue = this.get(`content.${key}`);
      if (!eq(oldValue, value, this.get('options.serialize'))) {
        map.was[key]  = oldValue;
        map.is[key]   = getContent(value);
      }
    });
    return map;
  }),

  hasLocalChanges: computed('localChanges', function() {
    return Object.keys(this.get('localChanges.is')).length > 0;
  }),

  eachBufferEntry(callback) {
    Object.entries(this.get('buffer')).forEach(([k, v]) => callback(k, v));
  },

  applyLocalChanges() {
    let content = this.get('content');
    let methodsToCall = [];
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      let matches = key.match(/^markedFor(.+)/);
      if (matches) {
        if (value) {
          let methodName = camelize(matches[1]);
          let [context, method] = findMethod(content, methodName);
          assert(`Proxy content has ${matches[0]}=${value} but ${methodName} was not found on ${content}`, method);
          methodsToCall.push([context, method]);
        }
      } else if (!eq(get(content, key), value, this.get('options.serialize'))) {
        set(content, key, getContent(value));
      }
    });
    methodsToCall.forEach(([c, m]) => m.apply(c));
    this.notifyPropertyChange('buffer');
  },

  discardLocalChanges() {
    let keys = Object.keys(this.get('buffer'))
    this._super(...arguments);
    keys.forEach((k) => this.proxy.notifyPropertyChange(k));
  },

  willDestroy() {
    this._super(...arguments);
    Object.values(this.onceRuns).forEach((run) => {
      cancel(run);
    });
  }
});

export default EmberObject.extend({
  [config.namespace]: null,

  unknownProperty(key) {
    let buffer = this.get(`${config.namespace}.buffer`);
    if (Object.prototype.hasOwnProperty.call(buffer, key)) {
      return buffer[key];
    } else {
      let value = this.get(`${config.namespace}.content.${key}`);
      let proxy = buildProxy(value, this.get(`${config.namespace}.options`));
      if (proxy !== value) {
        buffer[key] = proxy;
        this.get(config.namespace).notifyAfterGet();
      }
      return proxy;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get(`${config.namespace}.buffer`);
    let oldValue = this.get(`${config.namespace}.content.${key}`);
    let serialize = this.get(`${config.namespace}.options.serialize`);
    if (!eq(buffer[key], value, serialize)) {
      if (eq(oldValue, value, serialize)) {
        delete buffer[key];
      } else {
        buffer[key] = buildProxy(value, this.get(`${config.namespace}.options`));
      }
      this.get(config.namespace).notifyAfterSet(key);
    }
  }
}).reopenClass(ClassMixin, { Driver });

function findMethod(context, name) {
  if (context[name]) {
    return [context, context[name]];
  } else if ('content' in context) {
    let content = get(context, 'content');
    if (content) {
      return findMethod(content, name);
    }
  }
  return [];
}
