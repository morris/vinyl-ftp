var assert = require( 'assert' );
var fs = require( 'fs' );
var File = require( 'vinyl' );
var VinylFs = require( 'vinyl-fs' );

var suite = require( './suite' );

describe( 'Of the filter methods,', function () {

  it( 'the filter method should apply a custom filter', function ( done ) {

  	done = suite.done( done );

  	this.timeout( 15000 );

  	VinylFs.src( 'test/fixtures/*.html' )
  		.pipe( suite.vftp.dest( 'test/dest' ) )
  		.pipe( suite.vftp.mode( 'test/dest', '0777' ) )
  		.on( 'error', done )
  		.on( 'end', check );

  	function check( err ) {

  		assert.ok( suite.log.match( /SITE  CHMOD 0777/ ) );

  		done();

  	}

  } );

} );
