/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`Testing indentation: stringify`, function () {
    if (typeof BigInt === `undefined`) {
        console.log(`No native BigInt`);
        return;
    }
    it(`should correctly indent nested objects`, function (done) {
        const JSONB = JSB;
        const obj = {
            // We cannot use n-literals - otherwise older NodeJS versions fail on this test
            big: eval(`123456789012345678901234567890n`),
            small: -42,
            bigConstructed: BigInt(1),
            smallConstructed: Number(2),
            array: [
                {
                    key: 1,
                },
            ],
            object: {
                key: `value`,
                nestedObject: {
                    key: 1,
                },
            },
        };
        // string from small int
        expect(obj.small.toString()).toEqual(`-42`);
        // string from big int
        expect(obj.big.toString()).toEqual(`123456789012345678901234567890`);
        // typeof big int
        expect(typeof obj.big).toEqual(`bigint`);

        const output = JSONB.stringify(obj, null, 4);
        expect(output).toEqual(
            `{\n` +
                `    "big": 123456789012345678901234567890,\n` +
                `    "small": -42,\n` +
                `    "bigConstructed": 1,\n` +
                `    "smallConstructed": 2,\n` +
                `    "array": [\n` +
                `        {\n` +
                `            "key": 1\n` +
                `        }\n` +
                `    ],\n` +
                `    "object": {\n` +
                `        "key": "value",\n` +
                `        "nestedObject": {\n` +
                `            "key": 1\n` +
                `        }\n` +
                `    }\n` +
                `}`,
        );
        done();
    });
});
