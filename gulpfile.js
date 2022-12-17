// Include gulp.
const gulp     = require('gulp');
const series   = require('gulp');
const parallel = require('gulp');

// Include plugins.
const sass      = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename    = require('gulp-rename');

// read parameters
const isDebug = true;
const isProd = !isDebug;

// init
const initMsg = isDebug
    ? 'Build assets in debug-mode'
    : 'Build assets (use `--debug` for unminified version)';

console.log('\x1b[7m%s\x1b[0m', '\n---------- ' + initMsg + ' ----------');

const sourcePath = './src/scss';
const targetPath = './media/assets/css';

const compileFile = function(file, targetFilepath)
{
    console.log("Compile " + file)
    let css_file = gulp.src(sourcePath + file).pipe(sass());

    if (!isDebug)
        css_file = css_file.pipe(cleanCSS({format: {"wrapAt": 1024}}));

    const dirTarget = targetFilepath === undefined ? targetPath : targetFilepath;
    return css_file
        .pipe(rename({extname : '.css'}))
        .pipe(gulp.dest(dirTarget));

}

// 
// Task to compile sass
// 
gulp.task('compile-sass-about', () => compileFile('/modules/about.scss'));
gulp.task('compile-sass-home', () => compileFile('/modules/home.scss'));
gulp.task('compile-sass-auth', () => compileFile('/modules/auth.scss'));
gulp.task('compile-sass-cards', () => compileFile('/modules/cards.scss'));
gulp.task('compile-saas-waitingroom', () => compileFile('/modules/waitingroom.scss'));
gulp.task('compile-saas-deckselection', () => compileFile('/modules/deckselection.scss'));
gulp.task('compile-saas-navigation', () => compileFile('/modules/navigation.scss'));
gulp.task('compile-saas-tabletop', () => compileFile('/modules/tabletop.scss'));
gulp.task('compile-saas-mapview', () => compileFile('/modules/mapview.scss'));
gulp.task("compile-saas-score", () => compileFile('/modules/score.scss', "./game-client/game/score"));


const sccsModules = [
    "compile-sass-about",
    "compile-sass-cards",
    "compile-sass-home",
    "compile-sass-auth",
    "compile-saas-waitingroom",
    "compile-saas-deckselection",
    "compile-saas-navigation",
    "compile-saas-tabletop",
    "compile-saas-score",
    "compile-saas-mapview"
]

// 
// Task to watch changes
// 
gulp.task('watch-assets', () => {
    gulp.watch(sourcePath + '/**/*.scss', gulp.series(sccsModules));
    
});

// Task to build assets
gulp.task('build-assets', gulp.series(sccsModules));

// Default-Task
const vsArgs = isProd ? ['build-assets'] : ['build-assets', 'watch-assets']
gulp.task('default', gulp.series(vsArgs));