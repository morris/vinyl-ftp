/**
 * FTP connection pool, methods, resource managers and helpers
 * @author morris
 */

var Stream = require( 'stream' );
var Path = require( 'path' );
var Ftp = require( 'ftp' );
var Vinyl = require( 'vinyl' );
var mlsd = require( './mlsd' );
var Cache = require( './cache' );

module.exports = {

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

			self.log( 'PUT  ', path );
			ftp.put( stream, path, final );

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

					self.log( 'UP   ', progress + '% ' + path );

				} );

			}

		}

		function final( err ) {

			self.release( rel );
			cb( err, file );

		}

	},

	downbuffer: function( path, cb ) {

		this.downstream( path, function( err, stream ) {

			if ( err ) return cb( err );

			var bufs = [];

			stream.on( 'data', function( data ) {

				bufs.push( data );

			} );

			stream.on( 'end', function() {

				cb( null, Buffer.concat( bufs ) );

			} );

			stream.on( 'error', function( err ) {

				 cb( err );

			} );

		} );

	},

	downstream: function( path, cb ) {

		var self = this;
		var remote, rel;

		this.remote( path, onRemote );

		function onRemote( err, rem ) {

			if ( err ) return cb( err );
			if ( !rem ) return cb( new Error( 'No such file' ) );
			remote = rem;

			self.ftp( onFtp );

		}

		function onFtp( err, ftp ) {

			rel = ftp;
			if ( err ) return onStream( err );

			self.log( 'GET  ', path );
			ftp.get( path, onStream );

		}

		function onStream( err, stream ) {

			if ( err ) {

				self.release( rel );
				return cb( err );

			}

			stream.on( 'end', function() {

				self.release( rel );

			} );

			stream.on( 'error', function() {

				self.release( rel, true );

			} );

			var bytes = 0;
			var size = remote.ftp.size;

			stream.on( 'data', function( chunk ) {

				bytes += chunk.length;

				var progress = Math.floor( bytes / size * 100 ).toString();
				if ( progress.length === 1 ) progress = '  ' + progress;
				if ( progress.length === 2 ) progress = ' ' + progress;

				self.log( 'DOWN ', progress + '% ' + path );

			} );

			// the socket stream returned by the ftp client cannot be paused
			// add intermediate passthrough stream so piped streams get data
			stream = stream.pipe( new Stream.PassThrough() );

			cb( null, stream );

		}

	},

	mkdirp: function( path, cb ) {

		if ( !this._mkdirp ) {

			var self = this;

			this._mkdirp = new Cache( function( path, cb ) {

				// skip if path is root
				if ( path === '/' || path === '' ) {

					return final();

				}

				self.remote( path, onRemote );

				function onRemote( err, remote ) {

					if ( err ) return final( err );
					if ( remote && !self.isDirectory( remote ) ) return final( new Error( path + ' is a file, cannot MKDIR' ) );
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

					self.log( 'MKDIR', path );
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

			self.log( 'SITE ', 'CHMOD', mode, path );
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

		self.mlsdOrList( dirname, onFiles );

		function onFiles( err, files ) {

			if ( err ) return cb( err );

			for ( var i = 0; i < files.length; ++i ) {

				if ( files[ i ].ftp.name === basename ) return cb( null, files[ i ] );

			}

			cb();

		}

	},

	mlsdOrList: function( path, cb ) {

		var self = this;

		if ( this.noMlsd ) return this.list( path, cb );

		this.mlsd( path, onMlsd );

		function onMlsd( err, files ) {

			if ( err && ( err.code === 502 || err.code === 500 ) ) { // mlsd not implemented

				return self.list( path, cb );

			}

			cb( err, files );

		}

	},

	mlsd: function( path, cb ) {

		if ( !this._mlsd ) {

			var self = this;

			this._mlsd = new Cache( function( path, cb ) {

				var rel;

				self.ftp( onFtp );

				function onFtp( err, ftp ) {

					rel = ftp;
					if ( err ) return final( err );

					self.log( 'MLSD ', path );
					mlsd.bind( ftp )( path, onFiles );

				}

				function onFiles( err,  files ) {

					// no such file or directory
					if ( err && ( err.code === 501 || err.code === 550 ) ) return final( null, [] );
					if ( err ) return final( err );

					final( null, self.vinylFiles( path, files ) );

				}

				function final( err, files ) {

					self.release( rel );
					cb( err, files );

				}

			} );

		}

		path = this.join( '/', path );
		this._mlsd.get( path, cb );

	},

	list: function( path, cb ) {

		if ( !this._list ) {

			var self = this;

			this._list = new Cache( function( path, cb ) {

				var rel;

				self.ftp( onFtp );

				function onFtp( err, ftp ) {

					rel = ftp;
					if ( err ) return final( err );

					self.log( 'LIST ', path );
					ftp.list( path, onFiles );

				}

				function onFiles( err, files ) {

					// no such file or directory
					if ( err && ( err.code === 550 || err.code === 450 ) ) return final( null, [] );
					if ( err ) return final( err );

					final( null, self.vinylFiles( path, files ) );

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

	vinylFiles: function( dirname, files ) {

		var self = this;

		return files.filter( function( file ) {

			return file.name !== '.' && file.name !== '..';

		} ).map( function( file ) {

			file.date = self.fixDate( file.date );

			var vinyl = new Vinyl( {
				cwd: '/',
				path: self.join( dirname, file.name )
			} );
			vinyl.ftp = file;

			return vinyl;

		} );

	},

	ftp: function( cb ) {

		if ( this.available.length > 0 ) {

			return cb( null, this.available.pop() );

		}

		if ( this.used.length < this.config.maxConnections ) {

			this.log( 'CONN ' );

			var self = this;
			var ftp = new Ftp();
			var called = false;
			this.used.push( ftp );

			ftp.on( 'ready', function() {

				self.log( 'READY' );
				called = true;
				cb( null, ftp );

			} );

			ftp.on( 'error', function( err ) {

				var code = err.code ? (' (' + err.code + ')') : '';
				self.log( 'ERROR', err.stack + code );
				self.release( ftp, true );

				// only enqueue callback if not called yet
				if ( !called ) {

					called = true;
					self.queue.push( cb );

				}

			} );

			ftp.connect( this.config );

		} else {

			this.queue.push( cb );

		}

	},

	release: function( ftp, end ) {

		if ( !ftp ) return;

		var reuse = false;

		if ( end ) {

			ftp.end();

		} else if ( this.queue.length > 0 ) {

			reuse = true;
			var first = this.queue.shift();
			first( null, ftp );

		} else {

			this.available.push( ftp );

		}

		if ( reuse ) return;

		for ( var i = 0, l = this.used.length; i < l; ++i ) {

			if ( this.used[ i ] === ftp ) {

				this.used.splice( i, 1 );
				break;

			}

		}

	},

	reload: function() {

		if ( this._mkdirp ) this._mkdirp.clear();
		if ( this._mlsd ) this._mlsd.clear();
		if ( this._list ) this._list.clear();

	},

	disconnect: function( err ) {

		var self = this;
		if ( err ) {

			var code = err.code ? (' (' + err.code + ')') : '';
			this.log( 'ERROR', err.stack + code );

		}

		this.available.forEach( function( ftp ) {

			self.log( 'DISC ' );
			ftp.end();

		} );

		this.queue.forEach( function( cb ) {

			cb( err ? err : new Error( 'FTP disconnected' ) );

		} );

		this.used = [];
		this.available = [];
		this.queue = [];

	}

};
