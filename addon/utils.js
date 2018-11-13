// import ArrayProxy from './array-proxy';
import Proxy from './proxy';

export function eq(a, b) {
  return a === b;
}

export function isProxy(value) {
  return typeof value === 'object' && value[IS_PROXY];
}

export function buildProxy(value) {
  if (typeof value === 'object' && !isProxy(value)) {
    // if (isArray(value)) {
    //   value = ArrayProxy.create({ subject: A(value) });
    // } else {
      value = Proxy.create({ subject: value });
    // }
  }
  return value;
}


function symbol() {
  return `__ember-deep-buffered-proxy__${Math.floor(Math.random() * +new Date())}`;
}

export const IS_PROXY = symbol();
