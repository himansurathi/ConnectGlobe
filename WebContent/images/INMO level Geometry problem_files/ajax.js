
// Requires /assets/js/utils.js to be loaded

AoPS.Utils.initKeyChain(AoPS, 'Ajax');

// This module exports the handleError function and the ScriptRunner class.
AoPS.Ajax = (function(Ajax) {
	// Dependencies
	var Utils = AoPS.Utils;
	
	var AsyncQueue;
	var global_ajax_queue;
	
	/**
		function Ajax.handleError
		
		Contains common code for handling some of the cases that will cause an
		AJAX request to enter the $.ajax error callback. Used by ScriptRunner
		objects, but safe for usage elsewhere too.
		
		@param callback: A function taking two parameters. The first is a
			boolean saying whether the request succeeded, and the second is
			the object with the result of the AJAX call, which always has a
			response key, and will contain an error_code key if and only if the
			first parameter passed is false.
		@param xhr: XHR object. First parameter of $.ajax error callback.
		@param error_info: String with information about AJAX error.
			Second parameter of $.ajax error callback.
		@return None. But this method guarantees that the callback will be
			called (not necessarily with a failure).
	*/
	Ajax.handleError = function (callback, xhr, error_info) {
		/*jshint eqeqeq: false*/
		
		if (xhr.status == 200 && !xhr.responseText.length) {
			// JQUERY BUG: should be a success!
			callback(true, {response : {}});
			
		} else if (error_info === 'abort') {
			callback(false, {
				response: {},
				error_code : 'E_AJAX_CANCEL',
				error_msg : 'The request was cancelled by the calling code.'
			});
			
		} else if (error_info === 'timeout') {
			callback(false, {
				response : {},
				error_code : 'E_AJAX_TIMEOUT',
				error_msg : 'Something took too long to happen, and your browser gave up. ' +
					'Please check your internet connection, then try again.'
			});
			
		} else if (error_info === 'parsererror') {
			console.log(xhr.responseText);
			callback(false, {
				response : {},
				error_code : 'E_AJAX_BADRETURN',
				error_msg : 'You have come across a temporary error with our website. ' +
					'Please try again in an hour, and let us know if you continue to experience problems.'
			});
			
		} else if (xhr.status == 404) {
			callback(false, {
				response : {},
				error_code : 'E_AJAX_404',
				error_msg : 'The requested script does not exist.'
			});
			
		} else {
			callback(false, {
				response : {},
				error_code : 'E_AJAX_UNKNOWN',
				error_msg : 'Something went wrong. Please check your internet connection, then try again.'
			});
		}
	};
	
	
	/**
		class Ajax.AsyncQueue
		
		Internal to this module.
		
		A class for asynchronous queueing, ensuring only one thing is processed
		at a time. Call addToQueue with some data and a processFunction that can
		process it to have it begin processing.
		
		processFunction takes two arguments: the passed data, and the AsyncQueue
		object that's running it.
		
		The processFunction is presumably asynchronous. But it must guarantee a
		call to its AsyncQueue's checkQueue method no matter what, or the
		entire queue gets locked up for good. This sensitive constraint is
		why this class isn't currently exported.
	*/
	AsyncQueue = Utils.Class.extend({
		
		initialize : function () {
			this.processing_id = 0;
			this.processing_xhr = null;
			this.next_id = 1;
			
			// Array of ID numbers waiting to process.
			this.queue_id_list = [];
			// Table of queue id: queue node.
			this.queue_table = {};
		},
		
		getRunningId : function () {
			return this.processing_id;
		},
		
		// Check the queue for anything new to process.
		checkQueue : function () {
			this.processing_id = this.queue_id_list.pop();
			this.processing_xhr = null;
			if (!this.processing_id) {
				this.processing_id = 0;
				return;
			}
			
			var queue_node = this.queue_table[this.processing_id];
			if (!queue_node) {
				// This ID isn't queued anymore. Try from the beginning.
				return this.checkQueue();
			}
			
			delete this.queue_table[this.processing_id];
			this.processing_xhr = queue_node.processFunction(queue_node.data, this);
		},
		
		// Cancel a queued entry by ID.
		cancelId : function (queue_id) {
			var node;
			if (this.queue_table[queue_id]) {
				// TODO: hack
				// If this is AjaxRunner calling, we can dig in for the callback
				node = this.queue_table[queue_id];
				if (node) {
					node.data.callback(false, {
						response: {},
						error_code : 'E_AJAX_CANCEL',
						error_msg : 'The request was cancelled by the calling code.'
					});
				}
				delete this.queue_table[queue_id];
				return true;
			} else if (this.processing_id === queue_id) {
				// TODO: hack
				// If this is the usual jquery xhr, we can abort the ongoing request.
				if (this.processing_xhr && this.processing_xhr.abort) {
					this.processing_xhr.abort();
					// fail handler will call checkQueue for us; do not call it here.
					return true;
				}
			}
			return false;
		},
		
		// Returns an ID that can be used to manipulate the queue entry. 0 if
		// this was not queued.
		addToQueue : function (queue_data, processFunction, at_front) {
			var queue_id = this.next_id;
			this.next_id += 1;
			
			this.queue_table[queue_id] = {
				data : queue_data,
				processFunction : processFunction
			};
			
			if (at_front) {
				this.queue_id_list.push(queue_id);
			} else {
				this.queue_id_list = [queue_id].concat(this.queue_id_list);
			}
			
			if (!this.processing_id) {
				this.checkQueue();
			}
			
			return queue_id;
		}
		
	});
	
	
	/**
		class Ajax.RepetitionFilter
		
		If you need to filter repeated inputs, send all of your inputs to an
		instance of this class. It detects when the same object has been sent
		to it within a short period of time and returns a value signalling
		not to accept that input.
		
		Used by the Ajax.ScriptRunner class to prevent running the same script
		multiple times, like if the user clicks a button a lot.
		
		Methods:
		sendToFilter(obj)
			Sends objects to the filter.
	*/
	Ajax.RepetitionFilter = Utils.Class.extend({
		
		/**
			method initialize
			
			Constructor.
			
			@param wait_time: The resolution of the filter in milliseconds. If
				no calls to the sendToFilter method are made in a block of time
				of this length, whether rejected or not, the history of
				recently sent items is cleared.
			@return None.
		*/
		initialize : function (wait_time) {
			this.recent_inputs = [];
			this._clearRecentDebounced = _.debounce(_.bind(function () {
				this.recent_inputs = [];
			}, this), wait_time);
		},
		
		/**
			method sendToFilter
			
			Sends an object to the filter and checks if it has been received
			recently. Returns whether it was filtered as a repeat or not.
			
			@param obj: The object to filter. Can be any datatype for which
				a deep comparison is possible. Currently _.isEqual is used for
				the comparison.
			@return Boolean. False if the object was filtered, true otherwise.
		*/
		sendToFilter : function (obj) {
			var is_repeat;
			
			is_repeat = _.some(this.recent_inputs, function (input) {
				return _.isEqual(obj, input);
			});
			
			this._clearRecentDebounced();
			
			if (!is_repeat) {
				this.recent_inputs.push(obj);
			}
			return !is_repeat;
		}
		
	});
	
	
	/**
		Create a global queue shared by this module, so that by default all
		AJAX calls made through any ScriptRunner are done one-at-a-time.
	*/
	global_ajax_queue = new AsyncQueue();
	
	/**
		Function used by script runners as the AsyncQueue processor, after a
		partial application that sets the first argument. Returns the
		XmlHttpRequest object.
		Internal to this file for now.
	*/
	function ajaxProcessFunction (script_runner, run_data, queue_object) {
		var ajax_data = run_data.ajax_data;
		var callback = run_data.callback;
		var timeout = run_data.timeout || script_runner.timeout;
		if (run_data.action) {
			ajax_data.a = run_data.action;
		}
		// Debugging data about the AoPS session
		if (AoPS.session) {
			ajax_data.aops_logged_in = AoPS.session.logged_in;
			ajax_data.aops_user_id = AoPS.session.user_id;
		}
		
		// If we're not using a queue, make checking the queue a no-op.
		if (!queue_object) {
			queue_object = { checkQueue : function () {} };
		}
		
		return $.ajax({
			url : script_runner.script_path,
			data : ajax_data,
			dataType : 'json',
			type : 'POST',
			timeout : timeout,
			error : function (xhr, error_info) {
				queue_object.checkQueue();
				Ajax.handleError(callback, xhr, error_info);
			},
			success : function (data) {
				queue_object.checkQueue();
				
				var ok = !data.hasOwnProperty('error_code');
				
				callback(ok, data);
				
				_.each(script_runner.global_handlers, function (handler) {
					handler(ok, data);
				});
			}
		});
	};
	
	/**
		class Ajax.ScriptRunner
		
		An AJAX class for managing the running of an AJAX script. It contains a
		substantial amount of boilerplate for $.ajax parameters and error
		handling. It also implements queueing so that only one AJAX call
		happens at a time, which will avoid destroying sessions if aops3 is
		anything like aops2/liz was. Queue settings can be specified in the
		constructor.
		
		It also implements a filter. If a call to run with the same first two
		parameters is repeated within a duration, only the first call will be
		accepted. The duration can be specified with the filter_interval
		constructor option.
		
		Usage:
		runner = new AoPS.Ajax.ScriptRunner('/m/sample/ajax.php');
		runner.run('an_action', {some: 'data'}, function (ok, data) {
			console.log(ok ? 'Success!' : 'UH OH');
		});
		
		Methods:
		run(action, ajax_data, callback)
			Run the script passed into the constructor with the given data.
			Call the callback when done.
	*/
	Ajax.ScriptRunner = Utils.Class.extend({
		/**
			method initialize
			
			Constructor.
			
			@param script_path: A string giving the path to the script. Should
				start with a slash and give the path from the home directory,
				e.g. '/m/sample/ajax.php'.
			@param options: Optional. An object specifying options about how
				this class should work. The options you can specify are:
				timeout: defaults to 20000
					The time in milliseconds until AJAX requests should timeout.
					Used as the timeout value in $.ajax.
				filter_interval: defaults to 500
					The time in milliseconds to wait before accepting the same
					call again. See the class documentation for details on the
					filter. Set to 0 to not use the filter.
				separate_queue: defaults to false
					Normally all instances of this class share a calling queue
					internal to the module, so even if multiple ScriptRunner
					objects are made the AJAX calls are all still one-at-a-time.
					If for some reason you want this object to be given its
					own separate queue, set this to true.
				use_queue: defaults to true
					Set to false to disable the queue entirely.
			@return None.
		*/
		initialize : function (script_path, options) {
			var filter_interval;
			
			options = options || {};
			
			this.script_path = script_path;
			
			this.global_handlers = [];
			
			this.timeout = 20000; // Default value
			// Check if provided timeout value is valid and use it if so
			if (_.isFinite(options.timeout) && options.timeout > 0) {
				this.timeout = options.timeout;
			}
			
			filter_interval = 500; // Default value
			// Check if provided filter_interval value is valid and use it if so
			if (_.isFinite(options.filter_interval)) {
				filter_interval = options.filter_interval;
			}
			if (filter_interval > 0) {
				this.filter_object = new Ajax.RepetitionFilter(filter_interval);
			}
			
			// Set up queueing, and make the queue object if needed.
			this.last_queue_id = 0;
			this.queue_object = global_ajax_queue;
			this.use_queue = options.hasOwnProperty('use_queue') ? !!options.use_queue : true;
			if (this.use_queue && options.separate_queue) {
				this.queue_object = new AsyncQueue();
			}
		},
		
		/**
			method addGlobalHandler
			
			Add a handler that is called after every Ajax request finishes, with
			the usual (ok, data) parameters. The handlers run in order of insertion,
			with the first inserted handler running first. All of them run after the
			callback provided to the run call.
			
			To deactivate a handler, use removeGlobalHandler and pass the same
			function object in.
			
			@param handler: A function taking (ok, data) parameters which is run
				after every finished Ajax request.
			@return Boolean. Whether the handler was successfully added. This will
				be false if you pass something in that is not a function.
		*/
		addGlobalHandler : function (handler) {
			if (!_.isFunction(handler)) {
				return false;
			}
			
			this.global_handlers.push(handler);
			return true;
		},
		
		/**
			method removeGlobalHandler
			
			Remove a handler added with addGlobalHandler. The provided handler should
			be triple equal (===) to the handler you are trying to remove.
			
			@param handler: A function previously passed to addGlobalHandler.
			@return Boolean. Whether a handler was removed or not as a result of
				this call.
		*/
		removeGlobalHandler : function (handler) {
			// Track length to compute the return value.
			var orig_length = this.global_handlers.length;
			
			this.global_handlers = _.reject(this.global_handlers, function (h) {
				return h === handler;
			}, this);
			
			return (this.global_handlers.length < orig_length);
		},
		
		/**
			method getLastQueueId
			
			Get an ID number corresponding to the position in the queue for the last
			call to the run method, which can be manipulated by other methods in this
			class. If the queue was not used or not needed for the last run call,
			no ID will have been assigned, and this function will return 0.
			
			Note that even if a positive number is returned, there is no guarantee
			that the request can be cancelled; it may have already finished.
			Pending requests will be removed, and ongoing requests will be aborted.
			Queue manipulation functions should be considered hints to the script
			runner to perform better and avoid doing needless requests, not something
			for crucial functionality.
			
			@return Number. Positive integer if the request was queued, 0 otherwise.
		*/
		getLastQueueId : function () {
			return this.last_queue_id;
		},
		
		/**
			method getRunningQueueId
			
			Get an ID number corresponding to the queue node whose request is running
			right now. If no request is running in the queue right now, this will
			return 0.
			
			This request can be cancelled; see cancelQueueId.
			
			@return Number. The queue ID for the running request, 0 if none or if
				the queue is not being used.
		*/
		getRunningQueueId : function () {
			if (this.use_queue && this.queue_object) {
				return this.queue_object.getRunningId();
			}
			return 0;
		},
		
		/**
			method cancelQueueId
			
			Cancel a request if it is still in the queue or running, given a queue ID
			as returned from a queue ID retrieval function above.
			
			A call to cancelQueueId using the return will abort the current request.
			The callback will be fired as an error with error_code equal to
			'E_AJAX_ABORT'. The queue will eventually begin running its next item,
			if any.
			
			If the queue ID is invalid or if the request completed already,
			nothing will be done, and the return will be false.
			
			@param queue_id: A number returned from getLastQueueId or getRunningQueueId.
			@return Boolean. Whether a request was cancelled with this call.
		*/
		cancelQueueId : function (queue_id) {
			if (this.use_queue && queue_id) {
				return this.queue_object.cancelId(queue_id);
			}
			return false;
		},
		
		/**
			method run
			
			Run an AJAX request, using the jQuery ajax function. If the
			ScriptRunner is using queueing, this method will run things through
			the queue.
			
			In addition to calling with multiple parameters, you also have the option
			to call with a single parameter being an object. The object should contain
			action, ajax_data, and callback keys, used to fill in the first three
			parameters. The remaining keys are used as options (4th parameter).
			
			@param action: A string giving the action to pass to the script.
				This value will overwrite the 'a' key of the ajax_data argument.
			@param ajax_data: Javascript object with data to pass to the script.
			@param callback: A function taking two parameters. The first is a
				boolean saying whether the request succeeded, and the second is
				the object with the result of the AJAX call. It always has a
				response key, and will contain an error key if and only if the
				first parameter passed is false.
			@param options: Optional. An object with custom options for this call of
				run. Possible keys are:
				timeout: Defaults to the value provided on construction. Providing
					a number here overrides the timeout duration for this specific call.
				no_filter: Defaults to false. If true, the repetition filter will never
					activate on this call.
				queue_at_front: Defaults to false. If true and the queue is being used,
					this call will be zoomed to the front of the queue.
				no_queue: Defaults to false. If true, run right now, possibly in
					parallel with another call.
			@return Boolean. Whether the call was accepted or not. Currently
				a rejection means it was filtered. If the return is true, then
				this method guarantees that the callback will be eventually
				called when the AJAX request finishes.
		*/
		run : function (action, ajax_data, callback, options) {
			// Allow first parameter to be an object with all parameters.
			if (_.isObject(action)) {
				return this.run(action.action, action.ajax_data, action.callback, action);
			}
			
			options = options || {};
			var filter_node = _.extend({a: action}, ajax_data);
			var queue_node = {
				action : action,
				ajax_data : ajax_data,
				callback : callback,
				timeout : options.timeout
			};
			var processNode = _.partial(ajaxProcessFunction, this);
			
			// Pass through the filter, if needed
			if (this.filter_object && !options.no_filter) {
				if (!this.filter_object.sendToFilter(filter_node)) {
					// Repeated call; filter out
					callback(false, {
						error_code : 'E_AJAX_FILTERED',
						error_msg : 'The same request was made recently, so this one was filtered.'
					});
					return false;
				}
			}
			
			// Sanity check the callback parameter.
			if (!_.isFunction(callback)) {
				console.log('WARNING: No callback provided for AJAX. Using no-op.');
				queue_node.callback = function () {};
			}
			
			if (this.use_queue && !options.no_queue) {
				// Queue up the node; the queue takes care of the rest.
				this.last_queue_id = this.queue_object.addToQueue(
					queue_node, processNode, options.queue_at_front
				);
			} else {
				// No queue, os process ourselves.
				processNode(queue_node);
				this.last_queue_id = 0;
			}
			return true;
		}
		
	});
	
	
	return Ajax;
}(AoPS.Ajax));
