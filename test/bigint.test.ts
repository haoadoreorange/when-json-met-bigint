/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`Testing bigint support`, function () {
    const input = `{"big":9223372036854775807,"small":123,"decimal":51.971428571428575}`;

    it(`Should show classic JSON.parse lacks bigint support`, function (done) {
        const obj = JSON.parse(input);
        // string from small int
        expect(obj.small.toString()).toEqual(`123`);
        // string from small float
        expect(obj.decimal.toString()).toEqual(`51.971428571428575`);
        // string from big int
        expect(obj.big.toString()).not.toEqual(`9223372036854775807`);

        const output = JSON.stringify(obj);
        expect(output).not.toEqual(input);
        done();
    });

    it(`Should show JSONB does support bigint parse/stringify roundtrip`, function (done) {
        const JSONB = JSB;
        const obj = JSONB.parse(input);
        // string from small int
        expect(obj.small.toString()).toEqual(`123`);
        // string from small float
        expect(obj.decimal.toString()).toEqual(`51.971428571428575`);
        // string from big int
        expect(obj.big.toString()).toEqual(`9223372036854775807`);
        // instanceof big int
        expect(typeof obj.big).toEqual(`bigint`);

        const output = JSONB.stringify(obj);
        expect(output).toEqual(input);
        done();
    });
});
