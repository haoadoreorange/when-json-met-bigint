// test if JSONB is following API of default JSON

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB } from "index";

describe(`__proto__ and constructor assignment`, function () {
    it(`should throw when parse "01" "-01" "1e"`, () => {
        expect(() => {
            JSONB.parse(`01`);
        }).toThrow(`Bad number`);
        expect(() => {
            JSONB.parse(`-01`);
        }).toThrow(`Bad number`);
        expect(() => {
            JSONB.parse(`1e`);
        }).toThrow(`Bad number`);
    });

    it(`should parse number bigger than infinity limit (> 1.797693134862315E+308) as Infinity`, () => {
        expect(JSONB.parse(`1.797693134862316E+308`)).toEqual(Infinity);
    });
    it(`should parse number smaller than infinity limit (< 1.797693134862315E+308) as -Infinity`, () => {
        expect(JSONB.parse(`-1.797693134862316E+308`)).toEqual(-Infinity);
    });

    it(`should set __proto__ property but not prototype`, () => {
        const obj = JSONB.parse(`{ "__proto__": { "admin": true } }`);
        expect(obj.admin).not.toEqual(true);
    });

    const o = {
        a: `Lorem ipsum dolor sit amet`,
        b: `Lorem ipsum dolor sit amet`,
        c: true,
        d: 123,
        e: null,
    };
    const array: Record<string, unknown>[] = [];
    for (let i = 0; i < 1000; i++) {
        array.push(o);
    }
    const obj = {
        ...o,
        f: {
            ...o,
            b: o,
            f: array,
        },
        g: array.map(() => array),
    };

    it(`has roundtrip equality`, () => {
        expect(obj).toEqual(JSONB.parse(JSON.stringify(obj)));
    });

    it(`equals default JSON on non-bigint object`, () => {
        expect(JSONB.stringify(obj)).toEqual(JSON.stringify(obj));
    });
});
