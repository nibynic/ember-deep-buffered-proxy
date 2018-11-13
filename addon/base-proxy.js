import EmberMixin from '@ember/object/mixin';
import { IS_PROXY } from './symbols';
import { computed } from '@ember/object';
import { A } from '@ember/array';

export const Mixin = EmberMixin.create({
  [IS_PROXY]: true,

  childBuffers: computed(function() {
    return A();
  }),

  isDirty: computed('childBuffers.@each.isDirty', 'hasBufferedChanges', function() {
    return this.get('hasBufferedChanges') || this.get('childBuffers').isAny('isDirty');
  }),

  hasBufferedChanges: false,

  applyBufferedChanges() {},

  discardBufferedChanges() {}
});
