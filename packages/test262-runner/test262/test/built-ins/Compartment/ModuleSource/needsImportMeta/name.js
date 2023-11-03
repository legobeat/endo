/*---
description:
flags: [onlyStrict]
includes: [propertyHelper.js]
features: [Compartment]
---*/

var descriptor = Object.getOwnPropertyDescriptor(ModuleSource.prototype, 'needsImportMeta');

assert.sameValue(
  typeof descriptor.get,
  'function',
  'typeof descriptor.get is function'
);
assert.sameValue(
  typeof descriptor.set,
  'undefined',
  'typeof descriptor.set is undefined'
);

verifyNotEnumerable(ModuleSource.prototype, 'needsImportMeta');
verifyConfigurable(ModuleSource.prototype, 'needsImportMeta');
