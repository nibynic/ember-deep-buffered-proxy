import EmberMixin from '@ember/object/mixin';
import { IS_PROXY } from './internal/symbols';
import { isProxy, getSubject } from './internal/utils';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';

export const Mixin = EmberMixin.create({
  [IS_PROXY]: true,

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
    return Object.keys(this.get('localChanges.is')).length > 0;
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

  changes: computed('localChanges', 'childProxies.@each.changes', function() {
    return this.groupChanges();
  }),

  hasChanges: computed('childProxies.@each.hasChanges', 'hasLocalChanges', function() {
    return this.get('hasLocalChanges') || A(this.get('childProxies')).isAny('hasChanges');
  }),

  applyLocalChanges() {
    assert('applyLocalChanges - this method has to be implemented in a subclass', false);
  },

  applyChanges() {
    A(this.get('childProxies')).invoke('applyChanges');
    this.applyLocalChanges();
  },

  discardLocalChanges() {
    this.notifyPropertyChange('buffer');
  },

  discardChanges() {
    A(this.get('childProxies')).invoke('discardChanges');
    this.discardLocalChanges();
  },

  groupChanges(condition = () => true) {
    let allChanges = A();
    let localChanges = assign(
      { subject: this.get('subject') },
      this.get('localChanges')
    );
    let hasChanges = this.get('hasLocalChanges');
    this.eachBufferEntry((key, value) => {
      if (isProxy(value) && value.get('hasChanges')) {
        let nestedChanges = value.groupChanges(condition);
        let subject = getSubject(value);
        if (!condition(subject)) {
          let subjectChange = nestedChanges.findBy('subject', subject);
          if (subjectChange) {
            nestedChanges.removeObject(subjectChange);
            localChanges.was[key] = subjectChange.was;
            localChanges.is[key]  = subjectChange.is;
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
