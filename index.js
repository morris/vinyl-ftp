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
		keep:           false,
		password:       config.password || config.pass
	}, config );

	// connection pool
	this.used = [];
	this.available = [];
	this.queue = [];

}

VinylFtp.create = function( config ) {

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
	require( './lib/helpers' )
);
