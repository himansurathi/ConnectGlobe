
AoPS.Utils = (function(Utils) {
	
	/**
		function Utils.getKeyChain
		
		Retrieves the value of a nested chain of objects (e.g. a.b.c.d),
		while guaranteeing no errors are thrown.
		
		@param obj: Object beginning the chain.
			If not an object, this method always returned an undefined value.
		@param keys: List of strings giving the keys.
		@return The value of the whole chain, or undefined if it did not exist.
		
		You may optionally replace the "keys" parameter with multiple arguments,
		all strings, instead of an array of strings.
		
		Example run from Chrome console:
		> x = {}
		Object {}
		> x.y = {}
		Object {}
		> x.y.z = 3
		3
		> AoPS.Ebooks.Utils.getKeyChain(x, 'y', 'z')
		3
		> AoPS.Ebooks.Utils.getKeyChain(x, 'y', 'w')
		undefined
		> AoPS.Ebooks.Utils.getKeyChain(x, 'z')
		undefined
		> AoPS.Ebooks.Utils.getKeyChain(null, 'a')
		undefined
	*/
	Utils.getKeyChain = function (obj, keys) {
		if (!_.isObject(obj)) {
			return void 0;
		}
		
		// Support both ways of specifying arguments.
		if (!_.isArray(keys)) {
			keys = _.toArray(arguments).slice(1);
		}
		
		return _.reduce(keys, function (curr_value, key) {
			var chain_ended = !curr_value || !curr_value.hasOwnProperty(key);
			if (chain_ended) {
				return void 0;
			}
			return curr_value[key];
		}, obj);
	};
	
	/**
		function Utils.hasKeyChain
		
		Checks if a nested chain of objects (e.g. a.b.c.d) exists.
		
		@param obj: Object beginning the chain.
			If not an object, this method always returns true.
		@param keys: List of strings giving the keys.
		@return True or false, based on whether the whole chain existed.
			If the final key existed but the value was undefined, this
			returns false.
		
		You may optionally replace the "keys" parameter with multiple arguments,
		all strings, instead of an array of strings.
		
		Example run from Chrome console:
		> x = {}
		Object {}
		> x.y = {}
		Object {}
		> x.y.z = 3
		3
		> x.y.w = false
		false
		> x.y.v = void 0
		undefined
		> AoPS.Ebooks.Utils.hasKeyChain(x, 'y', 'z')
		true
		> AoPS.Ebooks.Utils.hasKeyChain(x, 'y', 'w')
		true
		> AoPS.Ebooks.Utils.hasKeyChain(x, 'y', 'v')
		false
		> AoPS.Ebooks.Utils.hasKeyChain(x, 'z')
		false
	*/
	Utils.hasKeyChain = function () {
		var result = Utils.getKeyChain.apply(this, arguments);
		
		return !(_.isUndefined(result));
	};
	
	/**
		function Utils.initKeyChain
		
		Initializes a nested chain of objects (e.g. a.b.c.d) to a value,
		while only requiring the top-level object to be initialized.
		
		@param obj: Object beginning the chain. Must be initialized.
		@param keys: List of strings giving the keys.
		@param init_value: Optional. Value to set the end of the chain to, if
			it did not exist. If the chain did exist, this parameter is ignored.
			Defaults to {}.
		@return The value of the last link of the chain after the initialization.
		
		You may optionally replace the "keys" parameter with multiple arguments,
		all strings, instead of an array of strings. However, this does not
		allow you to specify the init_value parameter; it will always be {}
		if you use this calling format.
		
		Example run from Chrome console:
		> x = {}
		Object {}
		> AoPS.Ebooks.Utils.initKeyChain(x, ['y', 'z'], 3)
		3
		> x
		Object {y: Object}
		> x.y
		Object {z: 3}
		> x.y.z
		3
		> AoPS.Ebooks.Utils.initKeyChain(x, ['y', 'z'], 16384)
		3
		> x.y.z
		3
	*/
	Utils.initKeyChain = function (obj, keys, init_value) {
		// Support both ways of specifying arguments.
		if (!_.isArray(keys)) {
			keys = _.toArray(arguments).slice(1);
			init_value = {};
		// Use {} as default init_value.
		} else if (_.isUndefined(init_value)) {
			init_value = {};
		}
		
		return _.reduce(keys, function (curr_obj, key, i) {
			var at_end = (i === keys.length - 1);
			// If the key does not exist, initialize to either the empty object
			// or the provided initial value, based on whether we're at the end
			// of the key list.
			var next_value = at_end ? init_value : {};
			
			if (!curr_obj.hasOwnProperty(key)) {
				curr_obj[key] = next_value;
			}
			return curr_obj[key];
		}, obj);
	};
	
	/**
		class Utils.Class
		
		A simple Javascript class implementation that mimics the usage pattern
		of Backbone's extend, albeit not a total copy.
		- The extend method here can be used on derived classes, so chains
			of derived classes of any length are possible.
		- It correctly sets the prototype chain.
		- If an initialize method is found, it will be called on construction.
		- It does not accept the (silly) second argument for class/static
			properties that Backbone's extend method does.
		
		Usage:
		Multiplier = AoPS.Utils.Class.extend({
			getProduct : function (a,b) { return a * b; }
		});
	*/
	Utils.Class = (function(){
		var Class = function () {}; // Dummy constructor
		var makeExtend = function (BaseClass) {
			return function (props) {
				var new_proto;
				var DummyClass;
				var NewClass;
				
				// Javascript's prototype support is a bit dumb; if you have
				// an object, you can't use it as a prototype for a new one
				// without defining a constructor and setting the prototype
				// property.
				// We don't want to use a new BaseClass instance as the prototype,
				// because that calls the initialize method which is not the
				// specified behavior. So instead, we make a dummy no-op
				// constructor with the same prototype to bypass initialize.
				DummyClass = function () {};
				DummyClass.prototype = BaseClass.prototype;
				new_proto = new DummyClass();
				// The new prototype should get the extra data specified in
				// the argument to extend.
				_.extend(new_proto, props);
				
				// This is the subclass we return.
				NewClass = function () {
					// Forward constructor arguments to initialize.
					if (this.initialize) {
						this.initialize.apply(this, arguments);
					}
				};
				NewClass.prototype = new_proto;
				NewClass.extend = makeExtend(NewClass);
				return NewClass;
			};
		};
		
		Class.extend = makeExtend(Class);
		return Class;
	}());
	
	
	return Utils;
}(AoPS.Utils || {}));

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	},
	
}