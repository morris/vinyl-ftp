/**
 * @author morris
 */

var VinylFtp = require( '../' );

var suite = module.exports = {};
suite.config = require( './config.json' );
suite.config.log = function() {

	var args = Array.prototype.slice.call( arguments, 0 );
	suite.log += args.join( ' ' );
	console.log.apply( console, arguments );

};

beforeEach( function( done ) {

	suite.log = '';
	suite.vftp = VinylFtp.create( suite.config );

	done();

} );

afterEach( function() {

	suite.vftp.disconnect();

} );
