/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`Force bigint on decimal and scientific notation`, () => {
    it(`should throw when bigintOnDecimalAndScientificAction === 'error'`, () => {
        const JSONB = JSB({
            alwaysParseAsBigInt: true,
            errorOnBigIntDecimalOrScientific: true,
        });
        expect(() => {
            JSONB.parse(`1.23`);
        }).toThrow(`Decimal and scientific notation cannot be BigInt`);
        expect(() => {
            JSONB.parse(`1e23`);
        }).toThrow(`Decimal and scientific notation cannot be BigInt`);
    });

    it(`should parse as number when bigintOnDecimalAndScientificAction === 'ignore'`, () => {
        const JSONB = JSB({
            alwaysParseAsBigInt: true,
        });
        expect(typeof JSONB.parse(`1.23`)).toEqual(`number`);
        expect(typeof JSONB.parse(`1e23`)).toEqual(`number`);
    });
});
