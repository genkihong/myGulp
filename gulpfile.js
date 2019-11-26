const { src, dest, series, parallel } = require('gulp');
const gulpif = require('gulp-if');
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const terser = require('gulp-terser');


function generateCombinedFiles() {
    return src('src/index.html')
        .pipe(useref())
        // .pipe(
        //     gulpif('*/**/*.js', terser())
        // )
        .pipe(
            gulpif('*.js', uglify())
        )
        .pipe(dest('public2'));
}

exports.default = series(
    generateCombinedFiles
)