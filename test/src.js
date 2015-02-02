/**
 * @author morris
 */

var assert = require( 'assert' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should download (buffered)', test() );
it( 'should download (streamed)', test( { buffer: false } ) );

function test( ftpOpt ) {

	return function( done ) {

		VinylFs.src( 'test/fixtures/**' )
			.pipe( VinylFs.dest( 'test/src' ) )
			.on( 'end', mid );

		function mid() {

			suite.vftp.src( 'test/src/**', ftpOpt )
				.pipe( VinylFs.dest( 'test/dest' ) )
				.on( 'end', check );

		}

		function check() {

			var expected = [
				'css',
				'css/normalize.css',
				'css/style.css',
				//'empty', vinyl-fs does not create directories
				'js',
				'js/jquery.js',
				'js/script.js',
				'index.html'
			];

			suite.expectFiles( 'test/dest/**', expected, final );

		}

		function final( err ) {

			suite.cleanup( err, done );

		}

	}

}
