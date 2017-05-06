var suite = require( './suite' );

describe( 'mkdirp', function () {

	it( 'should work', function ( done ) {

		done = suite.done( done );

		this.timeout( 5000 );

		suite.vftp.mkdirp( '/test/src/foo/bar', function ( err ) {

			if ( err ) return done( err );
			check();

		} );

		suite.vftp.mkdirp( '/test/src/foo/bar', function ( err ) {

			if ( err ) return done( err );
			check();

		} );

		var i = 0;

		function check() {
			++i; if ( i < 2 ) return;
			done();
		}

	} );

} );
