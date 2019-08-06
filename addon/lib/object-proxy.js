import { Mixin as BaseMixin, InternalMixin as BaseInternalMixin } from './base-proxy';
import EmberObject, { computed, set, get } from '@ember/object';
import { alias } from '@ember/object/computed';
import EmberObjectProxy from '@ember/object/proxy';
import { buildProxy } from './internal/build-proxy';
import { eq, getSubject } from './internal/utils';
import { once, cancel } from '@ember/runloop';
import { classify, camelize } from '@ember/string';
import { assert } from '@ember/debug';

const ProxyInternal = EmberObject.extend(BaseInternalMixin, {

  buffer: computed('subject', function() {
    return {};
  }),

  onceRuns: null,

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
      let oldValue = this.get(`subject.${key}`);
      if (!eq(oldValue, value)) {
        map.was[key]  = oldValue;
        map.is[key]   = getSubject(value);
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
    let subject = this.get('subject');
    let methodsToCall = [];
    Object.entries(this.get('buffer')).forEach(([key, value]) => {
      let matches = key.match(/^markedFor(.+)/);
      if (matches) {
        if (value) {
          let methodName = camelize(matches[1]);
          let [context, method] = findMethod(subject, methodName);
          assert(`Proxy subject has ${matches[0]}=${value} but ${methodName} was not found on ${subject}`, method);
          methodsToCall.push([context, method]);
        }
      } else if (!eq(get(subject, key), value)) {
        set(subject, key, getSubject(value));
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
  content: alias('dbp.subject'),

  unknownProperty(key) {
    let buffer = this.get('dbp.buffer');
    if (buffer.hasOwnProperty(key)) {
      return buffer[key];
    } else {
      let value = this._super(key);
      let proxy = buffer[key] = buildProxy(value);
      if (proxy !== value) {
        this.get('dbp').notifyOnce('childProxies');
      }
      return proxy;
    }
  },

  setUnknownProperty(key, value) {
    let buffer = this.get('dbp.buffer');
    let oldValue = this.get(`dbp.subject.${key}`);
    if (!eq(buffer[key], value)) {
      if (eq(oldValue, value)) {
        delete buffer[key];
      } else {
        buffer[key] = buildProxy(value);
      }
      this.get('dbp').notifyPropertyChange(key);
      this.get('dbp').notifyOnce('localChanges');
      this.get('dbp').notifyOnce('childProxies');
    }
  }
});

export default function(subject) {
  return ObjectProxy.create({
    dbp: ProxyInternal.create({ subject })
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
