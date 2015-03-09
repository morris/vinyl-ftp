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

	suite.vftp.mkdirp( '/test/src/foo/bar', function( err ) {

		if ( err ) return final( err );
		check();

	} );

	suite.vftp.mkdirp( '/test/src/foo/bar', function( err ) {

		if ( err ) return final( err );
		check();

	} );

	var i = 0;

	function check() {

		++i;

		if ( i < 2 ) return;

		var expected = [
			'foo',
			'foo/bar'
		];

		suite.expectFiles( 'test/src/**', expected, final );

	}

	function final( err ) {

		suite.cleanup( err, done );

	}

} );
