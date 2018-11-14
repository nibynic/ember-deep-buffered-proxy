import EmberMixin from '@ember/object/mixin';
import { IS_PROXY } from './internal/symbols';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';

export const Mixin = EmberMixin.create({
  [IS_PROXY]: true,

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

  childBuffers: computed(function() {
    assert('childBuffers - this attribute has to be implemented in a subclass', false);
    return A();
  }),

  changes: computed('localChanges', 'childBuffers.@each.changes', function() {
    let list = this.get('childBuffers').mapBy('changes').reduce(
      (a, b) => a.concat(b), []
    );
    if (this.get('hasLocalChanges')) {
      list.push(
        assign({ subject: this.get('subject')}, this.get('localChanges'))
      );
    }
    return list;
  }),

  hasChanges: computed('childBuffers.@each.hasChanges', 'hasLocalChanges', function() {
    return this.get('hasLocalChanges') || this.get('childBuffers').isAny('hasChanges');
  }),

  applyLocalChanges() {
    assert('applyLocalChanges - this method has to be implemented in a subclass', false);
  },

  applyChanges() {
    this.get('childBuffers').invoke('applyChanges');
    this.applyLocalChanges();
  },

  discardLocalChanges() {
    this.notifyPropertyChange('buffer');
  },

  discardChanges() {
    this.get('childBuffers').invoke('discardChanges');
    this.discardLocalChanges();
  }
});
