export function isObject(o: unknown): o is Record<string, unknown> & { toJSON?: () => string } {
    return typeof o === `object`;
}

export type Options = {
    /**
     * @default false
     */
    strict?: boolean | undefined;
    /**
     * @default false
     */
    storeAsString?: boolean | undefined;
    /**
     * @default false
     */
    alwaysParseAsBig?: boolean | undefined;
    /**
     * @default false
     */
    /**
     * @default 'error'
     */
    protoAction?: `error` | `ignore` | `preserve` | undefined;
    /**
     * @default 'error'
     */
    constructorAction?: `error` | `ignore` | `preserve` | undefined;
};
