/**
 * @author morris
 */

var assert = require( 'assert' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );
var through = require( 'through2' );

var setup = require( './setup' );

it( 'should download (buffered)', test() );
it( 'should download (streamed)', test( { buffer: false } ) );

function test( ftpOpt ) {

	return function( done ) {

		VinylFs.src( 'test/fixtures/**' )
			.pipe( VinylFs.dest( 'test/src' ) )
			.on( 'end', mid );

		function mid() {

			setup.vftp.src( 'test/src/**', ftpOpt )
				.pipe( VinylFs.dest( 'test/dest' ) )
				.on( 'end', end );

		}

		function end() {

			assert( fs.existsSync( 'test/dest/index.html' ) );

			rmdir( 'test/src', function( err ) {
				if ( err ) return done( err );
				rmdir( 'test/dest', function( err ) {
					if ( err ) return done( err );
					done();

				} );
			} );

		}

	}

}
