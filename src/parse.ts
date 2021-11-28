import { JsonBigIntOptions, PROTO_ACTIONS, CONSTRUCTOR_ACTIONS } from "lib";

const isNonNullObject = (o: unknown): o is Record<string, unknown> => {
    return typeof o === `object` && o !== null;
};

// regexpxs extracted from
// (c) BSD-3-Clause
// https://github.com/fastify/secure-json-parse/graphs/contributors and https://github.com/hapijs/bourne/graphs/contributors
// eslint-disable-next-line @typescript-eslint/naming-convention
const SUSPECT_PROTO_RX =
    /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
// eslint-disable-next-line @typescript-eslint/naming-convention
const SUSPECT_CONSTRUCTOR_RX =
    /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;

// eslint-disable-next-line @typescript-eslint/naming-convention
const ESCAPEE = {
    '"': `"`,
    "\\": `\\`,
    "/": `/`,
    b: `\b`,
    f: `\f`,
    n: `\n`,
    r: `\r`,
    t: `\t`,
} as const;

type JsonValue = Record<string, unknown> | unknown[] | string | number | bigint | boolean | null;
// Closure for internal state variables.
// Parser's internal state variables are prefixed with p_, methods are prefixed with p
export const newParse = (p_user_options?: JsonBigIntOptions): typeof JSON.parse => {
    // This returns a function that can parse a JSON text, producing a JavaScript
    // data structure. It is a simple, recursive descent parser. It does not use
    // eval or regular expressions, so it can be used as a model for implementing
    // a JSON parser in other languages.

    let p_current_char_index: number, // Index of current character
        p_current_char: string, // Current character
        p_text: string; // Text being parsed

    // Default options.
    const p_options: JsonBigIntOptions = {
        strict: false, // Not being strict means do not generate syntax errors for "duplicate key"
        parseBigIntAsString: false,
        alwaysParseAsBigInt: false, // Toggles whether all numbers should be BigInt
        protoAction: `error`,
        constructorAction: `error`,
    };

    // If there are options, then use them to override the default options.
    // These checks are for JS users with no type checking.
    if (p_user_options) {
        if (p_user_options.strict === true) {
            p_options.strict = p_user_options.strict;
        }
        if (p_user_options.parseBigIntAsString === true) {
            p_options.parseBigIntAsString = p_user_options.parseBigIntAsString;
        }
        if (p_user_options.alwaysParseAsBigInt === true) {
            p_options.alwaysParseAsBigInt = p_user_options.alwaysParseAsBigInt;
        }

        if (p_user_options.protoAction) {
            if (PROTO_ACTIONS.includes(p_user_options.protoAction)) {
                p_options.protoAction = p_user_options.protoAction;
            } else {
                throw new Error(
                    // This case is possible in JS but not TS (hence type never).
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `Incorrect value for protoAction option, must be ${PROTO_ACTIONS.join(`, `)} but passed ${
                        p_user_options.protoAction
                    }`,
                );
            }
        }
        if (p_user_options.constructorAction) {
            if (CONSTRUCTOR_ACTIONS.includes(p_user_options.constructorAction)) {
                p_options.constructorAction = p_user_options.constructorAction;
            } else {
                throw new Error(
                    // This case is possible in JS but not TS (hence type never).
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `Incorrect value for constructorAction option, must be ${CONSTRUCTOR_ACTIONS.join(
                        `, `,
                    )} but passed ${p_user_options.constructorAction}`,
                );
            }
        }
    }

    const pError = (m: string) => {
        // Call error when something is wrong.
        throw {
            name: `SyntaxError`,
            message: m,
            at: p_current_char_index,
            text: p_text,
        };
    };
    const pCurrentCharIs = (c: string) => {
        // Verify that it matches the current character.
        if (c !== p_current_char) {
            return pError(`Expected '` + c + `' instead of '` + p_current_char + `'`);
        }
    };
    const pNext = (c?: string) => {
        // Get the next character. When there are no more characters,
        // return the empty string.
        p_current_char = p_text.charAt(++p_current_char_index);
        // If a c parameter is provided, verify that it matches the next character.
        if (c) pCurrentCharIs(c);
        return p_current_char;
    };
    const pNumber = () => {
        // Parse a number value.

        let result_string = ``;

        if (p_current_char === `-`) {
            result_string = p_current_char;
            pNext();
        }
        while (p_current_char >= `0` && p_current_char <= `9`) {
            result_string += p_current_char;
            pNext();
        }
        if (p_current_char === `.`) {
            result_string += p_current_char;
            while (pNext() && p_current_char >= `0` && p_current_char <= `9`) {
                result_string += p_current_char;
            }
        }
        if (p_current_char === `e` || p_current_char === `E`) {
            result_string += p_current_char;
            pNext();
            // @ts-expect-error next() change ch
            if (p_current_char === `-` || p_current_char === `+`) {
                result_string += p_current_char;
                pNext();
            }
            while (p_current_char >= `0` && p_current_char <= `9`) {
                result_string += p_current_char;
                pNext();
            }
        }
        const result_number = +result_string;
        if (!isFinite(result_number)) {
            return pError(`Bad number`);
        } else {
            if (Number.isSafeInteger(result_number))
                return !p_options.alwaysParseAsBigInt ? result_number : BigInt(result_number);
            // Number with fractional part should be treated as number(double) including big integers in scientific notation, i.e 1.79e+308
            else
                return p_options.parseBigIntAsString
                    ? result_string
                    : /[.eE]/.test(result_string)
                    ? result_number
                    : BigInt(result_string);
        }
    };

    const pString = () => {
        // Parse a string value.

        let result = ``;

        // When parsing for string values, we must look for " and \ characters.

        if (p_current_char === `"`) {
            let start_at = p_current_char_index + 1;
            while (pNext()) {
                if (p_current_char === `"`) {
                    if (p_current_char_index > start_at)
                        result += p_text.substring(start_at, p_current_char_index);
                    pNext();
                    return result;
                }
                if (p_current_char === `\\`) {
                    if (p_current_char_index > start_at)
                        result += p_text.substring(start_at, p_current_char_index);
                    pNext();
                    if (p_current_char === `u`) {
                        let uffff = 0;
                        for (let i = 0; i < 4; i += 1) {
                            const hex = parseInt(pNext(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        result += String.fromCharCode(uffff);
                    } else if (typeof ESCAPEE[p_current_char] === `string`) {
                        result += ESCAPEE[p_current_char];
                    } else {
                        break;
                    }
                    start_at = p_current_char_index + 1;
                }
            }
        }
        return pError(`Bad string`);
    };
    const pSkipWhite = () => {
        // Skip whitespace.
        while (p_current_char && p_current_char <= ` `) {
            pNext();
        }
    };
    const pBooleanOrNull = () => {
        // true, false, or null.
        switch (p_current_char) {
            case `t`:
                pNext(`r`);
                pNext(`u`);
                pNext(`e`);
                pNext();
                return true;
            case `f`:
                pNext(`a`);
                pNext(`l`);
                pNext(`s`);
                pNext(`e`);
                pNext();
                return false;
            case `n`:
                pNext(`u`);
                pNext(`l`);
                pNext(`l`);
                pNext();
                return null;
        }
        return pError(`Unexpected '${p_current_char}'`);
    };
    const pArray = () => {
        // Parse an array value.

        const result: JsonValue[] = [];

        if (p_current_char === `[`) {
            pNext();
            pSkipWhite();
            // @ts-expect-error next() change ch.
            if (p_current_char === `]`) {
                pNext();
                return result; // empty array
            }
            while (p_current_char) {
                result.push(pJsonValue());
                pSkipWhite();
                // @ts-expect-error next() change ch
                if (p_current_char === `]`) {
                    pNext();
                    return result;
                }
                pCurrentCharIs(`,`);
                pNext();
                pSkipWhite();
            }
        }
        return pError(`Bad array`);
    };
    const pObject = () => {
        // Parse an object value.

        // TODO: remove null, we want the object to have Object's prototype
        const result = Object.create(null) as Record<string, unknown>;

        if (p_current_char === `{`) {
            pNext();
            pSkipWhite();
            // @ts-expect-error next() change ch
            if (p_current_char === `}`) {
                pNext();
                return result; // empty object
            }
            while (p_current_char) {
                const key = pString();
                pSkipWhite();
                pCurrentCharIs(`:`);
                pNext();
                if (p_options.strict === true && Object.hasOwnProperty.call(result, key)) {
                    pError(`Duplicate key "${key}"`);
                }

                if (SUSPECT_PROTO_RX.test(key) === true) {
                    if (p_options.protoAction === `error`) {
                        pError(`Object contains forbidden prototype property`);
                    } else if (p_options.protoAction === `ignore`) {
                        pJsonValue();
                    } else {
                        result[key] = pJsonValue();
                    }
                } else if (SUSPECT_CONSTRUCTOR_RX.test(key) === true) {
                    if (p_options.constructorAction === `error`) {
                        pError(`Object contains forbidden constructor property`);
                    } else if (p_options.constructorAction === `ignore`) {
                        pJsonValue();
                    } else {
                        result[key] = pJsonValue();
                    }
                } else {
                    result[key] = pJsonValue();
                }

                pSkipWhite();
                // @ts-expect-error next() change ch
                if (p_current_char === `}`) {
                    pNext();
                    return result;
                }
                pCurrentCharIs(`,`);
                pNext();
                pSkipWhite();
            }
        }
        return pError(`Bad object`);
    };
    const pJsonValue = (): JsonValue => {
        // Parse a JSON value. It could be an object, an array, a string, a number,
        // or boolean or null.

        pSkipWhite();
        switch (p_current_char) {
            case `{`:
                return pObject();
            case `[`:
                return pArray();
            case `"`:
                return pString();
            case `-`:
                return pNumber();
            default:
                return p_current_char >= `0` && p_current_char <= `9` ? pNumber() : pBooleanOrNull();
        }
    };

    // Return the parse function.
    return (text, reviver) => {
        // Reset state.
        p_current_char_index = -1; // next char will begin at 0
        p_current_char = ` `;
        p_text = text.toString();

        const result = pJsonValue();
        pSkipWhite();
        if (p_current_char) {
            pError(`Syntax error`);
        }

        // If there is a reviver function, we recursively walk the new structure,
        // passing each name/value pair to the reviver function for possible
        // transformation, starting with a temporary root object that holds the result
        // in an empty key. If there is not a reviver function, we simply return the
        // result.

        return typeof reviver === `function`
            ? ((function walk(object: Record<string, unknown>, key: string) {
                  const value = object[key];
                  if (isNonNullObject(value)) {
                      Object.keys(value).forEach((k) => {
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          const v = walk(value, k);
                          if (v !== undefined) {
                              value[k] = v;
                          } else {
                              delete value[k];
                          }
                      });
                  }
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                  return reviver.call(object, key, value);
              })({ "": result }, ``) as JsonValue)
            : result;
    };
};
