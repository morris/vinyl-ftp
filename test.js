/**
 * Derived from https://github.com/sindresorhus/gulp-ftp/blob/master/test.js
 * Original Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 *
 * TODO add extensive tests
 *
 * @author Sindre Sorhus
 * @author morris
 */

'use strict';

var assert = require( 'assert' );
var fs = require( 'fs' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );
var Server = require( 'ftp-test-server' );
var Ftp = require( './' );
var mockServer;

before( function( done ) {

	mockServer = new Server();

	mockServer.init( {
		user: 'test',
		pass: 'test',
		port: 3334
	} );

	mockServer.on( 'stdout', process.stdout.write.bind( process.stdout ) );
	mockServer.on( 'stderr', process.stderr.write.bind( process.stderr ) );

	setTimeout( done, 500 );

} );

after( function () {

	mockServer.stop();

} );

it( 'should upload manual buffer files to FTP-server', function( cb ) {

	var ftp = new Ftp( {
		host: 'localhost',
		port: 3334,
		user: 'test',
		pass: 'test'
	} );

	var stream = ftp.dest( '.' );

	stream.write( new File( {
		cwd: __dirname,
		base: __dirname,
		path: __dirname + '/fixture/fixture.txt',
		contents: new Buffer( 'unicorns' )
	} ) );

	stream.write( new File( {
		cwd: __dirname,
		base: __dirname,
		path: __dirname + '/fixture/test/fixture2.txt',
		contents: new Buffer( 'unicorns' )
	} ) );

	setTimeout( function () {

		stream.end();
		assert( fs.existsSync( 'fixture/fixture.txt' ) );
		assert( fs.existsSync( 'fixture/test/fixture2.txt' ) );
		fs.unlinkSync( 'fixture/fixture.txt' );
		fs.unlinkSync( 'fixture/test/fixture2.txt' );
		fs.rmdirSync( 'fixture/test' );
		fs.rmdirSync( 'fixture' );
		cb();

	}, 500 );

} );

it( 'should upload piped vinyl-fs files (streamed) to FTP-server', vinylFsTest( false ) );
it( 'should upload piped vinyl-fs files (buffered) to FTP-server', vinylFsTest( true ) );

function vinylFsTest( buffer ) {

	return function( cb ) {

		var ftp = new Ftp( {
			host: 'localhost',
			port: 3334,
			user: 'test',
			pass: 'test'
		} );

		fs.mkdirSync( 'fixture' );
		fs.mkdirSync( 'fixture/test' );
		fs.writeFileSync( 'fixture/fixture.txt', 'unicorns' );
		fs.writeFileSync( 'fixture/test/fixture2.txt', 'unicorns' );

		VinylFs.src( './fixture/**', { buffer: buffer } )
			.pipe( ftp.dest( 'fixture' ) )
			.pipe( ftp.mode( 'fixture', '0777' ) );

		setTimeout( function () {

			assert( fs.existsSync( 'fixture/fixture.txt' ) );
			assert( fs.existsSync( 'fixture/test/fixture2.txt' ) );
			fs.unlinkSync( 'fixture/fixture.txt' );
			fs.unlinkSync( 'fixture/test/fixture2.txt' );
			fs.rmdirSync( 'fixture/test' );
			fs.rmdirSync( 'fixture' );
			cb();

		}, 1000 );

	}

}
