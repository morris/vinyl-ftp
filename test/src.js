/**
 * @author morris
 */

var expect = require( 'expect' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should download (buffered)', test() );
it( 'should download (streamed)', test( { buffer: false } ) );

function test( ftpOpt ) {

	return function( done ) {

		this.timeout( 5000 );

		suite.vftp.src( 'test/dest/**', ftpOpt )
			.pipe( VinylFs.dest( 'test/download' ) )
			.on( 'error', cleanup )
			.on( 'end', check );

		function check() {

			expect( suite.log ).toMatch( /DOWN/ );
			expect( suite.log ).toMatch( /100\%/ );

			cleanup();

		}

		function cleanup( err ) {

			rmdir( 'test/download', function( err ) {

				done( err );

			} );

		}

	}

}
