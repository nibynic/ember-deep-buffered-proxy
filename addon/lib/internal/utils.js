import ArrayProxy from '../array-proxy';
import ObjectProxy from '../object-proxy';
import { isArray, A } from '@ember/array';
import { IS_PROXY } from './symbols';

export function eq(a, b) {
  return getSubject(a) === getSubject(b);
}

export function isProxy(value) {
  return isProxyable(value) && value[IS_PROXY];
}

export function isProxyable(value) {
  return value && ['Object', 'Class', 'Array'].includes(value.constructor.name)
}

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

export function getSubject(proxy) {
  if (isProxy(proxy)) {
    return proxy.get('subject');
  } else {
    return proxy;
  }
}
