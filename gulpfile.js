const gulp = require('gulp');
const $ = require('gulp-load-plugins')(); // 用 $ 載入 gulp 模組
// const jade = require('gulp-jade');
// const sass = require('gulp-sass');
// const plumber = require('gulp-plumber');
// const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');
const gulpSequence = require('gulp-sequence');

const envOptions = {
  string: 'env',
  default: { env: 'develop' }
};
const option = minimist(process.argv.slice(2), envOptions);
// console.log('minimist:', minimist);
console.log(option);

// 刪除 .tmp, public 資料夾
gulp.task('clean', () => {
  return gulp.src(['./.tmp', './public'], {read: false}) 
    .pipe($.clean());
});
// 編譯 jade
gulp.task('jade', () => { // 任務名稱
  return gulp.src('./source/**/*.jade') // src: 要編譯的來源檔案資料夾
    .pipe($.plumber()) // 有錯誤發生時不會中斷任務
    .pipe($.jade({ pretty: true })) // 編譯後會排版
    .pipe(gulp.dest('./public/')) // dest: 編譯後的輸出資料夾
    .pipe(browserSync.stream()); // 重新整理網頁
});
// 編譯 sass
gulp.task('sass', () => {
  const plugins = [ // postcss 延伸套件
    autoprefixer({browsers: ['last 3 version', '> 5%', 'ie 8']}),
  ];
  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested',
      includePaths: ['./node_modules/bootstrap/scss']
    }).on('error', $.sass.logError)) // 編譯完成 CSS
    .pipe($.postcss(plugins)) // 加入前綴詞
    .pipe($.if(option.env === 'production', $.cleanCss())) // production 才會壓縮 CSS
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});
// 編譯 ES6
gulp.task('babel', () => {
  return gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init()) // 指向合併前的來源檔案
    .pipe($.babel({
        presets: ['@babel/env']
    }))
    .pipe($.concat('all.js')) // 合併所有的 .js 檔案到 all.js
    .pipe($.if(option.env === 'production', $.uglify(
      { compress: {
          drop_console: true // 移除 console.log
        }
      }))
    )
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream());
});
// 載入 bower 套件所有的 .js 檔
gulp.task('bower', () => {
  return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors'));
});
// 合併 .tmp/vendors　資料夾內 .js 檔
gulp.task('vendorJS', ['bower'], () => { // 先執行完 bower 任務後才會執行
  return gulp.src([
    './.tmp/vendors/**/*.js',
    './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
    .pipe($.concat('vendor.js')) // 合併所有 .js 檔案到 vendor.js
    .pipe($.if(option.env === 'production', $.uglify()))
    .pipe(gulp.dest('./public/js'));
});
// 網頁 server
gulp.task('browser-sync', function() {
  browserSync.init({
    server: { baseDir: "./public" },
    reloadDebounce: 2000
  });
});
// 自動執行編譯 sass
gulp.task('watch', () => {
  gulp.watch('./source/**/*.jade', ['jade']); // 當來源資料夾有變動，就會執行 sass 任務
  gulp.watch('./source/scss/**/*.scss', ['sass']);
  gulp.watch('./source/js/**/*.js', ['babel']);
});
// 發佈到 gh-pages
gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});
// release 流程, gulp build --env production
gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJS'));
// develop 流程
gulp.task('default', ['jade', 'sass', 'babel', 'vendorJS', 'browser-sync', 'watch']);