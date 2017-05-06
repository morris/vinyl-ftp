var assert = require( 'assert' );
var VinylFs = require( 'vinyl-fs' );
var VinylFtp = require( '../' );

var suite = require( './suite' );

describe( 'dest', function () {

	this.timeout( 10000 );

	beforeEach( function ( done ) {
		suite.vftp.rmdir( 'test', done );
	} );

	it( 'should upload (streamed)', test( { buffer: false } ) );
	it( 'should upload (buffered)', test() );

	function test( fsOpt, ftpOpt ) {

		return function ( done ) {

			done = suite.done( done );

			VinylFs.src( 'test/fixtures/**', fsOpt )
				.pipe( suite.vftp.dest( 'test/dest', ftpOpt ) )
				.on( 'error', done )
				.on( 'end', check );

			function check() {

				assert( suite.log.match( /UP/ ) );
				assert( suite.log.match( /100\%/ ) );

				done();

			}

		};

	}

	it( 'should upload concurrently', function ( done ) {

		done = suite.done( done );

		upload();
		upload();
		upload();

		function upload() {
			VinylFs.src( [ 'test/fixtures/js/sub/sub.js', 'test/fixtures/js/sub/sub.js' ] )
				.pipe( suite.vftp.dest( 'test/lol/rofl/afk' ) )
				.on( 'error', check )
				.on( 'end', check );
		}

		var i = 0;

		function check( err ) {
			if ( err ) return done( err );
			++i;
			return i < 3 || done();
		}

	} );

	it( 'should report an error on incorrect login', function ( done ) {

		done = suite.done( done );

		this.timeout( 10000 );

		var vftp = VinylFtp.create( {
			host: suite.config.host,
			user: 'fake',
			log: console.log.bind( console )
		} );

		VinylFs.src( 'test/fixtures/**' )
			.pipe( vftp.dest( 'test/dest' ) )
			.on( 'error', check );
			//.on( 'finish', check )
			//.on( 'end', check );

		function check( err ) {

			assert.ok( err instanceof Error );
			done();

		}

	} );

} );
