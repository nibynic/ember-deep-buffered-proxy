import EmberMixin from '@ember/object/mixin';
import { IS_PROXY } from './internal/symbols';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import { assert } from '@ember/debug';

export const Mixin = EmberMixin.create({
  [IS_PROXY]: true,

  isDirty: computed('childBuffers.@each.isDirty', 'hasBufferedChanges', function() {
    return this.get('hasBufferedChanges') || this.get('childBuffers').isAny('isDirty');
  }),

  childBuffers: computed(function() {
    assert('childBuffers - this attribute has to be implemented in a sublass', false);
    return A();
  }),

  changes: computed(function() {
    assert('changes - this attribute has to be implemented in a sublass', false);
    return {
      was: {},
      is: {}
    };
  }),

  hasBufferedChanges: computed('changes', function() {
    return Object.keys(this.get('changes.is')).length > 0;
  }),

  applyBufferedChanges() {
    assert('applyBufferedChanges - this method has to be implemented in a sublass', false);
  },

  discardBufferedChanges() {
    assert('discardBufferedChanges - this method has to be implemented in a sublass', false);
  }
});
