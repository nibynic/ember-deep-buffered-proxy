import ArrayProxy from '../array-proxy';
import ObjectProxy from '../object-proxy';
import { isArray } from '@ember/array';
import { isProxy, isProxyable } from './utils';
import { assign } from '@ember/polyfills';

export default function(content, options = {}) {
  let optionsWithDefaults = assign({
    proxyClassFor(obj) {
      return isArray(obj) ? ArrayProxy : ObjectProxy;
    },
    serialize(obj) {
      return JSON.stringify(obj);
    }
  }, options);

  if (isProxyable(content) && !isProxy(content)) {
    return optionsWithDefaults.proxyClassFor(content).wrap(content, options);
  }
  return content;
}
