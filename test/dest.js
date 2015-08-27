/**
 * @author morris
 */

var expect = require( 'expect' );
var VinylFs = require( 'vinyl-fs' );
var VinylFtp = require( '../' );

var suite = require( './suite' );

describe( 'dest', function () {

	it( 'should upload (streamed)', test( { buffer: false } ) );
	it( 'should upload (buffered)', test() );

	function test( fsOpt, ftpOpt ) {

		return function ( done ) {

			done = suite.done( done );

			this.timeout( 10000 );

			VinylFs.src( 'test/fixtures/**', fsOpt )
				.pipe( suite.vftp.dest( 'test/dest', ftpOpt ) )
				.on( 'error', done )
				.on( 'end', check );

			function check() {

				expect( suite.log ).toMatch( /UP/ );
				expect( suite.log ).toMatch( /100\%/ );

				done();

			}

		}

	}

	it( 'should report an error on incorrect login', function ( done ) {

		done = suite.done( done );

		this.timeout( 10000 );

		var vftp = VinylFtp.create( {
			user: 'fake',
			log: console.log.bind( console )
		} );

		VinylFs.src( 'test/fixtures/**' )
			.pipe( vftp.dest( 'test/dest' ) )
			.on( 'error', check );
			//.on( 'finish', check )
			//.on( 'end', check );

		function check( err ) {

			expect( err ).toBeA( Error );
			done();

		}

	} );

} );
