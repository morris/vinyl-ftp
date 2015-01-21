/**
 * @author morris
 */

'use strict';

var assign = require( 'object-assign' );
var Stream = require( 'stream' );
var Path = require( 'path' );
var parallel = require( 'parallel-transform' );

var Ftp = require( 'ftp' );
Ftp.prototype.mlsd = require( './mlsd' );

var ResourceManager = require( './resource-manager' );

//

var RE_BS = /\\/g;

module.exports = VinylFtp;

function VinylFtp( config ) {

	this.config = assign( {
		parallel:   3,
		log:        null,
		timeOffset: 0,
		keep:       false,
		password:   config.password || config.pass
	}, config );

	this.available = [];
	this.queue = [];

}

VinylFtp.create = function( config ) {

	return new VinylFtp( config );

}

assign( VinylFtp.prototype, {

	// vinyl streams, the public api

	dest: function( folder, options ) {

		var self = this;

		return this.parallel( function( file, cb ) {

			var path = self.join( '/', folder, file.relative );
			self.upload( file, path, cb );

		}, options );

	},

	mode: function( folder, mode, options ) {

		var self = this;

		return this.parallel( function( file, cb ) {

			var path = self.join( '/', folder, file.relative );
			self.chmod( path, mode, cb );

		}, options );

	},

	newer: function( folder, options ) {

		return this.filter( folder, function( file, remote, cb ) {

			cb( null, !remote || file.stat.mtime > remote.date );

		}, options );

	},

	differentSize: function( folder, options ) {

		return this.filter( folder, function( file, remote, cb ) {

			cb( null, !remote || file.stat.size !== remote.size );

		}, options );

	},

	newerOrDifferentSize: function( folder, options ) {

		return this.filter( folder, function( file, remote, cb ) {

			cb( null, !remote || file.stat.mtime > remote.date || file.stat.size !== remote.size );

		}, options );

	},

	filter: function( folder, filter, options ) {

		var self = this;

		return this.parallel( function( file, cb ) {

			var path = self.join( '/', folder, file.relative );

			self.remote( path, onRemote );

			function onRemote( err, remote ) {

				if ( err ) return cb( err );
				filter( file, remote, onFilter );

			}

			function onFilter( err, emit ) {

				cb( err, emit ? file : null );

			}

		}, options );

	},

	// helpers and resources

	parallel: function( transform, options ) {

		options = assign( this.config, options );
		var p = Math.max( 1, parseInt( options.parallel ) );
		var stream = parallel( p, transform );

		if ( !options.keep ) {

			var disconnect = this.disconnect.bind( this );
			stream.on( 'end', disconnect )
				.on( 'error', disconnect );

		}

		return stream;

	},

	upload: function( file, path, cb ) {

		var self = this;
		var stream = new Stream.PassThrough();

		if ( file.isNull() ) {

			if ( file.stat && file.stat.isDirectory() ) this.mkdirp( path, cb );
			else cb( null, file );

			return;

		}

		file.pipe( stream, { end: true } );

		// ensure that parent directory exists
		self.mkdirp( Path.dirname( path ), onParent );

		function onParent( err ) {

			if ( err ) return final( err );
			self.ftp( onFtp );

		}

		var rel;

		function onFtp( err, ftp ) {

			rel = ftp;
			if ( err ) return final( err );

			self.log( 'PUT ', path );
			ftp.put( stream, path, final ); // no timeout

			// THE FOLLOWING MUST BE AFTER ftp.put()
			// Somehow, if you attach a 'data' handler before
			// ftp.put, the callback of ftp.put is never called

			if ( file.stat ) {

				var uploaded = 0;
				var size = file.stat.size;

				stream.on( 'data', function( chunk ) {

					uploaded += chunk.length;

					var progress = Math.floor( uploaded / size * 100 ).toString();
					if ( progress.length === 1 ) progress = '  ' + progress;
					if ( progress.length === 2 ) progress = ' ' + progress;

					self.log( progress + '% ' + path );

				} );

			}

		}

		function final( err ) {

			self.release( rel );
			cb( err, file );

		}

	},

	mkdirp: function( path, cb ) {

		if ( !this._mkdirp ) {

			var self = this;

			this._mkdirp = new ResourceManager( function( path, cb ) {

				// skip if path is root
				if ( path === '/' || path === '' ) {

					final();
					return;

				}

				self.remote( path, onRemote );

				function onRemote( err, remote ) {

					if ( err ) return final( err );
					if ( remote && remote.type !== 'dir' ) return final( new Error( path + ' is a file, cannot MKDIR' ) );
					if ( remote ) return final(); // skip if exists

					// ensure that parent directory exists
					self.mkdirp( Path.dirname( path ), onParent );

				}

				function onParent( err ) {

					if ( err ) return final( err );
					self.ftp( onFtp );

				}

				var rel;

				function onFtp( err, ftp ) {

					rel = ftp;
					if ( err ) return final( err );

					self.log( 'MKD ', path );
					ftp.mkdir( path, final );

				}

				function final( err ) {

					self.release( rel );
					cb( err );

				}

			} );

		}

		path = this.join( '/', path );
		return this._mkdirp.get( path, cb );

	},

	chmod: function( path, mode, cb ) {

		var self = this;
		path = this.join( '/', path );
		var rel;

		self.ftp( onFtp );

		function onFtp( err, ftp ) {

			rel = ftp;
			if ( err ) return final( err );

			self.log( 'SITE', 'CHMOD', mode, path );
			ftp.site( 'CHMOD ' + mode + ' ' + path, final );

		}

		function final( err ) {

			self.release( rel );
			cb( err );

		}

	},

	remote: function( path, cb ) {

		var self = this;
		path = this.join( '/', path );
		var basename = Path.basename( path );
		var dirname = Path.dirname( path );

		self.mlsd( dirname, onMlsd );

		function onMlsd( err, files ) {

			if ( err && err.code === 502 ) { // mlsd not implemented

				return self.list( dirname, onFiles );

			}

			onFiles( err, files );

		}

		function onFiles( err, files ) {

			if ( err ) return cb( err );

			for ( var i = 0; i < files.length; ++i ) {

				if ( files[ i ].name === basename ) return cb( null, files[ i ] );

			}

			cb();

		}

	},

	mlsd: function( path, cb ) {

		if ( !this._mlsd ) {

			var self = this;

			this._mlsd = new ResourceManager( function( path, cb ) {

				var rel;

				self.ftp( onFtp );

				function onFtp( err, ftp ) {

					rel = ftp;
					if ( err ) throw err;

					self.log( 'MLSD', path );
					ftp.mlsd( path, onMlsd );

				}

				function onMlsd( err,  files ) {

					self.release( rel );

					// no such file or directory
					if ( err && ( err.code === 501 || err.code === 550 ) ) return cb( null, [] );
					if ( err ) return cb( err );

					files = files.filter( function( file ) {

						file.date = self.fixDate( file.date );
						return file.name !== '.' && file.name !== '..';

					} );

					cb( null, files );

				}

			} );

		}

		path = this.join( '/', path );
		this._mlsd.get( path, cb );

	},

	list: function( path, cb ) {

		if ( !this._list ) {

			var self = this;

			this._list = new ResourceManager( function( path, cb ) {

				var rel;

				self.ftp( onFtp );

				function onFtp( err, ftp ) {

					rel = ftp;
					if ( err ) return final( err );

					self.log( 'LIST', path );
					ftp.list( path, onFiles );

				}

				function onFiles( err, files ) {

					if ( err && err.code === 550 ) return []; // no such file or directory
					if ( err ) return final( err );

					files = files.filter( function( file ) {

						file.date = self.fixDate( file.date );
						return file.name !== '.' && file.name !== '..';

					} );

					final( null, files );

				}

				function final( err, files ) {

					self.release( rel );
					cb( err, files );

				}

			} );

		}

		path = this.join( '/', path );
		this._list.get( path, cb );

	},

	ftp: function( cb ) {

		if ( this.available.length > 0 ) {

			cb( null, this.available.pop() );
			return;

		}

		this.log( 'CONN' );

		var self = this;
		var ftp = new Ftp();

		ftp.on( 'ready', function() {

			ftp._ftpUsed = true;
			cb( null, ftp );

		} );

		ftp.on( 'error', function( err ) {

			var code = err.code ? (' (' + err.code + ')') : '';
			self.log( 'ERR  ' + err.message + code );
			ftp._ftpError = err;

			// only retry callback on connection/first error
			if ( !ftp._ftpUsed ) {

				ftp._ftpUsed = true;
				self.queue.push( cb );

			}

		} );

		ftp.connect( this.config );

	},

	release: function( ftp ) {

		if ( !ftp ) return;

		if ( ftp.vinylFtpError ) {

			ftp.end();

		} else if ( this.queue.length > 0 ) {

			var first = this.queue.shift();
			first( null, ftp );

		} else {

			this.available.push( ftp );

		}

	},

	disconnect: function( err ) {

		var self = this;

		this.available.forEach( function( ftp ) {

			self.log( 'DISC' );
			ftp.end();

		} );

		this.available = [];

		if ( err ) self.log( 'ERR ', err );

	},

	fixDate: function( date ) {

		var offset = 0;

		if ( this.config.timeOffset ) offset += this.config.timeOffset;

		return new Date( date.valueOf() + offset );

	},

	normalize: function( path ) {

		return Path.normalize( path ).replace( RE_BS, '/' );

	},

	join: function() {

		return Path.join.apply( Path, arguments ).replace( RE_BS, '/' );

	},

	log: function() {

		var log = this.config.log;

		if ( typeof log === 'function' ) {

			log.apply( undefined, arguments );

		}

	}

} );
