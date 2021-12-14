// test if JSONB is following API of default JSON

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB } from "index";

describe(`Follow default JSON API`, function () {
    it(`throw when parse "01" "-01" "1e"`, () => {
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

    it(`throw on cyclical structure`, () => {
        const o = { a: 1 };
        // @ts-expect-error test
        o.b = o;
        expect(() => {
            JSONB.stringify(o);
        }).toThrow(`cyclic object value`);
    });

    it(`parse number bigger than infinity limit (> 1.797693134862315E+308) as Infinity`, () => {
        expect(JSONB.parse(`1.797693134862316E+308`)).toEqual(Infinity);
    });
    it(`parse number smaller than infinity limit (< 1.797693134862315E+308) as -Infinity`, () => {
        expect(JSONB.parse(`-1.797693134862316E+308`)).toEqual(-Infinity);
    });

    it(`set __proto__ property but not prototype`, () => {
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

    it(`equals default JSON stringify on non-bigint object`, () => {
        expect(JSONB.stringify(obj)).toEqual(JSON.stringify(obj));
    });

    it(`slice if space.length > 10`, () => {
        expect(JSONB.stringify({ a: 123 }, null, `0123456789xxxxx`)).toEqual(
            `{\n0123456789"a": 123\n}`,
        );
    });

    it(`accept Number & String`, () => {
        expect(JSONB.stringify(new Number(123))).toEqual(`123`);
        expect(JSONB.stringify(new String(`abc`))).toEqual(`"abc"`);
    });
});
