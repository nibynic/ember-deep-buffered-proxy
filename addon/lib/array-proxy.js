import { DriverMixin, ClassMixin } from './base-proxy';
import EmberArrayProxy from '@ember/array/proxy';
import { A } from '@ember/array';
import EmberObject, { get, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import buildProxy from './internal/build-proxy';
import { getContent, arrayDiff } from './internal/utils';
import config from './internal/config';

const Driver = EmberObject.extend(DriverMixin, {
  init() {
    this._super(...arguments);
    A(this.get('content')).addArrayObserver(this, {
      willChange: 'contentWillChange',
      didChange:  'contentDidChange'
    });
  },

  buffer: computed('content', 'options', function() {
    return A(this.get('content').map((i) => buildProxy(i, this.options)));
  }),

  contentWillChange(content, start, removeCount) {
    let removed = content.slice(start, start + removeCount);
    let buffer = this.get('buffer');
    removed.forEach((item) => {
      let proxy = buffer.find((p) => getContent(p) === item);
      buffer.removeObject(proxy);
    });
  },

  contentDidChange(content, start, removeCount, addCount) {
    this.get('buffer').addObjects(content.slice(start, start + addCount).map((i) => buildProxy(i, this.options)));
  },

  localChanges: computed('content.[]', 'buffer.[]', function() {
    let content = this.get('content');
    let buffer = this.get('buffer').map(getContent);
    let map = {
      added:    arrayDiff(buffer, content),
      removed:  arrayDiff(content, buffer),
      was:      [],
      is:       []
    };
    if (map.added.length || map.removed.length) {
      map.was = content.slice();
      map.is  = buffer;
    }
    return map;
  }),

  hasLocalChanges: computed('localChanges.{added.length,removed.length}', function() {
    return this.get('localChanges.added.length') > 0 || this.get('localChanges.removed.length') > 0;
  }),

  eachBufferEntry(callback) {
    this.get('buffer').forEach((v, i) => callback(i, v));
  },

  applyLocalChanges() {
    if (this.get('hasLocalChanges')) {
      let newValues = this.get('buffer').map(getContent);
      let content = this.get('content');
      A(content).replace(0, get(content, 'length'), newValues);
    }
    this.notifyPropertyChange('buffer');
  },

  discardLocalChanges() {
    this._super(...arguments);
    this.notifyPropertyChange('[]');
  },

  willDestroy() {
    this._super(...arguments);
    this.get('content').removeArrayObserver(this, {
      willChange: 'contentWillChange',
      didChange:  'contentDidChange'
    });
  }
});

export default EmberArrayProxy.extend({
  content: alias(`${config.namespace}.buffer`),

  replaceContent(idx, amt, objects) {
    return this._super(idx, amt, objects.map((i) => buildProxy(i, this.get(`${config.namespace}.options`))));
  }
}).reopenClass(ClassMixin, { Driver });
