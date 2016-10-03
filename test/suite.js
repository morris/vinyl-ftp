var fs = require( 'fs' );
var assert = require( 'assert' );
var VinylFtp = require( '../' );

var suite = module.exports = {};

if ( !process.env.CONFIG ) {
	console.log( 'Missing CONFIG environment variable' );
	process.exit( 1 );
}

suite.config = JSON.parse( fs.readFileSync( process.env.CONFIG ) );
suite.config.log = function () {

	var args = Array.prototype.slice.call( arguments, 0 );
	suite.log += args.join( ' ' );
	console.log.apply( console, arguments );

};

suite.done = function ( done ) {

	return function () {

		setTimeout( function () {

			assert.equal( suite.vftp.connectionCount, 0 );
			done();

		}, 1000 );

	};

};

beforeEach( function ( done ) {

	suite.log = '';
	suite.vftp = VinylFtp.create( suite.config );

	done();

} );
