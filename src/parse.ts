import { isObject, Options } from "lib";
// regexpxs extracted from
// (c) BSD-3-Clause
// https://github.com/fastify/secure-json-parse/graphs/contributors and https://github.com/hapijs/bourne/graphs/contributors

const suspect_proto_rx =
    /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
const suspect_constructor_rx =
    /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;

/*
    json_parse.js
    2012-06-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.
    During create you can (optionally) specify some behavioural switches

        require('json-bigint')(options)

            The optional options parameter holds switches that drive certain
            aspects of the parsing process:
            * options.strict = true will warn about duplicate-key usage in the json.
              The default (strict = false) will silently ignore those and overwrite
              values for keys that are in duplicate use.

    The resulting function follows this signature:
        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*members "", "\"", "\/", "\\", at, b, call, charAt, f, fromCharCode,
    hasOwnProperty, message, n, name, prototype, push, r, t, text
*/

type Value = Record<string, unknown> | unknown[] | string | number | bigint | boolean | null;
export const newParse = (user_options?: Options): typeof JSON.parse => {
    "use strict";

    // This is a function that can parse a JSON text, producing a JavaScript
    // data structure. It is a simple, recursive descent parser. It does not use
    // eval or regular expressions, so it can be used as a model for implementing
    // a JSON parser in other languages.

    // We are defining the function inside of another function to avoid creating
    // global variables.

    // Default options one can override by passing options to the parse()
    const options: Options = {
        strict: false, // not being strict means do not generate syntax errors for "duplicate key"
        storeAsString: false, // toggles whether the values should be stored as BigNumber (default) or a string
        alwaysParseAsBig: false, // toggles whether all numbers should be Big
        protoAction: `error`,
        constructorAction: `error`,
    };

    // If there are options, then use them to override the default _options
    if (user_options !== undefined && user_options !== null) {
        if (user_options.strict === true) {
            options.strict = true;
        }
        if (user_options.storeAsString === true) {
            options.storeAsString = true;
        }
        options.alwaysParseAsBig =
            user_options.alwaysParseAsBig === true ? user_options.alwaysParseAsBig : false;

        if (typeof user_options.constructorAction !== `undefined`) {
            if (
                user_options.constructorAction === `error` ||
                user_options.constructorAction === `ignore` ||
                user_options.constructorAction === `preserve`
            ) {
                options.constructorAction = user_options.constructorAction;
            } else {
                throw new Error(
                    // this case is possible in JS but not TS
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `Incorrect value for constructorAction option, must be "error", "ignore" or undefined but passed ${user_options.constructorAction}`,
                );
            }
        }

        if (typeof user_options.protoAction !== `undefined`) {
            if (
                user_options.protoAction === `error` ||
                user_options.protoAction === `ignore` ||
                user_options.protoAction === `preserve`
            ) {
                options.protoAction = user_options.protoAction;
            } else {
                throw new Error(
                    // this case is possible in JS but not TS
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `Incorrect value for protoAction option, must be "error", "ignore" or undefined but passed ${user_options.protoAction}`,
                );
            }
        }
    }

    let at: number, // The index of the current character
        ch: string, // The current character
        text: string;
    const escapee = {
        '"': `"`,
        "\\": `\\`,
        "/": `/`,
        b: `\b`,
        f: `\f`,
        n: `\n`,
        r: `\r`,
        t: `\t`,
    };
    const error = (m: string) => {
        // Call error when something is wrong.
        throw {
            name: `SyntaxError`,
            message: m,
            at: at,
            text: text,
        };
    };
    const next = (c?: string) => {
        // If a c parameter is provided, verify that it matches the current character.

        if (c && c !== ch) {
            return error(`Expected '` + c + `' instead of '` + ch + `'`);
        }

        // Get the next character. When there are no more characters,
        // return the empty string.

        ch = text.charAt(at);
        at += 1;
        return ch;
    };
    const number = function () {
        // Parse a number value.

        let string = ``;

        if (ch === `-`) {
            string = `-`;
            next(`-`);
        }
        while (ch >= `0` && ch <= `9`) {
            string += ch;
            next();
        }
        if (ch === `.`) {
            string += `.`;
            while (next() && ch >= `0` && ch <= `9`) {
                string += ch;
            }
        }
        if (ch === `e` || ch === `E`) {
            string += ch;
            next();
            // @ts-expect-error next() change ch
            if (ch === `-` || ch === `+`) {
                string += ch;
                next();
            }
            while (ch >= `0` && ch <= `9`) {
                string += ch;
                next();
            }
        }
        const number = +string;
        if (!isFinite(number)) {
            return error(`Bad number`);
        } else {
            if (Number.isSafeInteger(number)) return !options.alwaysParseAsBig ? number : BigInt(number);
            // Number with fractional part should be treated as number(double) including big integers in scientific notation, i.e 1.79e+308
            else return options.storeAsString ? string : /[.eE]/.test(string) ? number : BigInt(string);
        }
    };

    const string = function () {
        // Parse a string value.

        let hex,
            i,
            string = ``,
            uffff;

        // When parsing for string values, we must look for " and \ characters.

        if (ch === `"`) {
            let start_at = at;
            while (next()) {
                if (ch === `"`) {
                    if (at - 1 > start_at) string += text.substring(start_at, at - 1);
                    next();
                    return string;
                }
                if (ch === `\\`) {
                    if (at - 1 > start_at) string += text.substring(start_at, at - 1);
                    next();
                    if (ch === `u`) {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === `string`) {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                    start_at = at;
                }
            }
        }
        return error(`Bad string`);
    };
    const white = function () {
        // Skip whitespace.

        while (ch && ch <= ` `) {
            next();
        }
    };
    const word = function () {
        // true, false, or null.

        switch (ch) {
            case `t`:
                next(`t`);
                next(`r`);
                next(`u`);
                next(`e`);
                return true;
            case `f`:
                next(`f`);
                next(`a`);
                next(`l`);
                next(`s`);
                next(`e`);
                return false;
            case `n`:
                next(`n`);
                next(`u`);
                next(`l`);
                next(`l`);
                return null;
        }
        return error(`Unexpected '${ch}'`);
    };
    const array = function () {
        // Parse an array value.

        const array: Value[] = [];

        if (ch === `[`) {
            next(`[`);
            white();
            // @ts-expect-error next() change ch
            if (ch === `]`) {
                next(`]`);
                return array; // empty array
            }
            while (ch) {
                array.push(value());
                white();
                // @ts-expect-error next() change ch
                if (ch === `]`) {
                    next(`]`);
                    return array;
                }
                next(`,`);
                white();
            }
        }
        return error(`Bad array`);
    };
    const object = function () {
        // Parse an object value.

        let key;
        const object = Object.create(null) as Record<string, unknown>;

        if (ch === `{`) {
            next(`{`);
            white();
            // @ts-expect-error next() change ch
            if (ch === `}`) {
                next(`}`);
                return object; // empty object
            }
            while (ch) {
                key = string();
                white();
                next(`:`);
                if (options.strict === true && Object.hasOwnProperty.call(object, key)) {
                    error(`Duplicate key "${key}"`);
                }

                if (suspect_proto_rx.test(key) === true) {
                    if (options.protoAction === `error`) {
                        error(`Object contains forbidden prototype property`);
                    } else if (options.protoAction === `ignore`) {
                        value();
                    } else {
                        object[key] = value();
                    }
                } else if (suspect_constructor_rx.test(key) === true) {
                    if (options.constructorAction === `error`) {
                        error(`Object contains forbidden constructor property`);
                    } else if (options.constructorAction === `ignore`) {
                        value();
                    } else {
                        object[key] = value();
                    }
                } else {
                    object[key] = value();
                }

                white();
                // @ts-expect-error next() change ch
                if (ch === `}`) {
                    next(`}`);
                    return object;
                }
                next(`,`);
                white();
            }
        }
        return error(`Bad object`);
    };
    const value = (): Value => {
        // Parse a JSON value. It could be an object, an array, a string, a number,
        // or a word.

        white();
        switch (ch) {
            case `{`:
                return object();
            case `[`:
                return array();
            case `"`:
                return string();
            case `-`:
                return number();
            default:
                return ch >= `0` && ch <= `9` ? number() : word();
        }
    };

    // Return the json_parse function. It will have access to all of the above
    // functions and variables.

    return function (source, reviver) {
        text = source + ``;
        at = 0;
        ch = ` `;
        const result = value();
        white();
        if (ch) {
            error(`Syntax error`);
        }

        // If there is a reviver function, we recursively walk the new structure,
        // passing each name/value pair to the reviver function for possible
        // transformation, starting with a temporary root object that holds the result
        // in an empty key. If there is not a reviver function, we simply return the
        // result.

        return typeof reviver === `function`
            ? ((function walk(holder: Record<string, unknown>, key: string) {
                  let v;
                  const value = holder[key];
                  if (value && isObject(value)) {
                      Object.keys(value).forEach(function (k) {
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          v = walk(value, k);
                          if (v !== undefined) {
                              value[k] = v;
                          } else {
                              delete value[k];
                          }
                      });
                  }
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                  return reviver.call(holder, key, value);
              })({ "": result }, ``) as Value)
            : result;
    };
};
