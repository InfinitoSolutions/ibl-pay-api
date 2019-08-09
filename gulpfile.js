'use strict';

const gulp = require('gulp');
const shell = require('gulp-shell');
const rimraf = require('gulp-rimraf');
const tslint = require('gulp-tslint');
const sequence = require('gulp-sequence')
const outDir = 'dist';

/**
 * Clean
 */
gulp.task('clean', function () {
    return gulp.src(outDir, { read: false })
        .pipe(rimraf());
});

/**
 * Watch for changes in TypeScript
 */
gulp.task('watch', shell.task([
    'npm run tsc-watch',
]));

/**
 * Compile typescript
 */
gulp.task('compile', shell.task([
    'npm run tsc',
]));

/**
 * Lint all custom TypeScript files.
 */
gulp.task('tslint', () => {
    return gulp.src('./src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

/**
 * Copy view files
 */
gulp.task('views', (cb) => {
    return gulp.src("./src/views/**/*.html")
        .pipe(gulp.dest('./dist/views'));
});

/**
 * Build the project.
 */
gulp.task('build', (cb) => {
    console.log('Building the project ...');
    sequence('clean', ['compile', 'views'])(cb);
});

/**
 * Run tests.
 */
gulp.task('test', ['dist'], (cb) => {
    const envs = env.set({
        NODE_ENV: 'test'
    });

    gulp.src(['dist/test/**/*.js'])
        .pipe(envs)
        .pipe(mocha({ exit: true }))
        .once('error', (error) => {
            console.log(error);
            process.exit(1);
        });
});

gulp.task('default', ['watch']);
