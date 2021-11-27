export {};

/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (str, new_str) {
        // If a regex pattern
        if (Object.prototype.toString.call(str).toLowerCase() === `[object regexp]`) {
            // @ts-expect-error // TODO: ts bug: compiler doesn't understand type of new_str because of overloaded functions
            return this.replace(str, new_str);
        }

        // If a string
        // @ts-expect-error // TODO: ts bug: compiler doesn't understand type of new_str because of overloaded functions
        return this.replace(new RegExp(str, `g`), new_str);
    };
}
