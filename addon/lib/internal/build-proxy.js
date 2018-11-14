import ArrayProxy from '../array-proxy';
import ObjectProxy from '../object-proxy';
import { isArray, A } from '@ember/array';
import { isProxy, isProxyable } from './utils';

export function buildProxy(value) {
  if (isProxyable(value) && !isProxy(value)) {
    if (isArray(value)) {
      value = ArrayProxy.create({ subject: A(value) });
    } else {
      value = ObjectProxy.create({ subject: value });
    }
  }
  return value;
}
