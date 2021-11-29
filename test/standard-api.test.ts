// test if JSONB is following API of default JSON

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import JSB from "index";

describe(`__proto__ and constructor assignment`, function () {
    it(`should throw when parse("01") or parse("-01")`, () => {
        const JSONB = JSB;
        expect(() => {
            JSONB.parse(`01`);
        }).toThrow(`Bad number`);
        expect(() => {
            JSONB.parse(`-01`);
        }).toThrow(`Bad number`);
    });

    it(`should parse number bigger than infinity limit (> 1.797693134862315E+308) as Infinity`, () => {
        const JSONB = JSB;
        expect(JSONB.parse(`1e+500`)).toEqual(Infinity);
    });

    it(`should set __proto__ property but not prototype`, () => {
        const JSONB = JSB;
        const obj = JSONB.parse(`{ "__proto__": { "admin": true } }`);
        expect(obj.admin).not.toEqual(true);
    });
});
