/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`Testing parser schema`, function () {
    it(`should respect schema`, function () {
        const JSONB = JSB;
        expect(typeof JSONB.parse(`123`, null, `bigint`)).toEqual(`bigint`);
        expect(typeof JSONB.parse(`{"a": {"b": 123} }`, null, { a: { b: `bigint` } }).a.b).toEqual(
            `bigint`,
        );
        expect(() => {
            JSONB.parse(`{"a": {"b": 123} }`, null, {
                a: {
                    b: (n) => {
                        if (typeof n === `number`) throw new Error(`Expect bigint but found ${n}`);
                        return `bigint`;
                    },
                },
            });
        }).toThrow(`Expect bigint but found 123`);

        const o1 = JSONB.parse(`{"a": 1, "b": 2, "c": 3 }`, null, {
            [Symbol.for(`any`)]: `bigint`,
        });
        expect(typeof o1.a).toEqual(`bigint`);
        expect(typeof o1.b).toEqual(`bigint`);
        expect(typeof o1.c).toEqual(`bigint`);

        const o2 = JSONB.parse(`{"a": [1, 2, 3] }`, null, { a: [`bigint`] });
        expect(typeof o2.a[0]).toEqual(`bigint`);
        expect(typeof o2.a[1]).toEqual(`bigint`);
        expect(typeof o2.a[2]).toEqual(`bigint`);

        const o3 = JSONB.parse(`{"a": [1, 2, 3] }`, null, { a: [`bigint`, `bigint`] });
        expect(typeof o3.a[0]).toEqual(`bigint`);
        expect(typeof o3.a[1]).toEqual(`bigint`);

        const o4 = JSONB.parse(`{"a": [1, 2, 3] }`, null, { a: [`bigint`, null] });
        expect(typeof o4.a[0]).toEqual(`bigint`);

        const o5 = JSONB.parse(`{"a": [1, 2, 3] }`, null, { a: [null, null, `bigint`] });
        expect(typeof o5.a[2]).toEqual(`bigint`);
    });
});
