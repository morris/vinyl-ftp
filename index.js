/**
 * @author morris
 */

var assign = require( 'object-assign' );

module.exports = VinylFtp;

function VinylFtp( config ) {

	this.config = assign( {
		parallel:       3,
		maxConnections: config.parallel || 5,
		log:            null,
		timeOffset:     0,
		idleTimeout:    100,
		password:       config.password || config.pass,
		reload:         false
	}, config );

	// connection pool
	this.queue = [];
	this.connectionCount = 0;
	this.idle = [];
	this.idleTimer = null;

}

VinylFtp.create = function ( config ) {

	return new VinylFtp( config );

};

assign(
	VinylFtp.prototype,
	require( './lib/glob' ),
	require( './lib/filter' ),
	require( './lib/src' ),
	require( './lib/dest' ),
	require( './lib/delete' ),
	require( './lib/mode' ),
	require( './lib/ftp' ),
	require( './lib/helpers' ),
	require( './lib/clean' )
);
