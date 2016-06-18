/**
 * @author morris
 */

var expect = require( 'expect' );
var VinylFtp = require( '../' );

var suite = module.exports = {};
suite.config = require( './config.json' );
suite.config.log = function () {

	var args = Array.prototype.slice.call( arguments, 0 );
	suite.log += args.join( ' ' );
	console.log.apply( console, arguments );

};
//suite.config.debug = suite.config.log;
suite.done = function ( done ) {

	return function () {

		setTimeout( function () {

			expect( suite.vftp.connectionCount ).toBe( 0 );
			done();

		}, 400 );

	};

};

beforeEach( function ( done ) {

	suite.log = '';
	suite.vftp = VinylFtp.create( suite.config );

	done();

} );
