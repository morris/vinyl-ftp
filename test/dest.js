/**
 * @author morris
 */

var assert = require( 'assert' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should upload (streamed)', test( { buffer: false } ) );
it( 'should upload (buffered)', test() );

function test( fsOpt, ftpOpt ) {

	return function( done ) {

		VinylFs.src( 'test/fixtures/**' )
			.pipe( VinylFs.dest( 'test/src' ) )
			.on( 'end', mid );

		function mid() {

			VinylFs.src( 'test/src/**', fsOpt )
				.pipe( suite.vftp.dest( 'test/dest', ftpOpt ) )
				.on( 'end', check );

		}

		function check() {

			var expected = [
				'css',
				'css/normalize.css',
				'css/style.css',
				'empty',
				'js',
				'js/jquery.js',
				'js/script.js',
				'js/sub',
				'js/sub/sub.js',
				'index.html'
			];

			suite.expectFiles( 'test/dest/**', expected, final );

		}

		function final( err ) {

			suite.cleanup( err, done );

		}

	}

}
