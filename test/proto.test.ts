/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`__proto__ and constructor assignment`, function () {
    it(`should set __proto__ property but not a prototype if protoAction is set to preserve`, () => {
        const JSONB = JSB({ protoAction: `preserve` });
        const obj = JSONB.parse(`{ "__proto__": { "admin": true } }`);
        expect(obj.admin).not.toEqual(true);
    });

    it(`should throw an exception if protoAction set to invalid value`, () => {
        expect(() => {
            JSB({ protoAction: `invalid value` as `error` });
        }).toThrow(
            `Incorrect value for protoAction option, must be "error" or "ignore" or "preserve" but passed invalid value`,
        );
    });

    it(`should throw an exception if constructorAction set to invalid value`, () => {
        expect(() => {
            JSB({ constructorAction: `invalid value` as `error` });
        }).toThrow(
            `Incorrect value for constructorAction option, must be "error" or "ignore" or "preserve" but passed invalid value`,
        );
    });

    it(`should throw an exception if protoAction set to error and there is __proto__ property`, () => {
        const JSONB = JSB({ protoAction: `error` });
        expect(() => JSONB.parse(`{ "\\u005f_proto__": 1000000000000000 }`)).toThrow(
            `Object contains forbidden prototype property`,
        );
    });

    it(`should throw an exception if constructorAction set to error and there is constructor property`, () => {
        const JSONB = JSB({ protoAction: `error`, constructorAction: `error` });
        expect(() => JSONB.parse(`{ "constructor": 1000000000000000 }`)).toThrow(
            `Object contains forbidden constructor property`,
        );
    });

    it(`should ignore __proto__ property if protoAction is set to ignore`, () => {
        const JSONB = JSB({ protoAction: `ignore` });
        const obj1 = JSONB.parse(
            `{ "__proto__": 1000000000000000, "a" : 42, "nested": { "__proto__": false, "b": 43 } }`,
        );
        expect(Object.getPrototypeOf(obj1)).toEqual(Object.getPrototypeOf({}));
        expect(obj1).toEqual({ a: 42, nested: { b: 43 } });
    });

    it(`should ignore constructor property if constructorAction is set to ignore`, () => {
        const JSONB = JSB({ constructorAction: `ignore` });
        const obj1 = JSONB.parse(
            `{ "constructor": 1000000000000000, "a" : 42, "nested": { "constructor": false, "b": 43 } }`,
        );
        expect(obj1).toEqual({ a: 42, nested: { b: 43 } });
    });
});
