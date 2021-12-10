process.on(`unhandledRejection`, (reason, promise) => {
    console.error(`Unhandled Rejection at:`, promise, `reason:`, reason);
    process.exit(1);
});
import { JsonBigIntOptions } from "lib";
import { newParse, Schema } from "parse";
import { stringify } from "stringify";

const parse = newParse();
// eslint-disable-next-line @typescript-eslint/naming-convention
export const JSONB = Object.assign(
    (options?: JsonBigIntOptions) => {
        return {
            parse: newParse(options),
            stringify,
        };
    },
    // default options
    { parse, stringify },
);
export { parse, stringify, Schema };
