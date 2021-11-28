// eslint-disable-next-line @typescript-eslint/naming-convention
export const CONSTRUCTOR_ACTIONS = [`error`, `ignore`, `preserve`] as const;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PROTO_ACTIONS = [`error`, `ignore`, `preserve`] as const;
export type JsonBigIntOptions = {
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
     * @default 'error'
     */
    protoAction?: typeof PROTO_ACTIONS[number];
    /**
     * @default 'error'
     */
    constructorAction?: typeof CONSTRUCTOR_ACTIONS[number];
};
