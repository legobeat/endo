import { test } from 'tape-promise/tape';
import { makeEvaluators } from '@agoric/evaluate';

import * as babelCore from '@babel/core';

import makeModuleTransformer from '../src/index';
import * as h from '../src/hidden';

test(`export named`, async t => {
  try {
    const makeImporter = (srcSpec, createStaticRecord, evaluateProgram) => {
      const { spec, source } = srcSpec;
      let actualSource;
      const doImport = async () => {
        const staticRecord = createStaticRecord(actualSource);
        const exportNS = {};
        const onceProxy = new Proxy(
          {},
          {
            get(_target, prop) {
              return value => (exportNS[prop] = value);
            },
          },
        );
        const endow = Object.create(null, {
          def: {
            get() {
              return exportNS.def;
            },
            set(value) {
              exportNS.def = value;
            },
          },
        });
        const functorArg = {
          [h.HIDDEN_ONCE]: onceProxy,
          [h.HIDDEN_LIVE]: onceProxy,
          [h.HIDDEN_IMPORTS](_imports) {},
        };
        // console.log(staticRecord.functorSource);
        evaluateProgram(staticRecord.functorSource, endow)(functorArg);
        return exportNS;
      };

      if (spec === undefined && source !== undefined) {
        actualSource = source;
        return doImport;
      }

      throw Error(`No import expression`);
      // return doImport();
    };

    const transforms = [makeModuleTransformer(babelCore, makeImporter)];
    const { evaluateModule } = makeEvaluators({
      transforms,
    });

    t.deepEqual(
      await evaluateModule(`\
export const abc = 123;
export const { def, nest: [, ghi, ...nestrest], ...rest } = { def: 456, nest: [ 'skip', 789, 'a', 'b' ], other: 999, and: 998 };
`),
      {
        abc: 123,
        def: 456,
        ghi: 789,
        rest: { other: 999, and: 998 },
        nestrest: ['a', 'b'],
      },
      `const exports`,
    );

    t.deepEqual(
      await evaluateModule(`\
export let abc = 123;
export let def = 456;
export let def2 = def;
def ++;
export const ghi = 789;
`),
      { abc: 123, def: 457, def2: 456, ghi: 789 },
      `let exports`,
    );
  } catch (e) {
    console.log('unexpected exception', e);
    t.assert(false, e);
  } finally {
    t.end();
  }
});

test(`export hoisting`, async t => {
  try {
    const makeImporter = (srcSpec, createStaticRecord, evaluateProgram) => {
      const { spec, source } = srcSpec;
      let actualSource;
      const doImport = async () => {
        const staticRecord = createStaticRecord(actualSource);
        const exportNS = {};
        const onceProxy = new Proxy(
          {},
          {
            get(_target, prop) {
              return value => (exportNS[prop] = value);
            },
          },
        );
        const makeLive = vname => ({
          get() {
            if (vname in exportNS) {
              return exportNS[vname];
            }
            throw ReferenceError(`${vname} is not defined`);
          },
          set(value) {
            return (exportNS[vname] = value);
          },
        });
        const endow = Object.create(null, {
          abc: makeLive('abc'),
          fn: makeLive('fn'),
        });
        const functorArg = {
          [h.HIDDEN_ONCE]: onceProxy,
          [h.HIDDEN_LIVE]: onceProxy,
          [h.HIDDEN_IMPORTS](_imports) {},
        };
        console.log(staticRecord.functorSource);
        evaluateProgram(staticRecord.functorSource, endow)(functorArg);
        return exportNS;
      };

      if (spec === undefined && source !== undefined) {
        actualSource = source;
        return doImport;
      }

      throw Error(`No import expression`);
      // return doImport();
    };

    const transforms = [makeModuleTransformer(babelCore, makeImporter)];
    const { evaluateModule } = makeEvaluators({
      transforms,
    });

    await t.rejects(
      evaluateModule(`\
const abc2 = abc;
export const abc = 123;
`),
      ReferenceError,
      `const exports without hoisting`,
    );

    await t.rejects(
      evaluateModule(`\
const abc2 = abc;
export let abc = 123;
`),
      ReferenceError,
      `let exports without hoisting`,
    );

    const { abc, abc2, abc3 } = await evaluateModule(`\
export const abc2 = abc;
export var abc = 123;
export const abc3 = abc;
`);
    t.equal(abc2, undefined, `undefined instead of tdz`);
    t.equal(abc, abc3, `var exports with hoisting`);
    t.equal(abc, 123, `abc evaluates`);

    const { fn, fn2, fn3 } = await evaluateModule(`\
export const fn2 = fn;
export function fn() {
  return 'foo';
}
export const fn3 = fn;
`);
    t.equal(fn2, undefined, `undefined instead of tdz`);
    t.equal(fn, fn3, `function exports with hoisting`);
    t.equal(fn(), 'foo', `fn evaluates`);
  } catch (e) {
    console.log('unexpected exception', e);
    t.assert(false, e);
  } finally {
    t.end();
  }
});
