import ArrayProxy from './array-proxy';
import Proxy from './proxy';
import { isArray, A } from '@ember/array';
import { IS_PROXY } from './symbols';

export function eq(a, b) {
  return getSubject(a) === getSubject(b);
}

export function isProxy(value) {
  return typeof value === 'object' && value[IS_PROXY];
}

export function buildProxy(value) {
  if (typeof value === 'object' && !isProxy(value)) {
    if (isArray(value)) {
      value = ArrayProxy.create({ subject: A(value) });
    } else {
      value = Proxy.create({ subject: value });
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
