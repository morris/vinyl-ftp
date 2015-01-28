/**
 * @author morris
 */

var through = require( 'through2' );

module.exports = {

	src: function( globs, options ) {

		options = this.makeOptions( options );
		var self = this;

		var glob = this.glob( globs, options );

		if ( options.since ) {

			var filterSince = through.obj( function( file, enc, cb ) {

				if ( options.since < file.ftp.date ) {

					return cb( null, file );

				}

				cb();

			} );

			glob = glob.pipe( filterSince );

		}

		if ( options.read === false ) return glob;

		function getContents( file, cb ) {

			if ( file.ftp.type === 'dir' ) return cb( null, file );

			if ( options.buffer === false ) return self.downstream( file.path, onContents );

			self.downbuffer( file.path, onContents );

			function onContents( err, contents ) {

				if ( err ) return cb( err );
				file.contents = contents;



				cb();

			}

		}

		return glob.pipe( this.parallel( getContents, options ) );

	}

};
