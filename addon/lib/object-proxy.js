import { Mixin as BaseMixin, InternalMixin as BaseInternalMixin } from './base-proxy';
import EmberObject, { computed, set, get } from '@ember/object';
import { alias } from '@ember/object/computed';
import EmberObjectProxy from '@ember/object/proxy';
import { buildProxy } from './internal/build-proxy';
import { eq, getContent } from './internal/utils';
import { once, cancel } from '@ember/runloop';
import { classify, camelize } from '@ember/string';
import { assert } from '@ember/debug';
import config from './internal/config';

const ProxyInternal = EmberObject.extend(BaseInternalMixin, {

  buffer: computed('content', function() {
    return {};
  }),

  onceRuns: null,

  notifyAfterGet() {
    this.notifyOnce('childProxies');
  },

  notifyAfterSet(key) {
    this.notifyPropertyChange(key);
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
      if (!eq(oldValue, value)) {
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
      } else if (!eq(get(content, key), value)) {
        set(content, key, getContent(value));
      }
    });
    methodsToCall.forEach(([c, m]) => m.apply(c));
    this.notifyPropertyChange('buffer');
  },

  discardLocalChanges() {
    let keys = Object.keys(this.get('buffer'))
    this._super(...arguments);
    keys.forEach((k) => this.notifyPropertyChange(k));
  },

  willDestroy() {
    this._super(...arguments);
    Object.values(this.onceRuns).forEach((run) => {
      cancel(run);
    });
  }
});

const ObjectProxy = EmberObjectProxy.extend(BaseMixin, {
  content: alias(`${config.namespace}.content`),

  unknownProperty(key) {
    let buffer = this.get(`${config.namespace}.buffer`);
    if (buffer.hasOwnProperty(key)) {
      return buffer[key];
    } else {
      let value = this._super(key);
      let proxy = buffer[key] = buildProxy(value);
      if (proxy !== value) {
        this.get(config.namespace).notifyAfterGet();
      }
      return proxy;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get(`${config.namespace}.buffer`);
    let oldValue = this.get(`${config.namespace}.content.${key}`);
    if (!eq(buffer[key], value)) {
      if (eq(oldValue, value)) {
        delete buffer[key];
      } else {
        buffer[key] = buildProxy(value);
      }
      this.get(config.namespace).notifyAfterSet(key);
    }
  }
});

export default function(content) {
  return ObjectProxy.create({
    [config.namespace]: ProxyInternal.create({ content })
  });
}

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
