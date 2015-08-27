/**
 * @author morris
 */

var expect = require( 'expect' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should set the mode', function ( done ) {

	done = suite.done( done );

	this.timeout( 15000 );

	VinylFs.src( 'test/fixtures/*.html' )
		.pipe( suite.vftp.dest( 'test/dest' ) )
		.pipe( suite.vftp.mode( 'test/dest', '0777' ) )
		.on( 'error', done )
		.on( 'end', check );

	function check( err ) {

		expect( suite.log ).toMatch( /SITE  CHMOD 0777/ );

		done();

	}

} );
