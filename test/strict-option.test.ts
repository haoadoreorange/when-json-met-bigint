/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import JSB from "index";

describe(`Testing 'strict' option`, function () {
    const dupkeys = `{ "dupkey": "value 1", "dupkey": "value 2"}`;
    it(`Should show that duplicate keys just get overwritten by default`, function (done) {
        const JSONbig = JSB;
        let result: any = `before`;
        function tryParse() {
            result = JSONbig.parse(dupkeys);
        }
        expect(tryParse).not.toThrow(`anything`);
        expect(result.dupkey).toEqual(`value 2`);
        done();
    });

    it(`Should show that the 'strict' option will fail-fast on duplicate keys`, function (done) {
        const JSONstrict = JSB({ strict: true });
        let result = `before`;
        function tryParse() {
            result = JSONstrict.parse(dupkeys);
        }

        expect(tryParse).toThrow(`Duplicate key "dupkey"`);
        expect(result).toEqual(`before`);
        done();
    });
});
