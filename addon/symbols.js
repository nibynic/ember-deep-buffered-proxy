function symbol() {
  return `__ember-deep-buffered-proxy__${Math.floor(Math.random() * new Date())}`;
}

export const IS_PROXY = symbol();
