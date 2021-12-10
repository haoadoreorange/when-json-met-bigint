// eslint-disable-next-line no-undef
module.exports = {
    trailingComma: `all`,
    tabWidth: 4,
    printWidth: 100,
    proseWrap: `always`,
    overrides: [
        {
            files: `*.md`,
            options: {
                printWidth: 80,
            },
        },
    ],
};
