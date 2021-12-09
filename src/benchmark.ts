import fs from "fs";
import { performance } from "perf_hooks";
import { JSONB } from "index";

const RESULT_FILE_PATH = `benchmark.md`;
const NB_OF_ITERATION = 100;
const FLUSH_THRESHOLD = 100;
const SMALL_ARRAY_LENGTH = 1000;
const BIG_ARRAY_LENGTH = SMALL_ARRAY_LENGTH * 100;

const forceGC = () => {
    if (global.gc) {
        global.gc();
    } else {
        console.warn(`No GC hook! Start your program as \`node --expose-gc file.js\`.`);
    }
};

class Result {
    private _text = ``;
    private _i = 0;
    constructor() {
        fs.writeFileSync(RESULT_FILE_PATH, ``, `utf8`);
    }
    append(s: string) {
        console.log(s);
        this._text += `${s}\n\n`;
        this._i++;
        if (this._i === FLUSH_THRESHOLD) {
            this.flush();
            this._i = 0;
        }
    }
    flush() {
        fs.appendFileSync(RESULT_FILE_PATH, this._text, `utf8`);
        this._text = ``;
        forceGC();
    }
}
const result = new Result();

function benchmark(f: () => void, nb_of_iteration: number, title: string) {
    result.append(`===> ${title}`);
    let total = 0;
    for (let i = 0; i < nb_of_iteration; i++) {
        const start = performance.now();
        f();
        const exec_time = performance.now() - start;
        total += exec_time;
        // result.append(`Iteration ${i} exec time: ${exec_time}`);
    }
    const average = total / nb_of_iteration;
    result.append(`===> Done, ${nb_of_iteration} iterations average exec time: ${average}`);
    return average;
}

const o = {
    a: `Lorem ipsum dolor sit amet`,
    b: `Lorem ipsum dolor sit amet`,
    c: `Lorem ipsum dolor sit amet`,
    s: BigInt(Number.MAX_SAFE_INTEGER) + 100n,
    e: BigInt(Number.MAX_SAFE_INTEGER) + 100n,
};

const o1 = { ...o, array: [] as Record<string, unknown>[], name: `o1 (small array contains BigInt)` };
for (let i = 0; i < SMALL_ARRAY_LENGTH; i++) {
    o1.array.push(o);
}

const o2 = { ...o, x: [] as number[], y: [] as number[], name: `o2 (big array no BigInt)` };
for (let i = 0; i < BIG_ARRAY_LENGTH; i++) {
    o2.x.push(99999);
    o2.y.push(99999);
}

const o3 = { ...o, array: [] as Record<string, unknown>[], name: `o3 (big array contains BigInt)` };
for (let i = 0; i < BIG_ARRAY_LENGTH; i++) {
    o3.array.push(o);
}

const replacer = (_key_: unknown, value: unknown) =>
    typeof value === `bigint` ? value.toString() + `n` : value;
function jsonStringify(o: Record<string, unknown>) {
    return () => JSON.stringify(o, replacer).replace(/"(-?\d+)n"/g, `$1`);
}

function jsonBigStringify(o: Record<string, unknown>) {
    return () => JSONB.stringify(o);
}

const average_json_stringify_o1 = benchmark(jsonStringify(o1), NB_OF_ITERATION, `JSON.stringify ${o1.name}`);
const average_json_big_stringify_o1 = benchmark(
    jsonBigStringify(o1),
    NB_OF_ITERATION,
    `JSONB.stringify ${o1.name}`,
);
const average_json_stringify_o2 = benchmark(jsonStringify(o2), NB_OF_ITERATION, `JSON.stringify ${o2.name}`);
const average_json_big_stringify_o2 = benchmark(
    jsonBigStringify(o2),
    NB_OF_ITERATION,
    `JSONB.stringify ${o2.name}`,
);
const average_json_stringify_o3 = benchmark(jsonStringify(o3), NB_OF_ITERATION, `JSON.stringify ${o3.name}`);
const average_json_big_stringify_o3 = benchmark(
    jsonBigStringify(o3),
    NB_OF_ITERATION,
    `JSONB.stringify ${o3.name}`,
);

result.append(
    `***\n ${NB_OF_ITERATION} iterations average exec time stringify ${o1.name}: JSON = ${
        average_json_stringify_o1 / average_json_big_stringify_o1
    } x JSONB \n***`,
);
result.append(
    `***\n ${NB_OF_ITERATION} iterations average exec time stringify ${o2.name}: JSON = ${
        average_json_stringify_o2 / average_json_big_stringify_o2
    } x JSONB \n***`,
);
result.append(
    `***\n ${NB_OF_ITERATION} iterations average exec time stringify ${o3.name}: JSON = ${
        average_json_stringify_o3 / average_json_big_stringify_o3
    } x JSONB \n***`,
);
result.flush();
