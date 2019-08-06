import { IS_PROXY } from './symbols';
import { isArray } from '@ember/array';
import EmberObject from '@ember/object';

export function eq(a, b) {
  a = getcontent(a);
  b = getcontent(b);
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
  return value && (
    isArray(value) ||                   // Array
    value instanceof EmberObject ||     // EmberObject
    value.constructor.name === 'Object' // POJO
  );
}

export function getcontent(proxy) {
  if (isProxy(proxy)) {
    return proxy.get('dbp.content');
  } else {
    return proxy;
  }
}
