/**
 * @author morris
 */

var expect = require( 'expect' );
var suite = require( './suite' );

it( 'should clean', function ( done ) {

	done = suite.done( done );

	this.timeout( 10000 );

	suite.vftp.delete( 'test/dest/index.html', check );
	suite.vftp.rmdir( 'test', check );

	var i = 0;

	function check() {

		++i;

		if ( i < 2 ) return;

		expect( suite.log ).toMatch( /DEL/ );
		expect( suite.log ).toMatch( /RMDIR/ );

		done();

	}

} );
