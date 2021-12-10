/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-floating-promises */
process.on(`unhandledRejection`, (reason, promise) => {
    console.error(`Unhandled Rejection reason:`);
    console.error(reason);
    console.error(`Unhandled Rejection at:`);
    console.error(promise);
    process.exit(1);
});
import { JSONB } from "index";
import b from "benny";

const SMALL_ARRAY_LENGTH = 1000;
const BIG_ARRAY_LENGTH = SMALL_ARRAY_LENGTH * 100;

declare global {
    interface String {
        replaceAll: (str: string, new_str: string) => string;
    }
}
String.prototype.replaceAll = function (str, new_str) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === `[object regexp]`) {
        return this.replace(str, new_str);
    }
    // If a string
    return this.replace(new RegExp(str, `g`), new_str);
};

const suiteArgs = (suite_name: string) => [
    b.cycle(),
    b.complete(),
    b.save({ file: suite_name.replaceAll(` `, `-`) }),
    b.save({ file: suite_name.replaceAll(` `, `-`), format: `table.html` }),
];

const o = {
    a: `Lorem ipsum dolor sit amet`,
    b: `Lorem ipsum dolor sit amet`,
    c: `Lorem ipsum dolor sit amet`,
    s: BigInt(Number.MAX_SAFE_INTEGER) + 100n,
    e: BigInt(Number.MAX_SAFE_INTEGER) + 100n,
};
type TestObject = typeof o & {
    array: Record<string, unknown>[];
    name: string;
} & {
    [key: string]: typeof o;
};

const o1 = {
    ...o,
    array: [],
    name: `small obj with BigInt`,
} as unknown as TestObject;
for (let i = 0; i < SMALL_ARRAY_LENGTH; i++) {
    o1[`i${i}`] = o;
    o1.array.push(o);
}

const o2 = { ...o, x: [], y: [], name: `big obj no BigInt` } as unknown as TestObject & {
    x: number[];
    y: number[];
};
for (let i = 0; i < BIG_ARRAY_LENGTH; i++) {
    o2[`i${i}`] = { ...o, s: 99999, e: 99999 } as unknown as typeof o;
    o2.x.push(99999);
    o2.y.push(99999);
}

const o3 = { ...o, array: [], name: `big obj with BigInt` } as unknown as TestObject;
for (let i = 0; i < BIG_ARRAY_LENGTH; i++) {
    o3[`i${i}`] = o;
    o3.array.push(o);
}

const replacer = (_key_: unknown, value: unknown) =>
    typeof value === `bigint` ? value.toString() + `n` : value;
const jsonStringify = (o: Record<string, unknown>) => () =>
    JSON.stringify(o, replacer).replace(/"(-?\d+)n"/g, `$1`);
const jsonbStringify = (o: Record<string, unknown>) => () => JSONB.stringify(o);

const suite1_name = `stringify ${o1.name}`;
b.suite(
    suite1_name,
    b.add(`JSON`, jsonStringify(o1)),
    b.add(`when-json-met-bigint`, jsonbStringify(o1)),
    ...suiteArgs(suite1_name),
);
const suite2_name = `stringify ${o2.name}`;
b.suite(
    suite2_name,
    b.add(`JSON`, jsonStringify(o2)),
    b.add(`when-json-met-bigint`, jsonbStringify(o2)),
    ...suiteArgs(suite2_name),
);
const suite3_name = `stringify ${o3.name}`;
b.suite(
    suite3_name,
    b.add(`JSON`, jsonStringify(o3)),
    b.add(`when-json-met-bigint`, jsonbStringify(o3)),
    ...suiteArgs(suite3_name),
);

const s1 = JSONB.stringify(o1);
const s2 = JSONB.stringify(o2);
const s3 = JSONB.stringify(o3);
const reviver = (_key_: string, value: unknown) => {
    if (typeof value === `string`) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const matchArray = /(-?\d{16,})n/.exec(value);
        if (matchArray) {
            // "1234567890123456789n" => 1234567890123456789n
            return BigInt(matchArray[1]);
        }
    }
    return value;
};
const jsonParse = (s: string) => () => {
    s = s.replace(/:(-?\d{16,})([,}])/g, `:"$1n"$2`);
    return JSON.parse(s, reviver);
};
const jsonbParse = (s: string) => () => JSONB.parse(s);

const suite4_name = `parse ${o1.name}`;
b.suite(
    suite4_name,
    b.add(`JSON`, jsonParse(s1)),
    b.add(`when-json-met-bigint`, jsonbParse(s1)),
    ...suiteArgs(suite4_name),
);
const suite5_name = `parse ${o2.name}`;
b.suite(
    suite5_name,
    b.add(`JSON`, jsonParse(s2)),
    b.add(`when-json-met-bigint`, jsonbParse(s2)),
    ...suiteArgs(suite5_name),
);
const suite6_name = `parse ${o3.name}`;
b.suite(
    suite6_name,
    b.add(`JSON`, jsonParse(s3)),
    b.add(`when-json-met-bigint`, jsonbParse(s3)),
    ...suiteArgs(suite6_name),
);
