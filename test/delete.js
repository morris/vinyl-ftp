var assert = require( 'assert' );
var suite = require( './suite' );

it( 'should clean', function ( done ) {

	done = suite.done( done );

	this.timeout( 15000 );

	suite.vftp.delete( 'test/dest/index.html', check );
	suite.vftp.rmdir( 'test', check );

	var i = 0;

	function check( err ) {

		++i;

		if ( i < 2 ) return;

		if ( err ) return done( err );

		assert( suite.log.match( /DEL/ ) );
		assert( suite.log.match( /RMDIR/ ) );

		done();

	}

} );
