/**
 * A resource manager keeps track of async resources that should be
 * loaded only once.
 *
 * @author morris
 */

module.exports = function( load ) {

	var cache = {};

	this.get = function( id, cb ) {

		var resource = cache[ id ];

		if ( resource ) {

			if ( resource.ready ) {

				if ( cb ) cb( resource.err, resource.data );

			} else {

				resource.queue.push( cb );

			}

			return;

		}

		resource = cache[ id ] = {
			ready: false,
			err:   null,
			data:  null,
			queue: [ cb ]
		};

		load( id, function( err, data ) {

			resource.ready = true;
			resource.err =   err;
			resource.data =  data;
			resource.queue.forEach( function( cb ) {

				if ( cb ) cb( err, data );

			} );
			resource.queue = null;

		} );

	};

	this.clear = function() {

		cache = {};

	};

	this.remove = function( id ) {

		delete cache[ id ];

	};

}
