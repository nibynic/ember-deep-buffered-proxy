Ember Deep Buffered Proxy
==============================================================================

[![Build Status](https://travis-ci.com/nibynic/ember-deep-buffered-proxy.svg?branch=master)](https://travis-ci.com/nibynic/ember-deep-buffered-proxy)
[![Ember Observer Score](https://emberobserver.com/badges/ember-deep-buffered-proxy.svg)](https://emberobserver.com/addons/ember-deep-buffered-proxy)
[![npm version](https://badge.fury.io/js/ember-deep-buffered-proxy.svg)](https://badge.fury.io/js/ember-deep-buffered-proxy)

Wrap your data in a proxy that buffers all changes - meaning that you can control
when and whether they get applied on source data.

There is plenty of buffer proxy or changeset Ember addons, this one tries to unite
all these ideas in one addon:

- Supports Ember Objects, POJOs, Arrays, Ember Arrays,
- Supports promises,
- Supports nested objects,
- Lists all changes, detects dirtiness,
- Allows you to apply or discard changes.

**If you are using EmberData, there is a more specialized addon called [Ember Data
Fork](https://github.com/nibynic/ember-data-fork).**



Compatibility
------------------------------------------------------------------------------

* Ember.js v2.12 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-deep-buffered-proxy
```


Usage
------------------------------------------------------------------------------

```javascript
import buildProxy from 'ember-deep-buffered-proxy';

let model = {
  name: 'Cookie Monster',
  address: {
    street: 'Sesame St.'
  },
  friends: [
    { name: 'Bert' },
    { name: 'Ernie' }
  ]
};

let buffer = buildProxy(model);

buffer.set('name', 'Big Bird');
buffer.get('address').set('street', 'Sesame Street');
buffer.get('friends').popObject();
buffer.get('friends').addObject({ name: 'Elmo' });

// model has not changed

buffer.dbp.hasChanges; // true
buffer.dbp.applyChanges();

// model received the changes

buffer.dbp.hasChanges; // false
```


### Namespace

To prevent attribute name collision, all buffer methods and attributes are wrapped
inside an object that is available under `dbp` key. If you don't like this name,
you can set your own namespace in the [configuration](#configuration).


### What is considered a change?

By default Ember Deep Buffered Proxy uses JSON serialization and strict equality
to compare old and new values. That means that for example two `Date` instances
are considered same as long as they have same time value. If this mechanism
doesn't work for you, you can always provide your own serialization method in options:

```javascript
let buffer = buildProxy(model, {
  serialize(v) {
    return v; // use actual value without any serialization
  }
});
```


### Extending

Ember Deep Buffered Proxy ships with two classes: `ObjectProxy` and `ArrayProxy`.
Each of them has its own driver class (`ObjectProxy.Driver` and `ArrayProxy.Driver`) -
that's the class that gets instantiated under the namespace hook.
Here's a general idea how to extend these classes or define custom proxy class:

```javascript
import { isArray } from '@ember/array';
import buildProxy, { ObjectProxy, ArrayProxy } from 'ember-deep-buffered-proxy';

const MyObjectProxyDriver = ObjectProxy.Driver.extend({
});

const MyObjectProxy = ObjectProxy.extend({
}).reopenClass({
  Driver: MyObjectProxyDriver
});

export default function(content) {
  return buildProxy(content, {
    proxyClassFor(obj) {
      return isArray(obj) ? ArrayProxy : MyObjectProxy;
    }
  });
}
```


### Configuration

To override default configuration just define your settings in `config/environment.js`
under `deepBufferedProxy` key. These are all available options:

```javascript
{
  namespace: 'dbp' // key under which buffer methods and attributes are available
}
```


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
