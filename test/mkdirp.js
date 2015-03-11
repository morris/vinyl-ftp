/**
 * @author morris
 */

var expect = require( 'expect' );
var suite = require( './suite' );

it( 'should mkdirp', function( done ) {

	this.timeout( 5000 );

	suite.vftp.mkdirp( '/test/src/foo/bar', function( err ) {

		if ( err ) return done( err );
		check();

	} );

	suite.vftp.mkdirp( '/test/src/foo/bar', function( err ) {

		if ( err ) return done( err );
		check();

	} );

	var i = 0;

	function check() {

		++i;

		if ( i < 2 ) return;

		done();

	}

} );
