import EmberMixin from '@ember/object/mixin';
import { IS_PROXY } from './utils';

export const Mixin = EmberMixin.create({
  [IS_PROXY]: true,

  isDirty: false,

  hasBufferedChanges: false,

  applyBufferedChanges() {},

  discardBufferedChanges() {}
});
