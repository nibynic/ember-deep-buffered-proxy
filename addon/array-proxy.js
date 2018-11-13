import EmberMixin from '@ember/object/mixin';
import { Mixin as BaseMixin } from './base-proxy';
import EmberArrayProxy from '@ember/array/proxy';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

export const Mixin = EmberMixin.create(BaseMixin, {

  content: alias('buffer'),

  buffer: computed('subject', function() {
    return A(this.get('subject').slice());
  }),

  changes: computed('subject.[]', 'buffer.[]', function() {
    let subject = this.get('subject');
    let buffer = this.get('buffer');
    return {
      added:    buffer.filter((item) => !subject.includes(item)),
      removed:  subject.filter((item) => !buffer.includes(item))
    };
  }),

  hasBufferedChanges: computed('changes', function() {
    let changes = this.get('changes');
    return changes.added.length > 0 || changes.removed.length > 0;
  }),

  isDirty: computed('hasBufferedChanges' /*, 'buffer.@each.isDirty'*/, function() {
    return this.get('hasBufferedChanges') || this.get('buffer').isAny('isDirty');
  }),

  discardBufferedChanges() {
    this.notifyPropertyChange('buffer');
  },

  applyBufferedChanges() {
    let subject = this.get('subject');
    A(subject).replace(0, subject.length, this.get('buffer'));
    this.notifyPropertyChange('buffer');
  }
});

export default EmberArrayProxy.extend(Mixin);
