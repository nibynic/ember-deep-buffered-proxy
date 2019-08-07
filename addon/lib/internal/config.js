import config from 'ember-get-config';
import { assign } from '@ember/polyfills';

export default assign({
  namespace: 'dbp'
}, config.emberDeepBufferedProxy);
