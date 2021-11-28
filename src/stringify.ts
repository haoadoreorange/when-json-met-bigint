const toJSONisImplemented = <T>(o: T): o is T & { toJSON: (key?: string) => unknown } => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return typeof o === `object` && o !== null && typeof (o as any).toJSON === `function`;
};

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

const quote = (s: string) => {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    ESCAPABLE.lastIndex = 0;
    return ESCAPABLE.test(s)
        ? `"` +
              s.replace(ESCAPABLE, function (a) {
                  const c = META[a as keyof typeof META];
                  return typeof c === `string`
                      ? c
                      : `\\u` + (`0000` + a.charCodeAt(0).toString(16)).slice(-4);
              }) +
              `"`
        : `"` + s + `"`;
};

// Closure for internal state variables.
// Serializer's internal state variables are prefixed with s_, methods are prefixed with s.
export const stringify = ((): typeof JSON.stringify => {
    // This immediately invoked function returns a function that stringify JS
    // data structure.

    let s_indent: string, // JSON string indentation
        s_replacer: ((this: any, key: string, value: any) => any) | (string | number)[] | null | undefined;

    const sStringify = (
        key_or_index: string | number,
        object_or_array: Record<string | number, unknown>,
    ): string | undefined => {
        // Produce a string from object_or_array[key_or_index].

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let value = object_or_array[key_or_index];

        // If the value has toJSON method, call it.
        if (toJSONisImplemented(value)) {
            value = value.toJSON();
        }

        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.
        if (typeof s_replacer === `function`) {
            value = s_replacer.call(object_or_array, key_or_index.toString(), value);
        }

        // What happens next depends on the value's type.
        switch (typeof value) {
            case `string`:
                return quote(value);
            case `number`:
                // JSON numbers must be finite. Encode non-finite numbers as null.
                return isFinite(value) ? value.toString() : `null`;
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

                if (Array.isArray(value)) {
                    // Make an array to hold the partial results of stringifying this object value.
                    // The value is an array. Stringify every element. Use null as a placeholder
                    // for non-JSON values.
                    const partial = value.map(
                        (v, i) => sStringify(i, v as Record<number, unknown>) || `null`,
                    );

                    // Join all of the elements together, separated with commas, and wrap them in
                    // brackets.
                    return partial.length === 0
                        ? `[]`
                        : s_indent
                        ? `[\n` + s_indent + partial.join(`,\n` + s_indent) + `\n` + `]`
                        : `[` + partial.join(`,`) + `]`;
                }

                const partial: string[] = [];
                if (Array.isArray(s_replacer)) {
                    // If the replacer is an array, use it to select the members to be stringified.
                    s_replacer.forEach((k) => {
                        if (typeof k === `string` || typeof k === `number`) {
                            const v = sStringify(k, value as Record<string, unknown>);
                            if (v) {
                                partial.push(quote(k.toString()) + (s_indent ? `: ` : `:`) + v);
                            }
                        }
                    });
                } else {
                    // Otherwise, iterate through all of the keys in the object.
                    Object.keys(value).forEach((k) => {
                        const v = sStringify(k, value as Record<string, unknown>);
                        if (v) {
                            partial.push(quote(k) + (s_indent ? `: ` : `:`) + v);
                        }
                    });
                }

                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.
                return partial.length === 0
                    ? `{}`
                    : s_indent
                    ? `{\n` + s_indent + partial.join(`,\n` + s_indent) + `\n` + `}`
                    : `{` + partial.join(`,`) + `}`;
            }
        }
    };

    // Return the stringify function.
    return (value: unknown, replacer, space) => {
        // Reset state.
        // If the space parameter is a number, make an indent string containing that
        // many spaces.
        // If the space parameter is a string, it will be used as the indent string.
        s_indent =
            typeof space === `number` && space >= 0
                ? new Array(space + 1).join(` `)
                : typeof space === `string`
                ? space
                : ``;

        // If there is a replacer, it must be a function or an array.
        // Otherwise, throw an error.
        if (replacer && typeof replacer !== `function` && !Array.isArray(replacer))
            throw new Error(`JSON.stringify`);
        s_replacer = replacer;

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        // Cheating here, JSON.stringify can return undefined but overloaded types
        // are not seen here so we cast to string to satisfy tsc
        return sStringify(``, { "": value }) as string;
    };
})();
