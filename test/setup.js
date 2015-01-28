/**
 * Derived from https://github.com/sindresorhus/gulp-ftp/blob/master/test.js
 * Original Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 *
 * @author Sindre Sorhus
 * @author morris
 */

var Server = require( 'ftp-test-server' );
var VinylFtp = require( '../' );
var setup = module.exports = {};

before( function( done ) {

	setup.server = new Server();

	setup.server.init( {
		user: 'test',
		pass: 'test',
		port: 3334
	} );

	setup.server.on( 'stdout', process.stdout.write.bind( process.stdout ) );
	setup.server.on( 'stderr', process.stderr.write.bind( process.stderr ) );

	setTimeout( done, 500 );

} );

beforeEach( function( done ) {

	setup.vftp = VinylFtp.create( {
		host: 'localhost',
		port: 3334,
		user: 'test',
		pass: 'test',
		log: console.log
	} );

	done();

} );

afterEach( function () {

	setup.vftp.disconnect();

} );


after( function () {

	setup.server.stop();
	setup.vftp.disconnect();

} );
