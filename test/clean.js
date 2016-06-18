/**
 * @author morris
 */

var expect = require( 'expect' );
var VinylFs = require( 'vinyl-fs' );
var VinylFtp = require( '../' );
var rmdir = require( 'rmdir' );

var suite = require( './suite' );

describe( 'clean', function () {

	this.timeout( 10000 );

	it( '(preparing: create files to clean up later)', function ( done ) {
		VinylFs.src( 'test/fixtures/**' )
			.pipe( VinylFs.dest( 'test/fixtures/cleaning' ) )
			.on( 'error', done )
			.on( 'end', done );
	} );

	it( '(preparing: upload all files)', function ( done ) {

		done = suite.done( done );

		VinylFs.src( 'test/fixtures/**' )
			.pipe( suite.vftp.dest( 'test/clean' ) )
			.on( 'error', done )
			.on( 'end', done );

	} );

	it( '(preparing: remove files to clean)', function ( done ) {

		rmdir( 'test/fixtures/cleaning', done );

	} );

	it( 'should clean up extra remote files', function ( done ) {

		done = suite.done( done );

		suite.vftp.clean( 'test/clean/**', 'test/cleaning' )
			.on( 'error', done )
			.on( 'end', check );

		function check() {

			expect( suite.log ).toMatch( /DEL/ );
			expect( suite.log ).toMatch( /RMDIR/ );
			done();

		}

	} );

} );
