var assert = require( 'assert' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should download (buffered)', test() );
it( 'should download (streamed)', test( { buffer: false } ) );

function test( ftpOpt ) {

	return function ( done ) {

		done = suite.done( done );

		this.timeout( 10000 );

		suite.vftp.src( 'test/dest/**', ftpOpt )
			.pipe( VinylFs.dest( 'test/download' ) )
			.on( 'error', cleanup )
			.on( 'end', check );

		function check() {

			assert( suite.log.match( /DOWN/ ) );
			assert( suite.log.match( /100\%/ ) );

			cleanup();

		}

		function cleanup( err ) {
			rmdir( 'test/download', function ( err2 ) {
				done( err );
			} );
		}

	};

}
