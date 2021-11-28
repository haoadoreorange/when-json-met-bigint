/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import makeJSON from "index";

describe(`__proto__ and constructor assignment`, function () {
    it(`should set __proto__ property but not a prototype if protoAction is set to preserve`, () => {
        const JSONbig = makeJSON({ protoAction: `preserve` });
        const obj1 = JSONbig.parse(`{ "__proto__": 1000000000000000 }`);
        expect(Object.getPrototypeOf(obj1)).toEqual(null);
        const obj2 = JSONbig.parse(`{ "__proto__": { "admin": true } }`);
        expect(obj2.admin).not.toEqual(true);
    });

    it(`should throw an exception if protoAction set to invalid value`, () => {
        expect(() => {
            makeJSON({ protoAction: `invalid value` as `error` });
        }).toThrow(
            `Incorrect value for protoAction option, must be error, ignore, preserve but passed invalid value`,
        );
    });

    it(`should throw an exception if constructorAction set to invalid value`, () => {
        expect(() => {
            makeJSON({ constructorAction: `invalid value` as `error` });
        }).toThrow(
            `Incorrect value for constructorAction option, must be error, ignore, preserve but passed invalid value`,
        );
    });

    it(`should throw an exception if protoAction set to error and there is __proto__ property`, () => {
        const JSONbig = makeJSON({ protoAction: `error` });
        expect(() => JSONbig.parse(`{ "\\u005f_proto__": 1000000000000000 }`)).toThrow(
            `Object contains forbidden prototype property`,
        );
    });

    it(`should throw an exception if constructorAction set to error and there is constructor property`, () => {
        const JSONbig = makeJSON({ protoAction: `error` });
        expect(() => JSONbig.parse(`{ "constructor": 1000000000000000 }`)).toThrow(
            `Object contains forbidden constructor property`,
        );
    });

    it(`should ignore __proto__ property if protoAction is set to ignore`, () => {
        const JSONbig = makeJSON({ protoAction: `ignore` });
        const obj1 = JSONbig.parse(
            `{ "__proto__": 1000000000000000, "a" : 42, "nested": { "__proto__": false, "b": 43 } }`,
        );
        expect(Object.getPrototypeOf(obj1)).toEqual(null);
        expect(obj1).toEqual({ a: 42, nested: { b: 43 } });
    });

    it(`should ignore constructor property if constructorAction is set to ignore`, () => {
        const JSONbig = makeJSON({ constructorAction: `ignore` });
        const obj1 = JSONbig.parse(
            `{ "constructor": 1000000000000000, "a" : 42, "nested": { "constructor": false, "b": 43 } }`,
        );
        expect(obj1).toEqual({ a: 42, nested: { b: 43 } });
    });
});
