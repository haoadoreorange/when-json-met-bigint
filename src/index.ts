process.on(`unhandledRejection`, (reason, promise) => {
    console.error(`Unhandled Rejection at:`, promise, `reason:`, reason);
    process.exit(1);
});
import { Options } from "lib";
import "lib/polyfill";
import { newParse } from "parse";
import { stringify } from "stringify";

export default Object.assign(
    (options?: Options) => {
        return {
            parse: newParse(options),
            stringify,
        };
    },
    // default options
    { parse: newParse(), stringify },
);
