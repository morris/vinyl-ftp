/**
 * @author morris
 */

var assert = require( 'assert' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var setup = require( './setup' );

it( 'should upload to FTP-server (streamed)', uploadTest( { buffer: false } ) );
it( 'should upload to FTP-server (buffered)', uploadTest() );

function uploadTest( fsOpt, ftpOpt ) {

	return function( done ) {

		VinylFs.src( 'test/fixtures/**' )
			.pipe( VinylFs.dest( 'test/local' ) )
			.on( 'end', mid );

		function mid() {

			VinylFs.src( 'test/local/**', fsOpt )
				.pipe( setup.vftp.dest( 'test/remote', ftpOpt ) )
				.on( 'end', end );

		}

		function end() {

			assert( fs.existsSync( 'test/remote/index.html' ) );

			rmdir( 'test/local', function( err ) {
				if ( err ) return done( err );
				rmdir( 'test/remote', function( err ) {
					if ( err ) return done( err );
					done();

				} );
			} );

		}

	}

}
