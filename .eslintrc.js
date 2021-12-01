const CLASS_PROPERTY = `classProperty`;
const PARAMETER = `parameter`;
const VARIABLE = `variable`;
const METHOD = `method`;
const PROPERTY = `property`;

const string_and_number = [`string`, `number`];
const func = [`function`];
const boolean = [`boolean`];

const private = [`private`];

const snake_case = [`snake_case`];
const snake_and_UPPER = [`UPPER_CASE`, ...snake_case];
const camelCase = [`camelCase`];
const PascalCase = [`PascalCase`];
const prefix = [`is_`, `should_`, `has_`, `can_`, `did_`, `will_`];

// eslint-disable-next-line no-undef
module.exports = {
    root: true, // By default ESLint keep looking for eslintrc up to root on filesystem, this is to stop it here
    parser: `@typescript-eslint/parser`, // Specifies the ESLint parser
    parserOptions: {
        // This setting is required if you want to use rules which require type information.
        // Relative paths are interpreted relative to the current working directory if tsconfigRootDir is not set.
        // If you intend on running ESLint from directories other than the project root, you should consider using tsconfigRootDir
        project: [`tsconfig.json`, `.eslint.tsconfig.json`],
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: `module`, // Allows for the use of imports
    },
    extends: [
        `eslint:recommended`,
        // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        `plugin:@typescript-eslint/recommended`,
        // For larger codebases you may want to consider splitting our linting into two separate stages:
        // 1. fast feedback rules which operate purely based on syntax (no type-checking),
        // 2. rules which are based on semantics (type-checking).
        // See https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/TYPED_LINTING.md
        `plugin:@typescript-eslint/recommended-requiring-type-checking`,
        // Enables eslint-plugin-prettier and eslint-config-prettier in one go.
        // Make sure this is always the last configuration in the extends array.
        // See https://github.com/prettier/eslint-config-prettier/blob/main/CHANGELOG.md#version-800-2021-02-21
        `plugin:prettier/recommended`,
    ],
    ignorePatterns: [`!.prettierrc.js`],
    rules: {
        quotes: [`error`, `backtick`],
        "prefer-const": [`error`],
        "@typescript-eslint/restrict-template-expressions": [
            `error`,
            {
                allowBoolean: true,
                allowNullish: true,
            },
        ],
        // See https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
        "@typescript-eslint/naming-convention": [
            `error`,
            {
                selector: `default`,
                filter: {
                    regex: `^(${[`snake_and_UPPER`, ...camelCase, ...PascalCase].reduce(
                        (s, v, i, array) => `${s}${v}${i < array.length - 1 ? `|` : ``}`,
                        ``,
                    )})$`,
                    match: false,
                },
                format: snake_case,
            },
            {
                selector: CLASS_PROPERTY,
                types: string_and_number,
                modifiers: [`private`, `readonly`],
                format: snake_and_UPPER,
                leadingUnderscore: `require`,
            },
            {
                selector: CLASS_PROPERTY,
                types: string_and_number,
                modifiers: [`readonly`],
                format: snake_and_UPPER,
            },
            {
                selector: CLASS_PROPERTY,
                types: boolean,
                modifiers: [`private`],
                format: snake_case,
                prefix,
                leadingUnderscore: `require`,
            },
            {
                selector: CLASS_PROPERTY,
                types: boolean,
                format: snake_case,
                prefix,
            },
            {
                selector: CLASS_PROPERTY,
                modifiers: private,
                format: snake_case,
                leadingUnderscore: `require`,
            },
            {
                selector: `function`,
                format: camelCase,
            },
            {
                selector: PARAMETER,
                types: func,
                format: camelCase,
            },
            {
                selector: PARAMETER,
                modifiers: [`unused`],
                format: null,
                leadingUnderscore: `require`,
                trailingUnderscore: `require`,
            },
            {
                selector: VARIABLE,
                types: string_and_number,
                modifiers: [`const`, `global`],
                format: snake_and_UPPER,
            },
            {
                selector: VARIABLE,
                types: boolean,
                format: snake_case,
                prefix,
            },
            {
                selector: VARIABLE,
                types: func,
                format: camelCase,
            },
            {
                selector: VARIABLE,
                types: func,
                modifiers: [`destructured`],
                format: [...camelCase, ...PascalCase],
            },
            {
                selector: METHOD,
                modifiers: private,
                format: camelCase,
                leadingUnderscore: `require`,
            },
            {
                selector: METHOD,
                format: camelCase,
            },
            {
                selector: PROPERTY,
                types: func,
                format: camelCase,
            },
            {
                selector: PROPERTY,
                types: string_and_number,
                format: [...snake_and_UPPER, ...camelCase, ...PascalCase],
            },
            {
                selector: PROPERTY,
                format: [...snake_case, ...camelCase, ...PascalCase],
            },
            {
                selector: `typeLike`,
                format: PascalCase,
            },
        ],
    },
};
