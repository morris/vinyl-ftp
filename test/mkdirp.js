/**
 * @author morris
 */

var assert = require( 'assert' );
var fs = require( 'fs' );

var suite = require( './suite' );

// this is a stub

it( 'should mkdirp', function( done ) {

	fs.mkdirSync( 'test/src' );
	fs.mkdirSync( 'test/dest' );

	suite.vftp.mkdirp( '/test/src', function( err ) {

		console.log ( err );
		final( err );

	} );

	function final( err ) {

		suite.cleanup( err, done );

	}

} );
