import buildArrayProxy from '../array-proxy';
import buildObjectProxy from '../object-proxy';
import { isArray } from '@ember/array';
import { isProxy, isProxyable } from './utils';

export function buildProxy(value) {
  if (isProxyable(value) && !isProxy(value)) {
    if (isArray(value)) {
      value = buildArrayProxy(value);
    } else {
      value = buildObjectProxy(value);
    }
  }
  return value;
}
