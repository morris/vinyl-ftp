/**
 * @author morris
 */

var expect = require( 'expect' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

it( 'should upload (streamed)', test( { buffer: false } ) );
it( 'should upload (buffered)', test() );

function test( fsOpt, ftpOpt ) {

	return function ( done ) {

		done = suite.done( done );

		this.timeout( 5000 );

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
