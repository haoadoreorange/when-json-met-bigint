export const error = `error`;
export const ignore = `ignore`;
export const preserve = `preserve`;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CONSTRUCTOR_ACTIONS = [error, ignore, preserve] as const;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PROTO_ACTIONS = CONSTRUCTOR_ACTIONS;
export type JsonBigIntOptions = {
    /**
     * @default false
     */
    errorOnBigIntDecimalOrScientific?: boolean;
    /**
     * @default false
     */
    errorOnDuplicatedKeys?: boolean;
    /**
     * @default false
     */
    strict?: boolean;
    /**
     * @default false
     */
    parseBigIntAsString?: boolean;
    /**
     * @default false
     */
    alwaysParseAsBigInt?: boolean;
    /**
     * @default 'preserve'
     */
    protoAction?: typeof PROTO_ACTIONS[number];
    /**
     * @default 'preserve'
     */
    constructorAction?: typeof CONSTRUCTOR_ACTIONS[number];
};

export const isNonNullObject = (o: unknown): o is Record<string, unknown> | unknown[] => {
    return o !== null && typeof o === `object`;
};
