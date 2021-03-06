import { Cache, isNonNullObject } from "lib";

const isNonNullObjectWithToJSOnImplemented = <T>(
    o: T,
): o is T & { toJSON: (key?: string) => unknown } =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    isNonNullObject(o) && typeof (o as any).toJSON === `function`;

// Number -> number & String -> string
// eslint-disable-next-line @typescript-eslint/ban-types
const toPrimitive = <T>(o: Number | String | T) =>
    o instanceof Number ? Number(o) : o instanceof String ? String(o) : o;

const quote = (() => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ESCAPABLE =
        // eslint-disable-next-line no-control-regex, no-misleading-character-class
        /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const META = {
        // Table of character substitutions.
        "\b": `\\b`,
        "\t": `\\t`,
        "\n": `\\n`,
        "\f": `\\f`,
        "\r": `\\r`,
        '"': `\\"`,
        "\\": `\\\\`,
    } as const;

    const cache = new Cache<string, string>();
    return (s: string) => {
        if (!cache.has(s)) {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.
            ESCAPABLE.lastIndex = 0;
            cache.set(
                s,
                ESCAPABLE.test(s)
                    ? `"` +
                          s.replace(ESCAPABLE, function (a) {
                              const c = META[a as keyof typeof META];
                              return typeof c === `string`
                                  ? c
                                  : `\\u` + (`0000` + a.charCodeAt(0).toString(16)).slice(-4);
                          }) +
                          `"`
                    : `"` + s + `"`,
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return cache.get(s)!; // Cannot be undefined
    };
})();

type ReplacerFn = (this: any, key: string, value: any) => any;
// eslint-disable-next-line @typescript-eslint/ban-types
type Stringified<V> = V extends symbol | Function ? undefined : ReturnType<typeof JSON.stringify>;
type Stringify = <V>(
    value: V,
    // eslint-disable-next-line @typescript-eslint/ban-types
    replacer?: (number | Number | string | String)[] | ReplacerFn | null,
    // eslint-disable-next-line @typescript-eslint/ban-types
    space?: Parameters<typeof JSON.stringify>[2] | Number | String,
) => Stringified<V>;
// Closure for internal state variables.
// Serializer's internal state variables are prefixed with s_, methods are prefixed with s.
export const stringify = ((): Stringify => {
    // This immediately invoked function returns a function that stringify JS
    // data structure.

    // Original spec use stack, but stack is slow and not necessary in this case
    // use Set instead
    const s_stack = new Set();
    let s_indent: string, // current indentation
        s_gap: string, // JSON indentation string
        sReplacer: ReplacerFn | null | undefined;
    const s_replacer = new Set<string>();

    const sStringify = <T extends Record<string, unknown> | unknown[]>(
        object_or_array: T,
        key_or_index: T extends Record<string, unknown> ? keyof T : number,
    ): string | undefined => {
        // Produce a string from object_or_array[key_or_index].

        // @ts-expect-error index array with string
        let value = object_or_array[key_or_index] as unknown;

        // If the value has toJSON method, call it.
        if (isNonNullObjectWithToJSOnImplemented(value)) {
            value = value.toJSON();
        }

        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.
        if (typeof sReplacer === `function`) {
            value = sReplacer.call(object_or_array, key_or_index.toString(), value);
        }

        // What happens next depends on the value's type.
        switch (typeof value) {
            case `string`:
                return quote(value);
            case `number`:
                // JSON numbers must be finite. Encode non-finite numbers as null.
                return Number.isFinite(value) ? value.toString() : `null`;
            case `boolean`:
            case `bigint`:
                return value.toString();
            case `object`: {
                // If the type is 'object', we might be dealing with an object
                // or an array or null.
                // Due to a specification blunder in ECMAScript, typeof null is 'object',
                // so watch out for that case.

                if (!value) {
                    return `null`;
                }

                if (s_stack.has(value)) throw new TypeError(`cyclic object value`);
                s_stack.add(value);
                const last_gap = s_indent; // stepback
                s_indent += s_gap;

                if (Array.isArray(value)) {
                    // Make an array to hold the partial results of stringifying this object value.
                    // The value is an array. Stringify every element. Use null as a placeholder
                    // for non-JSON values.
                    const partial = value.map(
                        (_v_, i) => sStringify(value as unknown[], i) || `null`,
                    );

                    // Join all of the elements together, separated with commas, and wrap them in
                    // brackets.
                    const result =
                        partial.length === 0
                            ? `[]`
                            : s_indent
                            ? `[\n` +
                              s_indent +
                              partial.join(`,\n` + s_indent) +
                              `\n` +
                              last_gap +
                              `]`
                            : `[` + partial.join(`,`) + `]`;
                    s_stack.delete(value);
                    s_indent = last_gap;
                    return result;
                }

                const partial: string[] = [];
                (s_replacer.size > 0 ? s_replacer : Object.keys(value)).forEach((key) => {
                    const v = sStringify(value as Record<string, unknown>, key);
                    if (v) {
                        partial.push(quote(key) + (s_gap ? `: ` : `:`) + v);
                    }
                });

                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.
                const result =
                    partial.length === 0
                        ? `{}`
                        : s_indent
                        ? `{\n` + s_indent + partial.join(`,\n` + s_indent) + `\n` + last_gap + `}`
                        : `{` + partial.join(`,`) + `}`;
                s_stack.delete(value);
                s_indent = last_gap;
                return result;
            }
        }
    };

    // Return the stringify function.
    return (value, replacer, space) => {
        value = toPrimitive(value) as typeof value;
        // Reset state.
        s_stack.clear();

        s_indent = ``;
        // If the space parameter is a number, make an indent string containing that
        // many spaces.
        // If the space parameter is a string, it will be used as the indent string.
        const primitive_space = toPrimitive(space);
        s_gap =
            typeof primitive_space === `number` && primitive_space > 0
                ? new Array(primitive_space + 1).join(` `)
                : typeof primitive_space !== `string`
                ? ``
                : primitive_space.length > 10
                ? primitive_space.slice(0, 10)
                : primitive_space;

        s_replacer.clear();
        if (Array.isArray(replacer)) {
            sReplacer = null;
            if (isNonNullObject(value))
                replacer.forEach((e) => {
                    const key = toPrimitive(e);
                    if (typeof key === `string` || typeof key === `number`) {
                        const key_string = key.toString();
                        if (!s_replacer.has(key_string)) s_replacer.add(key_string);
                    }
                });
        } else sReplacer = replacer;

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        // Cheating here, JSON.stringify can return undefined but overloaded types
        // are not seen here so we cast to string to satisfy tsc
        return sStringify({ "": value }, ``) as Stringified<typeof value>;
    };
})();
