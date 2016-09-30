var expect = require( 'expect' );
var suite = require( './suite' );
var vfs = require( 'vinyl-fs' );

describe( 'dest', function () {

	it( 'should not fail when called concurrently', function ( done ) {

		done = suite.done( done );

		this.timeout( 10000 );

		var conn = suite.vftp;

		var streams = [];
		var n = 5;
		for ( var i = 0; i < n; ++i ) {

			streams.push(
				vfs.src( [ 'test/fixtures/index.html' ] )
					.pipe( conn.dest( '/test/concurrent/' + i ) )
			);

		}
		var counter = n;

		streams.forEach( function ( stream ) {

			stream.on( 'error', done );
			stream.on( 'end', function () {
				--counter;
				if ( counter === 0 ) done();
			} );

		} );

	} );

} );
