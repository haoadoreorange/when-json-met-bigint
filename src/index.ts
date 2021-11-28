process.on(`unhandledRejection`, (reason, promise) => {
    console.error(`Unhandled Rejection at:`, promise, `reason:`, reason);
    process.exit(1);
});
import { JsonBigIntOptions } from "lib";
import { newParse } from "parse";
import { stringify } from "stringify";

export default Object.assign(
    (options?: JsonBigIntOptions) => {
        return {
            parse: newParse(options),
            stringify,
        };
    },
    // default options
    { parse: newParse(), stringify },
);
