// test if JSONbig is following API of default JSON

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import JSB from "index";

describe(`__proto__ and constructor assignment`, function () {
    it(`should throw when parse("01") or parse("-01")`, () => {
        const JSONbig = JSB;
        expect(() => {
            JSONbig.parse(`01`);
        }).toThrow(`Bad number`);
        expect(() => {
            JSONbig.parse(`-01`);
        }).toThrow(`Bad number`);
    });

    it(`should parse number bigger than infinity limit (> 1.797693134862315E+308) as Infinity`, () => {
        const JSONbig = JSB;
        expect(JSONbig.parse(`1e+500`)).toEqual(Infinity);
    });

    it(`should set __proto__ property but not prototype`, () => {
        const JSONbig = JSB;
        const obj = JSONbig.parse(`{ "__proto__": { "admin": true } }`);
        expect(obj.admin).not.toEqual(true);
    });
});
