/**
 * Derived from https://github.com/sindresorhus/gulp-ftp/blob/master/test.js
 * Original Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 *
 * @author Sindre Sorhus
 * @author morris
 */

var Server = require( 'ftp-test-server' );
var VinylFtp = require( '../' );
var VinylFs = require( 'vinyl-fs' );
var suite = module.exports = {};
var expect = require( 'expect' );
var rmdir = require( 'rmdir' );
var Path = require( 'path' );

before( function( done ) {

	suite.server = new Server();

	suite.server.init( {
		user: 'test',
		pass: 'test',
		port: 3334
	} );

	suite.server.on( 'stdout', process.stdout.write.bind( process.stdout ) );
	suite.server.on( 'stderr', process.stderr.write.bind( process.stderr ) );

	setTimeout( done, 500 );

} );

beforeEach( function( done ) {

	suite.vftp = VinylFtp.create( {
		host: 'localhost',
		port: 3334,
		user: 'test',
		pass: 'test',
		log: console.log
	} );

	done();

} );

afterEach( function() {

	suite.vftp.disconnect();

} );


after( function () {

	suite.server.stop();
	suite.vftp.disconnect();

} );

suite.cleanup = function( error, cb ) {

	rmdir( 'test/src', function( err ) {
		if ( err ) return cb( err );
		rmdir( 'test/dest', function( err ) {
			if ( err ) return cb( err );
			cb( error );

		} );
	} );


};

suite.expectFiles = function( globs, expected, cb ) {

	suite.list( globs, function( err, files ) {

		if ( err ) return cb ( err );

		try {

			expected = expected.map( Path.normalize );

			files.sort();
			expected.sort();

			expect( files ).toEqual( expected )
			cb();

		} catch ( ex ) {

			cb( ex );

		}

	} );

};

suite.list = function( globs, cb ) {

	var stream = VinylFs.src( globs, { read: false } );
	var files = [];

	stream.on( 'data', function( file ) {

		if ( file.relative !== '' ) files.push( file.relative );

	} );

	stream.on( 'end', function() {

		cb( null, files );

	} );

	stream.on( 'error', cb );

};
