/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import JSB from "index";

describe(`Testing native BigInt support: stringify`, function () {
    if (typeof BigInt === `undefined`) {
        console.log(`No native BigInt`);
        return;
    }
    it(`Should show JSONB can stringify native BigInt`, function (done) {
        const JSONB = JSB;
        const obj = {
            // We cannot use n-literals - otherwise older NodeJS versions fail on this test
            big: eval(`123456789012345678901234567890n`),
            small: -42,
            bigConstructed: BigInt(1),
            smallConstructed: Number(2),
        };
        // string from small int
        expect(obj.small.toString()).toEqual(`-42`);
        // string from big int
        expect(obj.big.toString()).toEqual(`123456789012345678901234567890`);
        // typeof big int
        expect(typeof obj.big).toEqual(`bigint`);

        const output = JSONB.stringify(obj);
        expect(output).toEqual(
            `{` +
                `"big":123456789012345678901234567890,` +
                `"small":-42,` +
                `"bigConstructed":1,` +
                `"smallConstructed":2` +
                `}`,
        );
        done();
    });
});
