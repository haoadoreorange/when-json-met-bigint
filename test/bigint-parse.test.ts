/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { JSONB as JSB } from "index";

describe(`Testing native BigInt support: parse`, function () {
    if (typeof BigInt === `undefined`) {
        console.log(`No native BigInt`);
        return;
    }
    const input = `{"big":92233720368547758070,"small":123,"deci":1234567890.0123456,"shortExp":1.79e+308,"longExp":1.7976931348623157e+308}`;

    it(`Should show JSONB does support parsing native BigInt`, function (done) {
        const JSONB = JSB;
        const obj = JSONB.parse(input);
        // small int
        expect(obj.small).toEqual(123);
        // big int
        expect(obj.big.toString()).toEqual(`92233720368547758070`);
        // big int
        expect(typeof obj.big).toEqual(`bigint`);
        done();
    });

    it(`Should show JSONB does support forced parsing to native BigInt`, function (done) {
        const JSONB = JSB({
            alwaysParseAsBigInt: true,
        });
        const obj = JSONB.parse(input);
        // big int
        expect(obj.big.toString()).toEqual(`92233720368547758070`);
        // big int
        expect(typeof obj.big).toEqual(`bigint`);
        // small int
        expect(obj.small.toString()).toEqual(`123`);
        // small int
        expect(typeof obj.small).toEqual(`bigint`);
        done();
    });

    it(`Should show JSONB does support decimal and scientific notation parse/stringify roundtrip`, function (done) {
        const JSONB = JSB;
        const obj = JSONB.parse(input);
        // decimal number
        expect(obj.deci.toString()).toEqual(`1234567890.0123456`);
        // decimal number
        expect(typeof obj.deci).toEqual(`number`);
        // short exponential number
        expect(obj.shortExp.toString()).toEqual(`1.79e+308`);
        // short exponential number
        expect(typeof obj.shortExp).toEqual(`number`);
        // long exponential number
        expect(obj.longExp.toString()).toEqual(`1.7976931348623157e+308`);
        // long exponential number
        expect(typeof obj.longExp).toEqual(`number`);
        const output = JSONB.stringify(obj);
        expect(output).toEqual(input);
        done();
    });

    it(`Should show JSONB does support native Bigint parse/stringify roundtrip`, function (done) {
        const JSONB = JSB;
        const obj = JSONB.parse(input);
        const output = JSONB.stringify(obj);
        expect(output).toEqual(input);
        done();
    });

    it(`Should show JSONB does support native Bigint parse/stringify roundtrip when BigInt is forced`, function (done) {
        const JSONB = JSB({
            alwaysParseAsBigInt: true,
        });
        const obj = JSONB.parse(input);
        const output = JSONB.stringify(obj);
        expect(output).toEqual(input);
        done();
    });
});
