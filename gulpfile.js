//-- gulp service variales
const gulp = require('gulp');
const clean = require('gulp-clean');
const sass = require('gulp-sass');
const nunjucksRender = require("gulp-nunjucks-render");
const copy = require('gulp-copy');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const prettier = require('gulp-prettier');
const cached= require('gulp-cached');
const dependents = require('gulp-dependents');
const print = require('gulp-print').default;
const uglify = require('gulp-uglify');
const data = require('gulp-data');
const rename = require('gulp-rename');
const ignore = require('gulp-ignore');

//-- other service variables
const del = require('del');
const path = require('path');
const browserSync = require('browser-sync').create();
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const glob = require('glob');
const es = require('event-stream');

//-- contruct folders

const APP_SRC_PATH = "./src/";
const APP_TMP_PATH = "./tmp/";
const APP_DIST_PATH = "./dist/";

const APP = {
  src: {
    path : APP_SRC_PATH,
    scss : APP_SRC_PATH + 'scss/',
    js : APP_SRC_PATH + 'js/',
    images : APP_SRC_PATH + 'images/',
    njk : APP_SRC_PATH + 'njk/',
    data : APP_SRC_PATH + 'data/',
    urlConfig : APP_SRC_PATH + 'urlConfig/',
  },

  tmp: {
    path : APP_TMP_PATH,
    css : APP_TMP_PATH + 'css/',
    js : APP_TMP_PATH + 'js/',
    images : APP_TMP_PATH + 'images/',
  },

  dist: {
    path : APP_DIST_PATH,
    css : APP_DIST_PATH + 'css/',
    js : APP_DIST_PATH + 'js/',
    images : APP_DIST_PATH + 'images/',
  }
};

/*======================================
  js compile functions
========================================*/

const compileJsDist = function(filesbox,done) {
  glob(filesbox, function (err, files) {
    if(err) done(err);
    var filename,foldername;

    var tasks = files.map(function(entry) {
      filename = entry.split('/')[entry.split('/').length - 1];
      foldername = entry.split('/')[entry.split('/').length - 2];

      return browserify({entries: [entry]})
      .transform("babelify",{presets: ['@babel/env']})
      .bundle()
      .pipe(source(filename))
      .pipe(rename(
        foldername!='js' ? foldername + '.js' : filename.replace('.js','') + '.js'
      ))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest(APP.dist.js));
    });

    es.merge(tasks).on('end', done);
  });
}

const compileJsTmp = function(filesbox,done) {
  glob(filesbox, function (err, files) {
    if(err) done(err);
    var filename,foldername;

    var tasks = files.map(function(entry) {
      filename = entry.split('/')[entry.split('/').length - 1];
      foldername = entry.split('/')[entry.split('/').length - 2];

      return browserify({entries: [entry]})
      .transform("babelify",{presets: ['@babel/env']})
      .bundle()
      .pipe(source(filename))
      .pipe(rename(
        foldername!='js' ? foldername + '.js' : filename.replace('.js','') + '.js'
      ))
      .pipe(cached('js'))
      .pipe(dependents())
      .pipe(print(
        filepath => `built: ${filepath}`
      ))
      .pipe(gulp.dest(APP.tmp.js))
      .pipe(browserSync.reload({ stream: true }));
    });

    es.merge(tasks).on('end', done);
  });
}

/*======================================
  js move functions
========================================*/

const jsLibs = function(target) {
  return gulp.src(APP.src.js + 'libs/*.js')
    .pipe(plumber())
    .pipe(cached('js'))
    .pipe(dependents())
    .pipe(print(
      filepath => `built: ${filepath}`
    ))
    .pipe(gulp.dest(target + 'libs/'));
}

/*======================================
  clean task
========================================*/

//-- clean dist folder
gulp.task('cleanDist', function() {
  return gulp.src(APP.dist.path, {read: false, allowEmpty: true})
  .pipe(clean({ force: true }));
});

//-- clean tmp folder
gulp.task('cleanTmp', function() {
  return gulp.src(APP.tmp.path, {read: true, allowEmpty: true})
  .pipe(clean({ force: true }));
});

/*======================================
  convert sass to css
========================================*/

//-- convert sass to css for dist
gulp.task('sassDist', function(done) {
  glob(APP.src.scss + '**/*.scss', function(err,files) {
    if(err) done(err);
    var filename, foldername;
    const tasks = files.map(function(entry) {
      filename = entry.split('/')[entry.split('/').length - 1];
      foldername = entry.split('/')[entry.split('/').length - 2];

      return gulp.src(entry)
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
      .pipe(rename(
        {
          'dirname' : '',
          'basename' : foldername!='scss' ? foldername : filename.replace('.scss','')
        }
      ))
      .pipe(gulp.dest(APP.dist.css))
    });

    es.merge(tasks).on('end',done);
  });
});

//-- convert sass to css for tmp
gulp.task('sassTmp', function(done) {
  glob(APP.src.scss + '**/*.scss', function(err,files) {
    if(err) done(err);
    var filename, foldername;
    const tasks = files.map(function(entry) {
      filename = entry.split('/')[entry.split('/').length - 1];
      foldername = entry.split('/')[entry.split('/').length - 2];

      return gulp.src(entry)
      .pipe(cached('scss'))
      .pipe(dependents())
      .pipe(sass().on('error', sass.logError))
      .pipe(rename(
        {
          'dirname' : '',
          'basename' : foldername!='scss' ? foldername : filename.replace('.scss','')
        }
      ))
      .pipe(print(
        filepath => `built: ${filepath}`
      ))
      .pipe(gulp.dest(APP.tmp.css))
      .pipe(browserSync.reload({ stream: true }));
    });

    es.merge(tasks).on('end',done);
  });
});

/*======================================
  prettier css
========================================*/

//-- prettier css for tmp
gulp.task('prettierCssTmp', function() {
  return gulp.src(APP.tmp.css + '*.css')
  .pipe(cached('scss'))
  .pipe(dependents())
  .pipe(prettier({
    singleQuote: true
  }))
  .pipe(print(
    filepath => `prettier css: ${filepath}`
  ))
  .pipe(gulp.dest(APP.tmp.css))
});

/*======================================
  compile js files
========================================*/

//-- compile js file for dist folder
gulp.task('jsDist', function(done) {
  compileJsDist(APP.src.js + '**/index.js', done);
});

gulp.task('jsCommonDist', function(done) {
  compileJsDist(APP.src.js + 'common.js', done);
});

gulp.task('jsLibDist', function() {
  return jsLibs(APP.dist.js)
});

//-- compile js file for tmp folder
gulp.task('jsTmp', function(done) {
  compileJsTmp(APP.src.js + '**/index.js', done);
});

gulp.task('jsCommonTmp', function(done) {
  compileJsTmp(APP.src.js + 'common.js', done);
});

gulp.task('jsLibTmp', function() {
  return jsLibs(APP.tmp.js).pipe(browserSync.reload({ stream: true }));
});

/*======================================
  prettier js
========================================*/

//-- prettier css for tmp
gulp.task('prettierJsTmp', function() {
  return gulp.src(APP.tmp.js + '*.js')
  .pipe(cached('js'))
  .pipe(dependents())
  .pipe(prettier())
  .pipe(print(
    filepath => `prettier js: ${filepath}`
  ))
  .pipe(gulp.dest(APP.tmp.js))
});

/*======================================
  convert njk to html
========================================*/

//-- convert njk to html for dist
gulp.task('njkDist', function() {
  return gulp.src(APP.src.njk + '*.njk')
  .pipe(nunjucksRender({
    path: [APP.src.njk],
    ext: '.html',
    data : {
      objGlobal: require(APP.src.data + "global.json"),
      intRandomNumber : Math.random() * 10
    }
  }))
  .pipe(gulp.dest(APP.dist.path));
});

//-- convert njk to html for tmp
gulp.task('njkTmp', function() {
  delete require.cache[require.resolve(APP.src.data + "global.json")];
  const templateData = require(APP.src.data + "global.json")

  return gulp.src(APP.src.njk + '*.njk')
  .pipe(data((file) => ({namepage: file.path.split('\\')[file.path.split('\\').length - 1].replace('.njk','')})))
  .pipe(nunjucksRender({
    path: [APP.src.njk],
    ext: '.html',
    data: {
      objGlobal: templateData,
      intRandomNumber : Math.random() * 10
    }
  }))
  .pipe(cached('html'))
  .pipe(dependents())
  .pipe(print(
    filepath => `built: ${filepath}`
  ))
  .pipe(gulp.dest(APP.tmp.path))
  .pipe(browserSync.reload({ stream: true }));
});

/*======================================
  prettier html
========================================*/

//-- prettier html for dist
gulp.task('prettierHtmlDist', function() {
  return gulp.src(APP.dist.path + '*.html')
  .pipe(prettier({
    singleQuote: true
  }))
  .pipe(gulp.dest(APP.dist.path))
});

//-- prettier html for tmp
gulp.task('prettierHtmlTmp', function() {
  return gulp.src(APP.tmp.path + '*.html')
  .pipe(prettier({
    singleQuote: true
  }))
  .pipe(gulp.dest(APP.tmp.path))
});

/*======================================
  copy images
========================================*/

//-- copy imagemin images to dist
gulp.task('imagemin', function() {
  return gulp.src(APP.src.images + '**/*.{jpg,png,gif,svg,ico}')
  .pipe(plumber())
  .pipe(imagemin(
    {
      interlaced: true,
      progressive: true,
      optimizationLevel: 5,
      svgoPlugins: [
        {
          removeViewBox: true
        }
      ]
    }
  ))
  .pipe(gulp.dest(APP.dist.images));
});

//-- copy images to tmp
gulp.task('copyImages', function() {
  return gulp.src(APP.src.images + '**/*.{jpg,png,gif,svg,ico}')
  .pipe(plumber())
  .pipe(cached('jpg,png,gif,svg,ico'))
  .pipe(dependents())
  .pipe(copy(
    APP.tmp.images,
    {
      prefix: 2
      /*chúng ta có thể sử dụng gulp.dest để dẫn đến thư mục cần thiết, nếu chưa có thì auto tạo. Mục đích duy nhất để ta sử dụng prefix là để chúng ta xác định số cấp thư mục vào đến thư mục mà ta cần. Bắt đầu tính từ thư mục gốc
        vd: từ FADO_EMAIL-V2 vào dist/images thì phải qua 2 cấp thư mục dist/images
      */
    }
  ))
  .pipe(print(
    filepath => `built: ${filepath}`
  ))
  .pipe(browserSync.reload({ stream: true }));
});

/*==================================
 * watch Task
====================================*/

gulp.task('watch', function() {

  //-- watch scss files changes
  gulp.watch(APP.src.scss + '**/*.scss', gulp.series(
    'sassTmp',
    'prettierCssTmp',
    'njkTmp',
    'prettierHtmlTmp',
  ));

  //-- watch js files changes
  gulp.watch(APP.src.js + '**/*.js', gulp.series(
    'jsTmp',
    'prettierJsTmp',
    'njkTmp',
    'prettierHtmlTmp',
  ))

  //-- watch njk files changes
  gulp.watch(APP.src.njk + '**/*.njk', gulp.series(
    'njkTmp',
    'prettierHtmlTmp',
  ));

  //-- watch json data files changes
  gulp.watch(APP.src.data, gulp.series(
    'njkTmp',
    'prettierHtmlTmp'
  ));

  /*==================================
  * watch images change task
  ====================================*/

  //-- watch images chages
  gulp.watch(APP.src.images + '**/*.{jpg,png,gif,svg,ico}', gulp.series(
    'njkTmp',
    'prettierHtmlTmp',
  ));

  //-- watch images add, chages event
  gulp.watch(APP.src.images + '**/*.{jpg,png,gif,svg,ico}',
  {events : ['add','change']},
  gulp.series(
    'copyImages'
  ));

  //-- watch images del
  const watchDelImages = gulp.watch(APP.src.images + '**/*.{jpg,png,gif,svg,ico}');

  watchDelImages.on('unlink', function(filepath) {
    const filePathFromSrc = path.relative(path.resolve('src'),filepath);
    const destFilePath = path.resolve(APP.tmp.path, filePathFromSrc);

    del.sync(destFilePath);
  });
});

/*==================================
 * browserSync Task
====================================*/

gulp.task("browser-sync", function() {
  return browserSync.init({
    reloadDelay: 300, // Fix htmlprocess watch not change
    open: false, // Stop auto open browser
    cors: false,
    notify: {
      styles: [
        "display: none; ",
        "padding: 5px 5px;",
        "position: fixed;",
        "font-size: 13px;",
        "line-height: 18px;",
        "z-index: 999999;",
        "left: 0;",
        "top: 0;",
        "width: auto;",
        "max-width: 100%",
        "color: #fff;",
        "background-color: rgba(0,0,0,0.5);",
        "box-shadow: 0 0 5px rgba(0,0,0,0.3);"
      ]
    },
    server: {
      baseDir: APP.tmp.path,
      index: "index.html"
    }
  });
});

/*==================================
 * setup gulp task runner
====================================*/

//-- dev script
gulp.task('dev', gulp.series(
  'cleanTmp',
  gulp.parallel(
    'sassTmp',
    'jsTmp',
    'jsLibTmp',
    'copyImages',
    'njkTmp'
  ),
  'jsCommonTmp',
  gulp.parallel(
    'prettierCssTmp',
    'prettierJsTmp',
    'prettierHtmlTmp',
  ),
  gulp.parallel('browser-sync','watch')
));

//-- build script
gulp.task('build', gulp.series(
  gulp.parallel(
    'cleanTmp',
    'cleanDist'
  ),
  gulp.parallel(
    'sassDist',
    'jsDist',
    'jsLibDist',
    'imagemin',
    'njkDist'
  ),
  'jsCommonDist',
  'prettierHtmlDist'
));
