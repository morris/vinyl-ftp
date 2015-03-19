/**
 * @author morris
 */

var expect = require( 'expect' );
var fs = require( 'fs' );
var rmdir = require( 'rmdir' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should set the mode', function( done ) {

	this.timeout( 5000 );

	suite.vftp.glob( 'test/dest/**' )
	//VinylFs.src( 'test/fixtures/**' )
		.pipe( suite.vftp.mode( 'test/dest', '0777' ) )
		.on( 'error', done )
		.on( 'end', check );

	function check() {

		expect( suite.log ).toMatch( /SITE  CHMOD 0777/ );

		done();

	}

} );
