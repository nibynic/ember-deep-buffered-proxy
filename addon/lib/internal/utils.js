import { IS_PROXY } from './symbols';
import { isArray } from '@ember/array';

export function eq(a, b) {
  a = getSubject(a);
  b = getSubject(b);
  if (isArray(a) && isArray(b)) {
    return !arrayDiff(a, b).length && !arrayDiff(b, a).length;
  } else {
    return a === b;
  }
}

export function arrayDiff(a, b) {
  return a.filter((v) => !b.includes(v));
}

export function isProxy(value) {
  return isProxyable(value) && value[IS_PROXY];
}

export function isProxyable(value) {
  return value && ['Object', 'Class', 'Array'].includes(value.constructor.name)
}

export function getSubject(proxy) {
  if (isProxy(proxy)) {
    return proxy.get('subject');
  } else {
    return proxy;
  }
}
