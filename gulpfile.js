/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const sourcemaps = require(`gulp-sourcemaps`);
const tsProject = require(`gulp-typescript`).createProject(`tsconfig.build.json`, {
    typescript: require(`ttypescript`),
});
const gulp = require(`gulp`);
exports.default = () => {
    const compiled_src = tsProject
        .src()
        .pipe(sourcemaps.init())
        .pipe(
            require(`gulp-strip-code`)({
                start_comment: `<DEV-ONLY>`,
                end_comment: `</DEV-ONLY>`,
            }),
        )
        .pipe(tsProject());
    return compiled_src.pipe(sourcemaps.write(`.`, { includeContent: false })).pipe(gulp.dest(`dist`));
};
