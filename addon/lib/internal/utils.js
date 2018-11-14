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

export function getSubject(proxy) {
  if (isProxy(proxy)) {
    return proxy.get('subject');
  } else {
    return proxy;
  }
}
