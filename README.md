# vinyl-ftp

Blazing fast vinyl adapter for FTP.
Supports parallel transfers, conditional transfers, buffered or streamed files, and more.
Often performs better than your favorite desktop FTP client.

## Usage

Nice and gulpy deployment task:

```javascript
var gutil = require( 'gulp-util' );
var ftp = require( 'vinyl-ftp' );

gulp.task( 'deploy', function() {

	var conn = ftp.create( {
		host:     'mywebsite.tld',
		user:     'me',
		password: 'mypass',
		parallel: 10
	} );

	var globs = [
		'src/**',
		'css/**',
		'js/**',
		'fonts/**',
		'index.html'
	];

	// using base = '.' will transfer everything to /public_html correctly
	// turn off buffering in gulp.src for best performance

	return gulp.src( globs, { base: '.', buffer: false } )
		.pipe( conn.newer( '/public_html' ) ) // only upload newer files
		.pipe( conn.dest( '/public_html' ) );

} );
```

Without Gulp:

```javascript
var fs = require( 'vinyl-fs' );
var ftp = require( 'vinyl-ftp' );

var conn = new ftp( /* ... */ );

fs.src( [ './src/**' ], { buffer: false } )
	.pipe( conn.dest( '/dst' ) );
```

## API

`var ftp = require( 'vinyl-ftp' )`

### ftp.create( config )

Return a new `vinyl-ftp` instance with the given config. Config options:

```
{
	host:       FTP host,     default is localhost
	user:       FTP user,     default is anonymous
	password:   FTP password, default is anonymous@
	port:       FTP port,     default is 21

	log:        Log function, default is null
	timeOffset: Offset server time by this number of minutes, default is 0
	parallel:   Number of parallel transfers, default is 3
	            Don't worry about setting this too high, vinyl-ftp
	            recovers from "Too many connections" errors nicely.
	keep:       Keep connections alive when streams end, default is false
	            Remember to have your last stream { keep: false } so
	            remaining FTP connections are closed on end.
}
```

You can override `parallel` and `keep` per stream in their `options`.

<hr>

`var conn = ftp.create( config )`

### conn.dest( remoteFolder[, options] )

Returns a transform stream that transfers input files to a remote folder.
All directories are created automatically.
Passes input files through.

### conn.mode( remoteFolder, mode[, options] )

Returns a transform stream that sets remote file permissions for each file.
`mode` must be a string between '0000' and '0777'.

### conn.newer( remoteFolder[, options] )

Returns a transform stream which filters the input for files
which are newer than their remote counterpart.

### conn.differentSize( remoteFolder[, options] )

Returns a transform stream which filters the input for files
which have a different file size than their remote counterpart.

### conn.newerOrDifferentSize( remoteFolder[, options] )

See above.

### conn.filter( remoteFolder, filter[, options] )

Returns a transform stream that filters the input using a callback.
The callback should be of this form:

```javascript
function( vinylFile, remoteFile, callback ) {

	// remoteFile holds information about vinylFile's remote counterpart.
	// Decide wether vinylFile should be emitted and call callback with boolean.
	// callback is a function( error, emit )

	callback( null, emit );

}
```

## Todo

- add extensive testing
- implement FTP glob, so we can
	- implement `src( globs[, opt] )`
	- implement `watch( globs[, opt, cb] )`
- add progress events
- add fine-grained logging
