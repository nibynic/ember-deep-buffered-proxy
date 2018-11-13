export function eq(a, b) {
  return a === b;
}

export function isProxy(value) {
  return typeof value === 'object' && value[IS_PROXY];
}

function symbol() {
  return `__ember-deep-buffered-proxy__${Math.floor(Math.random() * +new Date())}`;
}

export const IS_PROXY = symbol();
