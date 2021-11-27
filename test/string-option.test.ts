/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import JSB from "index";

describe(`Testing 'storeAsString' option`, function () {
    const key = `{ "key": 12345678901234567 }`;
    it(`Should show that the key is of type bigint`, function (done) {
        const JSONbig = JSB;
        const result = JSONbig.parse(key);
        expect(typeof result.key).toEqual(`bigint`);
        done();
    });

    it(`Should show that key is of type string, when storeAsString option is true`, function (done) {
        const JSONstring = JSB({ storeAsString: true });
        const result = JSONstring.parse(key);
        expect(typeof result.key).toEqual(`string`);
        done();
    });
});
