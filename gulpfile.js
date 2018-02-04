var gulp = require( 'gulp' ),
    connect = require( 'gulp-connect' ),
    open = require( 'gulp-open' ),
    compass = require( 'gulp-compass' ),
    plumber = require( 'gulp-plumber' ),
    jshint = require( 'gulp-jshint' ),
    watch = require( 'gulp-watch' ),
    clean = require( 'gulp-clean' ),
    copy = require( 'gulp-copy' ),
    inline = require( 'gulp-inline' ),
    uglify = require( 'gulp-uglify' ),
    minifyCSS = require( 'gulp-clean-css' ),
    replace = require( 'gulp-replace' ),
    htmlmin = require( 'gulp-htmlmin' ),
    image = require('gulp-image'),
    zip = require( 'gulp-zip' ),
    argv = require( 'yargs' ).argv,
    jasmine = require('gulp-jasmine'), 
    notify = require('gulp-notify'),
    del = require('del'),
    os = require('os'),
    rename = require('gulp-rename'),
    args = require('yargs').argv;

var src = './src',
    dist = './dist',
    srcRichload = src + '/richLoads/rich',
    distBase = dist + '/base',
    distRichload = dist + '/rich',
    baseURL = ( argv.production === undefined ) ? src : dist,
    port = 8000 + Math.floor(Math.random() * 1000),
    uri = 'http://localhost:' + port;

var uncompressedImgs = args.fullsize ? args.fullsize.split(',') : [];
if (uncompressedImgs.length) {
    uncompressedImgs = uncompressedImgs
                        .map(function(img) { return '!' + distBase + '/' + img; })
                        .concat(uncompressedImgs.map(function(img) { return '!' + distRichload + '/' + img; }));
}

var imgCompressOptions = {
    pngquant: true,
    optipng: false,
    zopflipng: false,
    jpegRecompress: true,
    jpegoptim: false,
    mozjpeg: false,
    gifsicle: true,
    svgo: true,
    concurrent: 10
};

gulp.task( 'default', [ 'serve' ] );
gulp.task( 'serve', [ 'connect', 'open', 'watch' ] );
gulp.task( 'build', [ 'clean', 'copyBase', 'copy', 'imageCompressBase', 'imageCompressRich', 'sass', 'inlineBase', 'inline', 'replaceBase', 'replace', 'htmlminBase', 'htmlmin', 'compressBase', 'compress', 'testProd' ] );

gulp.task( 'test', function() {
    gulp.src('tests/test.js')
        .pipe(jasmine())
        .on('error', notify.onError({
            title: 'Jasmine Test Failed', 
            message: 'One or more tests failed, see cli for details.'
        }));
} );


gulp.task( 'testProd',['compressBase', 'compress'], function() {
    gulp.src('tests/test.js')
        .pipe(jasmine())
        .on('error', notify.onError({
            title: 'Jasmine Test Failed', 
            message: 'One or more tests failed, see cli for details.'
        }));
} );

gulp.task( 'connect', ['sass'], function() {
    connect.server( {
        root: baseURL,
        livereload: true,
        port: port
    } );
} );


gulp.task( 'open', ['connect'], function() {
    var options = {
        uri: uri,
        app: os.platform() === 'darwin' ? 'google chrome' : 'chrome'
    };
    gulp.src( './' )
        .pipe( open( options ) );
});

gulp.task( 'html', function () {
    gulp.src( src + '/**/*.html' )
        .pipe( connect.reload() );
});

// force compass sprite building when watching sprites folder, don't force otherwise
(function(tasks) {
    tasks.forEach(function(task) {
        gulp.task( 'sass' + task.append, function( done ) {
            gulp.src( './sass/*.scss' )
                .pipe( plumber( {
                    errorHandler: function ( error ) {
                        console.log( error.message );
                        this.emit( 'end' );
                    }
                } ) )
                .pipe( compass( {
                    css: srcRichload + '/css',
                    sass: './sass',
                    image: srcRichload + '/',
                    style: 'nested',
                    generated_images_path: srcRichload + '/img',
                    force: task.force
                } ) )
                .on( 'error', function( error ) {
                    console.log( error.message ); 
                } )
                .pipe( replace( 'sprites/', '' ) )
                .pipe( gulp.dest( srcRichload + '/css' ) )
                .pipe( connect.reload() )
                .on('end', function () { done(); });
        });

        gulp.task('moveGeneratedImages' + task.append, ['sass' + task.append], function() {
          return gulp.src(srcRichload + '/img/sprites/**/*.png')
            .pipe(gulp.dest(srcRichload + '/img'));
        });

        gulp.task('cleanSprites' + task.append, ['moveGeneratedImages' + task.append], function() {
          return del(src + '/img/sprites');
        });
    });
})([
    { append: '', force: false },
    { append: 'Force', force: true }
]);

gulp.task( 'lint', function() {
    return gulp.src( srcRichload + '/js/*.js' )
               .pipe( jshint() )
               .pipe( jshint.reporter( 'default' ) )
               .pipe( connect.reload() );
});

gulp.task( 'watch', function() {
    gulp.watch( [ src + '/**/*.html' ], [ 'html' ] );
    gulp.watch( [ './sass/*.scss' ], [ 'sass', 'moveGeneratedImages', 'cleanSprites' ] );
    gulp.watch( [ src + '/**/*.js' ], [ 'lint' ] );
    gulp.watch( [ 'src/richLoads/**/sprites/**/*'], [ 'sassForce', 'moveGeneratedImagesForce', 'cleanSpritesForce' ]);
});

gulp.task( 'clean', function () {
    return gulp.src( dist + '/**/*', { read: false } )
               .pipe( clean({ force: true }) );
});

gulp.task( 'copyBase', [ 'clean' ], function() {
    return gulp.src( [ src + '/img/**/*.{jpg,png,gif,svg}', src + '/manifest.js' ] )
               .pipe( copy( distBase, { prefix: 2 } ) );
});

gulp.task( 'copy', [ 'clean', 'cleanSprites' ], function() {
    return gulp.src([srcRichload + '/img/**/*.{jpg,png,gif,svg,json}', '!' + srcRichload + '/img/static.jpg'], { base: 'rich' } )
               .pipe( copy( distRichload, { prefix: 4 } ) );
});

gulp.task( 'imageCompressBase', [ 'copyBase' ], function (done) {
  gulp.src( [distBase + '/*.{jpg,png,svg}'].concat(uncompressedImgs) )
    .pipe( image(imgCompressOptions) )
    .pipe(gulp.dest( distBase ))
    .on('end', function() { done(); });
});

gulp.task( 'imageCompressRich', [ 'copy' ], function (done) {
  gulp.src( [distRichload + '/*.{jpg,png,svg}'].concat(uncompressedImgs) )
    .pipe( image(imgCompressOptions) )
    .pipe(gulp.dest( distRichload ))
    .on('end', function() { done(); });
});

gulp.task( 'inlineBase', [ 'copy' ], function( done ) {
    gulp.src( src + '/index.html' )
        .pipe( inline( {
            base: src,
            js: uglify,
            css: minifyCSS,
            disabledTypes: [ 'img' ]
    } ) )
    .pipe( gulp.dest( distBase ) )
    .on('end', function () { done(); });
});

gulp.task( 'inline', [ 'sass' ], function( done ) {
    gulp.src( srcRichload + '/index.html' )
        .pipe( inline( {
            base: srcRichload,
            js: uglify,
            css: minifyCSS,
            disabledTypes: [ 'img' ]
    } ) )
    .pipe( gulp.dest( distRichload ) )
    .on('end', function () { done(); });
});

gulp.task( 'replaceBase', [ 'inlineBase' ], function( done ) {
 gulp.src( [ distBase + '/index.html' ] )
     .pipe( replace( 'img/', './') )
     .pipe( gulp.dest( distBase ) )
     .on('end', function () { done(); });
});

gulp.task( 'replaceSrc', [ 'copyBase' ], function(done) {
    gulp.src( [src + '/manifest.js'] )
        .pipe( replace( '"src": "rich"', '"src": "O365_DWCInteractiveDT_USA_970x250_RMB_O365_All_NA_Standard_HIS_LM_NA_1_richload"'))
        .pipe( gulp.dest( distBase ))
        .on('end', function() { done(); });
});

gulp.task( 'replace', [ 'inline' ], function( done ) {
    gulp.src( [ distRichload + '/index.html' ] )
        .pipe( replace( '../img/', 'img/') )
        .pipe( replace( 'img/', './') )
        .pipe( gulp.dest( distRichload ) )
        .on('end', function () { done(); });
});

gulp.task('htmlminBase', [ 'replaceBase' ], function() {
  return gulp.src( distBase + '/index.html' )
          .pipe( htmlmin( { collapseWhitespace: true, removeComments: true } ) )
          .pipe( gulp.dest( distBase ) );
});

gulp.task('htmlmin', [ 'replace' ], function() {
  return gulp.src( distRichload + '/index.html' )
             .pipe( htmlmin( { collapseWhitespace: true, removeComments: true } ) )
             .pipe( gulp.dest( distRichload ) );
});

gulp.task( 'compressBase', [ 'clean', 'copyBase', 'inlineBase', 'replaceBase', 'replaceSrc', 'htmlminBase', 'imageCompressBase' ], function() {
 return gulp.src(  distBase + '/*' )
            .pipe( zip( 'O365_DWCInteractiveDT_USA_970x250_RMB_O365_All_NA_Standard_HIS_LM_NA_1_base.zip' ) )
            .pipe( gulp.dest( './' ) );
});

gulp.task( 'compress', [ 'clean', 'copy', 'sass', 'inline', 'replace', 'htmlmin', 'imageCompressRich' ], function() {
    return gulp.src(  distRichload + '/**/*' )
               .pipe( zip( 'O365_DWCInteractiveDT_USA_970x250_RMB_O365_All_NA_Standard_HIS_LM_NA_1_richload.zip' ) )
               .pipe( gulp.dest( './' ) );
});