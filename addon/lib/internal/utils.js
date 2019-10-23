import { isArray } from '@ember/array';
import EmberObject from '@ember/object';
import config from './config';

export function eq(a, b, serialize) {
  serialize = serialize || ((obj) => obj);
  a = getContent(a);
  b = getContent(b);
  if (isArray(a) && isArray(b)) {
    a = a.map(serialize);
    b = b.map(serialize);
    return !arrayDiff(a, b).length && !arrayDiff(b, a).length;
  } else {
    return serialize(a) === serialize(b);
  }
}

export function arrayDiff(a, b) {
  return a.filter((v) => !b.includes(v));
}

export function isProxy(value) {
  return isProxyable(value) && config.namespace in value;
}

export function isProxyable(value) {
  return value && (
    isArray(value) ||                   // Array
    value instanceof EmberObject ||     // EmberObject
    value.constructor.name === 'Object' // POJO
  );
}

export function getContent(proxy) {
  if (isProxy(proxy)) {
    return proxy.get(`${config.namespace}.content`);
  } else {
    return proxy;
  }
}
