import Mixin from '@ember/object/mixin';
import { isProxy, getContent } from './internal/utils';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';
import config from './internal/config';

export const DriverMixin = Mixin.create({
  eachBufferEntry(/*callback*/) {
    assert('eachBufferEntry - this method has to be implemented in a subclass', false);
  },

  localChanges: computed(function() {
    assert('localChanges - this attribute has to be implemented in a subclass', false);
    return {
      was: {},
      is: {}
    };
  }),

  hasLocalChanges: computed('localChanges', function() {
    assert('hasLocalChanges - this attribute has to be implemented in a subclass', false);
  }),

  childProxies: computed('buffer.[]', function() {
    let list = A();
    this.eachBufferEntry((key, value) => {
      if (isProxy(value)) {
        list.pushObject(value);
      }
    });
    return list;
  }),

  childProxiesInternals: computed(`childProxies.@each.${config.namespace}`, function() {
    return A(this.get('childProxies')).mapBy(config.namespace);
  }),

  changes: computed('localChanges', 'childProxiesInternals.@each.changes', function() {
    return this.groupChanges();
  }),

  hasChanges: computed('childProxiesInternals.@each.hasChanges', 'hasLocalChanges', function() {
    return this.get('hasLocalChanges') || A(this.get('childProxiesInternals')).isAny('hasChanges');
  }),

  applyLocalChanges() {
    assert('applyLocalChanges - this method has to be implemented in a subclass', false);
  },

  applyChanges() {
    A(this.get('childProxiesInternals')).invoke('applyChanges');
    this.applyLocalChanges();
  },

  discardLocalChanges() {
    this.notifyPropertyChange('buffer');
  },

  discardChanges() {
    A(this.get('childProxiesInternals')).invoke('discardChanges');
    this.discardLocalChanges();
  },

  groupChanges(condition = () => true) {
    let allChanges = A();
    let localChanges = assign(
      { content: this.get('content') },
      this.get('localChanges')
    );
    let hasChanges = this.get('hasLocalChanges');
    this.eachBufferEntry((key, value) => {
      if (isProxy(value) && value.get(`${config.namespace}.hasChanges`)) {
        let nestedChanges = value.get(config.namespace).groupChanges(condition);
        let content = getContent(value);
        if (!condition(content)) {
          let contentChange = nestedChanges.findBy('content', content);
          if (contentChange) {
            nestedChanges.removeObject(contentChange);
            localChanges.was[key] = contentChange.was;
            localChanges.is[key]  = contentChange.is;
            hasChanges = true;
          }
        }
        allChanges.pushObjects(nestedChanges);
      }
    });
    if (hasChanges) {
      allChanges.pushObject(localChanges);
    }
    return allChanges;
  }
});

export const ClassMixin = Mixin.create({
  wrap(content, options = {}) {
    let proxy = this.create();
    proxy.set(config.namespace, this.Driver.create({ content, options, proxy }));
    return proxy;
  }
});
