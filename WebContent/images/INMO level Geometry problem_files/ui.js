/**
 * Various common Ui components
 *
 *
 * AoPS.Ui.buildTableRow (object)
 *	Build a single row of a table
 *
 * AoPS.Ui.buildTable (options)
 *	Build a table from data
 *  The options input object takes the following optional properties:
 *	header, footer, rows, table_id, table_class, sortable, sort_col, sort_order, sortList
 *  Requires : jquery.tablesorter
 *
 *
 * 	// TODO : put defaults parsing all in one place -- prepareOption
 *  Make that prepareOptions first thing called in every function that has options that need
 *   to be prepped.  Maybe put a flag on the options object to block doing this multiple times
 * Document how to set up things to do a replaceModal on a button click (demo below);
 * MAke demo described in my email
 */
 
if (!AoPS.hasOwnProperty('Ui') || !AoPS.hasOwnProperty('ui_main_loaded')) {
	AoPS.Ui = (function(Ui) {
		
		// Tweak added by Palmer to fix mobile devices and their address bars.
		// That is, the address bar can show/hide itself, changing the window height
		// without triggering a resize event and thus breaking some of our stuff.
		// This function periodically inspects the window height and triggers
		// a resize event if it changes.
		(function(){
			var last_height = $(window).height();
			setInterval(function () {
				var now_height = $(window).height();
				if (now_height != last_height) {
					last_height = now_height;
					$(window).trigger('resize');
				}
			}, 100);
			$(window).on('resize', function () {
				last_height = $(window).height();
			});
		}());
		
		/**
		 * Build a row for a table.
		 * 
		 * @param object with properties:
		 *    data array of HTML data for the cells
		 *    is_header boolean (optional, default false) tells us whether to make th or td
		 *
		 * Return jQuery object for a <tr> of a table.
		 */ 
		Ui.buildTableRow = function (options) {
			var $row = $('<tr/>'),
				options = _.defaults(options, {
					is_header : false
				});
				cell_type = options.is_header ? 'th' : 'td';
		
			_.each(options.data, function(cell) {
				$row.append($.parseHTML('<' + cell_type + '>' + cell + '</' + cell_type + '>'));
			});
		
			if (options.is_header) {
				$row.addClass('aops-no-sort');
			}
		
			return $row;
		}
	
	
		/**
		 * Build a table given data.
		 *
		 * Options:
		 *
		 * header (optional) : array of stuff to put in thead
		 * footer (optional) : array of stuff to put in tfoot
		 * rows (optional) : array of rows; each row is an array of cell HTML
		 * table_id (optional) : id to assign table
		 * table_class (optional) : class (or string with many classes) to assign table
		 * sortable (optional, default false) : boolean to tell if you want tablesorter run on this
		 * sort_on_build (optional, default false) : boolean to tell if you want tablesorter to sort the data initially.
		 * sort_col (optional, default 0) : initial sort column
		 * sort_order (optional, default asc) : initial sort order -- 'asc' or 'desc'
		 * sortList (optional): if you know how jQuery tablesorter works, you can assign the initial sortList
		 * repeating_header (optional, default 0) : number of content rows before each repeating header.
		 *      Must be at least 1 to make active
		 * 
		 * Requires: jquery.tablesorter
		 *
		 * Return : jQuery object for your table.
		 */
		Ui.buildTable = function(options) {
			var options, 
				$table, 
				$tbody,
				counter = 0,
				updating = false,
				skip_this_end = false,
				tablesorter_options;
		
			options = _.defaults(options, {
				sortable : false,
				table_id : '',
				sort_on_build : false,
				table_class : '',
				sort_col : 0,	
				sort_order : 'asc',
				repeating_header : 0
			});
		
			$table = $('<table/>', {
				id : options.table_id,
				'class' : options.table_class
			});
		
			$tbody = $('<tbody/>').appendTo($table);
		
			if (options.hasOwnProperty('footer')) {
				$('<tfoot/>').prependTo($table).append(Ui.buildTableRow({
					data : options.footer, 
					is_header : true
				}));
			}
		
			if (options.hasOwnProperty('header')) {
				$('<thead/>').prependTo($table).append(Ui.buildTableRow({
					data : options.header, 
					is_header : true
				}));
			}
		
			if (options.hasOwnProperty('rows')) {
				_.each(options.rows, function(row) {
					$tbody.append(Ui.buildTableRow({data : row}));
					counter++;
					// repeating header
				
					if (options.repeating_header > 0 && (counter % options.repeating_header === 0)) {
						$tbody.append(Ui.buildTableRow({
							data : options.header, 
							is_header : true
						}));
					}
				});// TODO : http://tablesorter.com/docs/example-triggers.html
				// That will allow me to remove and re-add the rows, I think
			}
		
			if (options.sortable) {
				$table.tablesorter(options.sort_on_build ? {sortList: options.hasOwnProperty('sortList') ? 
					options.sortList : [[options.sort_col, (options.sort_order === 'asc' ? 0 : 1)]]} : {});
				if (options.repeating_header > 0) {
					/**
					 * Some trickiness here: have to trigger the update before sorting, but this
					 *  triggers sortStart again, so we have to tell the second sortStart not to 
					 *  trigger yet again.  Of course, this makes sortEnd get triggered twice, too.
					 *  So, we have to be careful only to execute the re-insert at the second sortEnd.
					 */
					$table.bind('sortStart', function () {
						if (!updating) {
							updating = true;
							$tbody.find('.aops-no-sort').remove();
							// Need to trigger update any time you remove rows from a table.
							// I don't bother triggering again on re-add, since
							//  we'll just remove those before the next sort anyway.
							$table.trigger('update');
						} else {
							updating = false;
							skip_this_end = true;
						}
					});
					$table.bind('sortEnd', function () {
						if (!skip_this_end) {
							$tbody.find('tr:nth-child(' + (options.repeating_header) + 'n)').after(Ui.buildTableRow({
								data : options.header, 
								is_header : true
							}));
						} else {
							skip_this_end = false;
						}
					});
				}
			}
		
			return $table;
		};


	
		Ui.Flyout = (function(){
			// Returned object with the public interface
			var Flyout = {};
		
			// Private helper variables
			var timeout;
			var queue = []; // Contains {html, opts} objects.
			var default_opts = {
				width : 300,
				height : 150,
				'class' : "",
				time : 5000,
				animation_time : 1000,
				// Name of the function we call when a flyout is closed.  
				// 'close' or 'closeWithoutClearingQueue'
				close_function : 'close'
			};
			var current_opts; // Opts of currently displayed flyout.
		
			function checkFlyoutQueue () {
				if (!queue.length) {
					return;
				}
				var e = document.getElementById( "flyout" );
				if ( e && e.parentNode ) {
					return;
				}
			
				var node = queue.shift();
				displayHelper(node.html, node.opts);
			}
		
		
		
		
			/**
			 * Display a flyout. This will also clear anything in the queue.
			 * @param string html
			 * @param object opts
			 */
			Flyout.display = function ( html, opts ) {
				// Close any flyout that already exists
				Flyout.close();
			
				// Clear the queue
				queue = [];
			
				displayHelper(html, opts);
			};
			// Helper containing the meat of display which doesn't clear the queue.
			// Used internally by checkQueue to display the next node in the queue.
			function displayHelper ( html, opts ) {
				// Set up options
				opts = $.extend( {}, default_opts, opts );
				current_opts = opts;
			
				var div = document.createElement( "div" );
				div.id = "flyout";
				div.style.width = opts.width + "px";
				div.style.height = opts.height + "px";
				div.style.right = -opts.width + "px";
				div.className = opts['class'];
			
				div.innerHTML = '<div class="close" onclick="AoPS.Ui.Flyout.' + opts.close_function + '()"></div>' + html;
				document.body.appendChild( div );
			
				$( "#flyout" ).animate( { right : 0 }, opts.animation_time, function() {
					Flyout.timeout = setTimeout( function() {
						retractFlyout(opts);
					}, opts.time );
				} );
			}
			
			// Helper that animates the flyout off of the page,
			// then looks to animate the next flyout in the queue.
			function retractFlyout () {
				$( "#flyout" ).animate( { right : -current_opts.width }, current_opts.animation_time, function() {
					Flyout.timeout = 0;
					var e = document.getElementById( "flyout" );
					if ( e ) {
						e.parentNode.removeChild( e );
						checkFlyoutQueue();
					}
				} );
			}
		
			/**
			 * Queue a flyout to be displayed after all previously queued flyouts are done.
			 * @param string html
			 * @param object opts
			 */
			Flyout.queue = function (html, opts) {
				queue.push({html: html, opts: opts});
				checkFlyoutQueue();
			};
		
			/**
			 * Close the current flyout. This will also clear the queue.
			 */
			Flyout.close = function () {
				// Check if a timeout already exists
				if ( Flyout.timeout ) {
					clearTimeout( Flyout.timeout );
					timeout = 0;
				}
			
				// Clear the queue
				queue = [];
			
				// Check if flyout already exists, and remove
				var e = document.getElementById( "flyout" );
				if ( e && e.parentNode ) {
					e.parentNode.removeChild( e );
				}
			};
			
			
			/**
			 * Retract the current flyout, but next flyout in the queue will appear right after.
			 * Alternative function to close() when user tries to close a flyout.
			 */
			Flyout.closeWithoutClearingQueue = function () {
				if ( Flyout.timeout ) {
					clearTimeout( Flyout.timeout );
					timeout = 0;
				}
				
				retractFlyout();
			};
		
			return Flyout;
		}());


		/**
		 * AoPS.Ui.Modal controls modals for the AoPS site.
		 *  Note: The defaults are added in the appendDefaults method; that's where
		 *   to change defaults or add more.
		 *
		 * Lots of documentation in /private/docs/modals.php
		 *
		 * Bits documented just below here are internal methods/properties that are not
		 *   part of the public documentation.
		 *
		 * Properties
		 * 
		 * active_modals : array of modals that are now on-screen.  See below for details on modal object
		 * preloaded_modals : associative array of modals we already know.
		 * preloaded_domains : array of domains that are already loaded.
		 *
		 * Methods 
		 * 
		 * Mask Management
		 *	fitMasks()
		 *   	Fit the mask to the screen.
		 *
		 * Show/Create Modal
		 *
		 *  makeFramed$Object(options)
		 *   	Build an AoPS default framed object
		 *
		 *  setZIndices(modal) 
		 *   	Set the z-indices of a newly-shown modal
		 * 
		 *  prepareOptions(input, [options])
		 *      Prepare a modal's options argument.
		 *
		 *  appendDefaults(options) 
		 *      Add the default options to a modal's options argument.
		 *
		 *  parseForceResponse(modal)
		 *      Parse the force_response setting of a modal.
		 *
		 * 
		 * Close Modal
		 * 
		 *  removeModal(modal)
		 *      Support function for closeModal functions, removes a modal that has been
		 *      popped off the active_modals array.
		 *
		 *
		 * Preloading Functions
		 *  loadDomain(domain)
		 *   	Load a domain of modals.
		 *
		 *  markDomainLoaded(domain)
		 *   	Mark a domain loaded
		 *
		 *  isDomainLoaded(domain)
		 *   	Check if a domain is loaded.
		 *
		 *  fetchPreloadedModal(modal_id)
		 *   	Fetch a preloaded modal
		 *
		 *  loadModalFromDb(modal_id)
		 *		Load a particular modal from database.
		 *
		 *  addPreloadedModal(modal_id, modal_data, modal_domain)
		 *   	Add a modal to the preloaded_modals object
		 *
		 *  addPreloadedModals(modal_array) 
		 *   	Add an array of modals to preloaded_modals
		 *
		 * Other Methods
		 *  onScroll()
		 *   	What to do when user scrolls window (we may get rid of this)
		 *
		 *  makeHelp(input, [options]) 
		 *   	Make a ? button that will fire a modal when clicked.
		 * 
		 *
		 *
		 *
		 * Must come after bootstrapped data (AoPS.bootstrap_data).  Checks
		 *  AoPS.bootstrap_data.preloaded_modals (array of id,data pairs)
		 *  AoPS.bootstrap_data.preloaded_modal_domains  (array of strings)
		 */
		/**
		 *
		 * TODOS: 
		 *  Get this thing working properly on touch devices.
		 */

		 /** jQuery extension to throw an object on a mask **/ 
		$.fn.extend({
			/**
			 * Show this as a modal with no styling on it at all.
			 *
			 * @param optional obj with more parameters.
			 **/
			showUnstyledModal : function (obj) {
				var options = _.defaults({
					$obj : this
				}, (arguments.length > 0) ? arguments[0] : {});
			
				this.show();
			
				return AoPS.Ui.Modal.show$Object(options);
			},
		
			/**
			 * Show this as a modal with only the AoPS frame,
			 *  no styling on title, body, etc.
			 *
			 * @param optional obj with more parameters.
			 **/
			 showPlainModal : function (obj) {
				var options = _.defaults({
					body : this,
				}, (arguments.length > 0) ? arguments[0] : {});
			
				this.show();

				return AoPS.Ui.Modal.show(options);
			},
		
			/**
			 * Show this as a modal with header and footer styling set,
			 *  but no style on the body.
			 *
			 * @param optional obj with more parameters.
			 **/
			showPlainBodyModal : function (obj) {
				var options = _.defaults({
					body : this,
				}, (arguments.length > 0) ? arguments[0] : {});
			
				this.show();
			
				return AoPS.Ui.Modal.showPlainBody(options);
			},
	
			/**
			 * Show this as a modal with full Aops-style.
			 *
			 * @param optional obj with more parameters.
			 **/
			showModal : function (obj) {
				var options = (arguments.length > 0) ? arguments[0] : {};
			
				this.show();
			
				return AoPS.Ui.Modal.showMessage(this, options);
			},
	
			/**
			 * Show this as a modal with the aops-quick styling
			 *
			 * @param optional obj with more parameters.
			 **/
			showModalQuick : function (obj) {
				var options = (arguments.length > 0) ? arguments[0] : {};
			
				this.show();
			
				return AoPS.Ui.Modal.showMessageQuick(this, options);
			},
	
			/**
			 * Show this as the body of an alert that is framed,
			 *  but does not use the aops style on the body or the
			 *  alert buttons (or the title if you send on).
			 *
			 * @param optional obj with more parameters.
			 **/
			showPlainAlert : function (obj) {
				var options = _.defaults({
					body : this,
					type : 'alert'
				}, (arguments.length > 0) ? arguments[0] : {});
			
				this.show();
			
				return AoPS.Ui.Modal.show(options);
			},
		
			/**
			 * Show this as the body of an alert in the aops-quick style
			 *
			 * @param optional obj with more parameters.
			 **/
			showAlertQuick : function (obj) {
				var options = (arguments.length > 0) ? arguments[0] : {};
			
				this.show();
			
				return AoPS.Ui.Modal.showAlertQuick(this, options);
			},
		
			/**
			 * Show this as the body of an alert in the aops style
			 *
			 * @param optional obj with more parameters.
			 **/		
			showAlert : function (obj) {
				var options = (arguments.length > 0) ? arguments[0] : {};
			
				this.show();
			
				return AoPS.Ui.Modal.showAlert(this, options);
			},
		
		
			/**
			 * Clone this to a modal that has the aops modal frame but
			 *  no other styling.
			 *
			 * @param optional obj with more parameters.
			 **/	
			cloneToPlainModal : function (obj) {
				var clone = this.clone(true),
					options = _.defaults({
						body : clone,
						type : 'message',
					}, (arguments.length > 0) ? arguments[0] : {});
				clone.show();
			
				return AoPS.Ui.Modal.showPlain(options);
			},
		
			/**
			 * Clone this to a modal that has the aops modal frame but
			 *  no other styling.
			 *
			 * @param optional obj with more parameters.
			 **/	
			cloneToUnstyledModal : function (obj) {
				var clone = this.clone(true),
					options = _.defaults({
						$obj : clone
					}, (arguments.length > 0) ? arguments[0] : {});
			
				this.show();
			
				return AoPS.Ui.Modal.show$Object(options);
			},

			/**
			 * Clone this to an AoPS-styled modal
			 *
			 * @param optional obj with more parameters.
			 **/		
			cloneToModal : function (obj) {
				var clone = this.clone(true),
					options = _.extend({}, (arguments.length > 0) ? arguments[0] : {});
			
				clone.show();
			
				return AoPS.Ui.Modal.showMessage(clone, options);
			},

			/**
			 * Replace current modal with this as a modal with the Aops frame but
			 *  no other styling.
			 *
			 * @param optional obj with more parameters.
			 **/			
			replaceTopModalPlain : function (obj) {
				var options = _.defaults({
						body : this,
						frame_class : '',
						type : 'message',
					}, (arguments.length > 0) ? arguments[0] : {});
			
			
				var modal = AoPS.Ui.Modal.replace(options);
				this.show();

				return modal;
			},
		
		
			/**
			 * Replace current modal with this as a modal with no styling at all
			 *
			 * @param optional obj with more parameters.
			 **/			
			replaceTopModalUnstyled : function (obj) {
				var options = _.defaults({
						$obj : this,
						type : '$',
					}, (arguments.length > 0) ? arguments[0] : {});
			
				var modal = AoPS.Ui.Modal.replace(options);
				this.show();

				return modal;
			},
		
			/**
			 * Replace the top modal with this, has full Aops style.
			 *
			 * @param optional obj with more parameters.
			 **/			
			replaceTopModal : function (obj) {
				var options = _.extend({
						type : 'message',
						frame_class : 'aops-modal-standard',
						body : this
					}, (arguments.length > 0) ? arguments[0] : {});
			
				var modal = AoPS.Ui.Modal.replace(options);
				this.show();

				return modal;
			},
		});
	
		/** Counters for z-index and wrapper; outside Ui.Modal to keep it protected **/
		var modal_z = 100000;
		var wrapper_counter = 0;
		Ui.Modal = {
			/**
			 * Properties of each modal in the active_modals array:
			 *
			 * $mask : the background
			 * $wrapper : displayed obj is on this
			 * $obj : displayed object,
			 * options : options object used to create this modal
			 */
			active_modals : [],
		
			preloaded_domains : [],
		
			preloaded_modals : {},
		
			/** Start mask management functions **/		
		
			/**
			 * Get the mask and the wrapper to the correct dimensions.
			 *
			 * There's a bit of code at the end of this function that must be un-commented if 
			 *  we make the mask position:absolute.
			 */
			fitMasks : function() {		
				function resetMasks() {
					var win = {
							height : $(window).outerHeight(),
							width  : $(window).outerWidth()
						},
						current_max_width;
					
					// Take the submitted CSS dimension and turn it into pixels.
					function parseMaxDimension ( obj, dim ) {
						var css_dim = obj.options['max_' + dim];
					
						if (css_dim.substr(css_dim.length - 1, 1) === '%') {
							return Math.min(parseFloat(css_dim) / 100 * win[dim], obj.options.overall_max_width);
						} else {
							return Math.min(parseFloat(css_dim), obj.options.overall_max_width);
						}
					}
				
				
				
					_.each(this.active_modals, function (modal) {
						var max_width = modal.options.max_width * win['width'],
							max_height = modal.options.max_height * win['height'];
					
						/*modal.$mask.css({
							'width' : win['width'],
							'height' : win['height']
						});
						modal.$wrapper.css({
							'width' : win['width'],
							'height' : win['height']
						});*/
				
						max = {
							height : parseMaxDimension(modal, 'height'),
							width : parseMaxDimension(modal, 'width')
						};
					
						/**
						 * Here we check if the max-height is triggered.  If so,
						 *  we set the height to the max-height so that children will know what
						 *  height to be a percentage of.  If not, then we set the height to the
						 *  originally submitted CSS value.  (We do this by taking the max- off,
						 *  imposing the original values, and then computing the height and width and 
						 *  compare to the original maxes.)
						 *
						 * We also do the same for width.
						 */
						modal.$obj.css({
							'max-height' : '',
							'max-width' : ''
						});

						modal.$obj.css({
							'height' : modal.options.height,
							'width' : modal.options.width
						});
					
						// MUST DO WIDTH FIRST BECAUSE WIDTH AFFECTS HEIGHT
						_.each(['width', 'height'], function(dim) {
							// From PM: Rounding this fixes some waggling since the actual width
							// seems to dip above and below the max by about 0.2.
							var real_max = Math.round(max[dim]);
							if (modal.$obj[dim]() > real_max) {
								modal.$obj[dim](real_max);
							}
						});
					
						/**
						 * Here, we cap the max width at the overall_max_width setting, 
						 *  which we default to 1000px.  The +1 is me being anal about rounding issues.
						 **/
						if (max.width + 1 > modal.overall_max_width) {
							current_max_width = modal.overall_max_width + 'px';
						} else {
							current_max_width = modal.options.max_width;
						}
					
						// From PM: used to be 'max-width' : '1000px'. But this made the modal
						// decide it was okay to overflow off the screen at browser widths of
						// 320px. Trying to make the max-width responsive instead.
						var new_max_width = Math.min(1000, window.innerWidth - 12) + 'px';
						modal.$obj.css({
							'max-height' : modal.options.max_height,
							'max-width' : new_max_width
						});
					});
				}
			
				function makeFinalAdjustments() {
					$('body').toggleClass('modal-page-overflow', 
						($('body').height() > $(window).height()));
				
					_.each(this.active_modals, function(modal) {
						modal.$wrapper.css({
							'overflow' : 'hidden'
						});
					
						//Set the popup window to center
						// Discuss if we want to offset high by default
						modal.$obj.css({
							'position' : 'absolute'
						
						});
						// Can't combine these two css statements.  For some reason, outerWidth doesn't
						//  work properly if absolute is not set.
					
			
						modal.$obj.css({
							'top' : parseInt(Math.max(0, ($(window).height() - modal.$obj.outerHeight()) / 2 * 0.8)),
							'left' : parseInt(Math.max(0, ($(window).width() - modal.$obj.outerWidth()) / 2))
						});
					
					
						/*
						Bring this back if we change the $mask CSS back to position : absolute
						modal.$mask.css({
							top : $(window).scrollTop() + 'px',
							left : $(window).scrollLeft() + 'px'
						});
						*/
					});
			
				}
			
				resetMasks.apply(this);
				/**
				 * We do this twice because shrinking the window will make the browser think
				 *  a scrollbar should appear.  But then the scrollbar is no longer needed because the 
				 *  mask shrunk, so there's a little gap where the scrollbar would have been.  
				 *  We then resize again.  When the problem is caused by something other than the mask resizing, 
				 *  then we're just hosed.
				 */
				resetMasks.apply(this);
				
				/**
				 * ONE MORE TIME WITH FEELING!
				 *  We fire this once again because window.resize events are processed outside-in,
				 *  so we need to resize once more after everything is finished.
				 *  Life would be better with a trigger inside the resize event to tell us when it's done.
				 *  Then we could always take care of Zorro last.
				 *
				 * OMFG this is so stupid, but it works.
				 */
				setTimeout(_.bind(function () {	 
					resetMasks.apply(this);
					makeFinalAdjustments.apply(this);
				}, this), 5);
				makeFinalAdjustments.apply(this);
			},
		
			/** End mask management functions **/
		
			/** Start show/create modal functions **/
		
			/**
			 * Show a jQuery object as a modal.
			 * 
			 * @param object : See AoPS.Ui.Modal documentation to see how to define a modal with an object.
			 */
			show$Object : function (options) {
				var new_modal = {
					$wrapper : $('<div/>', {
						'class' : 'aops-modal-wrapper'
					}),
					$mask : $('<div/>', {
						'class' : 'aops-modal-mask'
					}),
					$obj : options.$obj, 
					options : this.appendDefaults(options)	
				}
				$('body').addClass('aops-modal-open');
				new_modal.$wrapper.append(new_modal.$obj);

				this.setZIndices(new_modal);

				$('body').append(new_modal.$mask);
				$('body').append(new_modal.$wrapper);

				if (new_modal.options.hasOwnProperty('onShow')) {
					// Do onShow on next tick - giving modal time to render
					setTimeout( function() { 
						new_modal.options.onShow();
					}, 1 );
				}
			
				this.active_modals.push(new_modal);
			
				this.setZIndices(new_modal);

				new_modal.$mask.fadeTo(options.mask_fade_in_speed, new_modal.options.mask_alpha);
			
				new_modal.$wrapper.fadeIn(options.mask_fade_in_speed, function () {
					if (options.type === 'alert') {
						if (options.focus_on_alert) {
							new_modal.$obj.find('button').first().focus();
						}
					}
				});
			
				if (new_modal.options.draggable && new_modal.$obj.draggable) {
					new_modal.$obj.draggable(new_modal.options.draggable_options);
				}
			
				/*if (new_modal.options.hasOwnProperty('onShow')) {
						new_modal.options.onShow();
					}
					Move the onShow event into fadeIn if we want it firing after the fade is finished.
					*/
			
				// Must do this after the fade so the fitMasks can see all the items in the DOM appropriately.
				// If there's wacky behavior in some browser, look here
			
				this.parseForceResponse(new_modal);
				// Must follow addition to active_masks
				this.fitMasks();
			
				if (("activeElement" in document) && !_.isUndefined(document.activeElement) && !_.isNull(document.activeElement)) {
					document.activeElement.blur();
				}
				if (new_modal.options.mathjax && window.MathJax) {
					MathJax.Hub.Queue(['Typeset', MathJax.Hub, new_modal.$obj[0]]);
				}
				new_modal.$obj.trigger('modal_shown');
                
                return new_modal;
			},
		

			/**
			 * Show a modal.
			 *
			 * @param string or object : id string of the modal or an object to describe the modal
			 *    See documentation atop the AoPS.Ui.Modal object for properties that describe a modal.
			 * @param object (optional) : if the first argument is a string (fetching
			 *    a pre-loaded modal), then we can send an optional object as 
			 *    second argument to overwrite or add options to preloaded modal.
			 */
			show : function (input) {
				var options;

				options = this.prepareOptions.apply(this, arguments);

				switch (options.type) {
					case '$':
						return this.show$Object(options);
					break;
				
					case 'unframed_html' : 
                        // PR: I'm not sure this ever worked.
						// $($.parseHTML(options.body)).showAopsModal(options);
						return $($.parseHTML(options.body));
					break;
				
					case 'ignore-loading' :
						/**
						 * If we are loading by id, and don't have that id
						 * on the front end, then prepareOptions will
						 * return the option type 'ignore-loading', and spawn
						 * a separate set of commands that will take over modal handling
						 */
					break;
				
					default:
						return this.show$Object(_.extend({
							$obj : this.makeFramed$Object(options)
						}, options));
					break;
				}
			},

		
			extFrameClass : function (class_name, obj) {
				return class_name + (obj.hasOwnProperty('frame_class') ? ' ' + obj.frame_class : '');
			},
		
			showPlain : function (obj) {
				return this.show(obj);
			},
		
			/**
			 * Automatically apply the standard AoPS quick modal style
			 **/
			showQuick : function (obj) {
				return this.show(_.defaults({
					frame_class : this.extFrameClass('aops-modal-standard aops-modal-quick', obj)
				}, obj)); 
			},
		
			/**
			 * Apply no standard style to the body, but use the standard header and footer.
			 **/
			showPlainBody : function (obj) {
				return this.show(_.defaults({
					frame_class : this.extFrameClass('aops-modal-plain-body', obj)
				}, obj));
			},
		
			/**
			 * Helper function to show a message quickly on the AoPS default frame.
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showMessage : function (message) {
				var type,
					obj = (arguments.length > 1) ? arguments[1] : {}; 
				
				type = obj.hasOwnProperty('buttons') ? 'buttons' : 'message';

				return this.show(_.extend({
					type : type,
					body : message,
					frame_class : this.extFrameClass('aops-modal-standard', obj)
				}, obj)); 
			},
		
		
			/**
			 * Helper function to show a message quickly on the AoPS default frame
			 *	in the aops-modal-quick style.
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showMessageQuick : function (message) {
				return this.showQuick(_.extend({
					type : 'message',
					body : message,
				}, (arguments.length > 1) ? arguments[1] : {})); 
			},
		
			/**
			 * Helper function to show an alert quickly on the AoPS default frame.
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showAlert : function (message) {
				var obj = (arguments.length > 1) ? arguments[1] : {}; 
			
				return this.show(_.extend({
					type : 'alert',
					body : message,
					frame_class : this.extFrameClass('aops-modal-standard', obj)
				}, obj)); 
			},
		
			/**
			 * Helper function to show an alert quickly on the AoPS default frame
			 *	in the aops-modal-quick style (for short alerts).
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showAlertQuick : function (message) {
				return this.showQuick(_.extend({
					type : 'alert',
					body : message
				}, (arguments.length > 1) ? arguments[1] : {})); 
			},
		
		
		
		
			/**
			 * Helper function to show a confirm modal on the AoPS default frame.
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 
			 * @param function for handling the confirm action	
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showConfirm : function (message, func) {
				var obj = (arguments.length > 2) ? arguments[2] : {}; 
			
				var modal = this.show(_.extend({
					type : 'confirm',
					body : message,
					onButtonClick : func,
					frame_class : this.extFrameClass('aops-modal-standard', obj)
				}, obj));
                modal.$obj.find('.aops-modal-btn').first().focus();

                return modal;
			},
		
			/**
			 * Helper function to show an alert quickly on the AoPS default frame
			 *	in the aops-modal-quick style (for short alerts).
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param function for handling the confirm action
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showConfirmQuick : function (message, func) {
				var modal = this.showQuick(_.extend({
					type : 'confirm',
					body : message,
					onButtonClick : func
				}, (arguments.length > 2) ? arguments[2] : {})); 
                modal.$obj.find('.aops-modal-btn').first().focus();

                return modal;
			},
		
		
			/**
			 * Helper function to show a buttons modal on the AoPS default frame.
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 
			 * @param array of {text, value}
			 * @param function for handling the confirm action	
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showButtons : function (message, buttons, func) {
				var obj = (arguments.length > 3) ? arguments[3] : {}; 
			
				return this.show(_.extend({
					type : 'buttons',
					buttons : buttons,
					body : message,
					onButtonClick : func,
					frame_class : this.extFrameClass('aops-modal-standard', obj)
				}, obj)); 
			},
		
			/**
			 * Helper function to show an alert quickly on the AoPS default frame
			 *	in the aops-modal-quick style (for short alerts).
			 *
			 * @param string|jQuery object|javascript DOM item : message to show 		
			 * @param array of {text, value}
			 * @param function for handling the confirm action
			 * @param options (optional) : See AoPS.Ui.Modal documentation.
			 */
			showButtonsQuick : function (message, buttons, func) {
				return this.showQuick(_.extend({
					type : 'buttons',
					buttons : buttons,
					body : message,
					onButtonClick : func
				}, (arguments.length > 3) ? arguments[3] : {})); 
			},
		
			/**
			 * Make an object that is on the AoPS default frame structure.  Note that 
			 *  this makes the modal scrollable as necessary.
			 *
			 * @param object : See AoPS.Ui.Modal documentation for how to define a modal.
			 * @return jQuery object with AoPS default frame.
			 */
			makeFramed$Object : function (options) {
				var $buttons = null,
					$footer = null,
					$title = null,
					$framed,
					$inner_wrapper,
					self = this,
					$obj = $('<div/>', {
						'class' : options.scrollable ? 'aops-scroll-content' : 'aops-modal-noscroll'
					});
			
				$framed = $($.parseHTML('<div class="aops-modal-frame"></div>'));
				$inner_wrapper = $($.parseHTML('<div class="aops-modal-content-wrapper"></div>'));
				$framed.append($inner_wrapper);
				if (options.scrollable) {
					$inner_wrapper.append($.parseHTML('<div class="aops-scroll-outer">\
						<div class="aops-scroll-bar"><div class="aops-scroll-slider"></div></div>\
						<div class="aops-scroll-inner"></div></div>'));
					$obj.addClass('aops-scroll-content');
					$inner_wrapper.find('.aops-scroll-inner').append($obj);
					$inner_wrapper.find('.aops-scroll-bar').buildAopsScrollbar({
						$content : $obj,
						axis : options.scroll_axis
					});
					if (options.scroll_axis === 'y') {
						$framed.addClass('aops-modal-vert-scroll');
					} else {
						$framed.addClass('aops-modal-horiz-scroll');
					}
				} else {
					$inner_wrapper.append($obj);
				}
				/*
				$framed = $($.parseHTML('<div class="aops-modal-frame"><div class="aops-scroll-outer"> \
					<div class="aops-scroll-bar"><div class="aops-scroll-slider"></div></div>\
					<div class="aops-scroll-inner"></div></div></div>'));
				$obj.addClass('aops-scroll-content');
				$framed.find('.aops-scroll-inner').append($obj);
				$framed.find('.aops-scroll-bar').buildAopsScrollbar({
					$content : $obj
				});
				*/
				/**
				 * @param object with properties:
				 *  text: Text to show
				 *  value : Value for button
				 *  original button options
				 * @return jQuery object of a <button>
				 */
				function constructButton(button) {
					return $('<button/>', {
						'class' : 'aops-modal-btn btn btn-primary',
						'text' : button.text
					}).on('click', function(e) {
						if (button.options.hasOwnProperty('onButtonClick') && button.hasOwnProperty('value')) {
							button.options.onButtonClick(button.value);
						}
						if (button.options.close_on_button_click) {
							self.closeTopModal();
						}
						// Stop click propagation to wrapper.
						// Don't remove this.
						e.stopPropagation();
						e.preventDefault();
						return false;
					});
				}	
				
			
			
				if (options.hasOwnProperty('title')) {
					$title = $('<div/>', {
						'class' : 'aops-modal-title',
						html : options.title
					});
					$inner_wrapper.prepend($title);
				}
			
				if (options.hasOwnProperty('body')) {
					$obj.append($('<div/>', {
						'class' : 'aops-modal-body',
					}).append(options.body));
					/*if (typeof options.body === 'string') {
						$obj.append($('<div/>', {
							'class' : 'aops-modal-body',
							html : options.body
						}));
					} else {
						$obj.append($('<div/>', {
							'class' : 'aops-modal-body',
						}).append(options.body));
					}*/
				}
		
				if (['alert', 'confirm', 'buttons'].indexOf(options.type) > -1) {
					$buttons = $('<div/>', {
						'class' : 'aops-modal-buttons aops-modal-footer'
					}).appendTo($inner_wrapper);
			
					switch (options.type) {
						case 'alert':
							$buttons.append(constructButton.apply(this, [{
								text : options.alert_button_ok,
								value : true,
								options : options
							}]));			
						break;
					
						case 'confirm':
							$buttons.append(constructButton.apply(this, [{
								text : options.confirm_button_ok,
								value : true,
								options : options
							}]));
						
							$buttons.append(constructButton.apply(this, [{
								text : options.confirm_button_cancel,
								value : false,
								options : options
							}]));
						break;
					
						case 'buttons':
							_.each(options.buttons, function (button) {
								$buttons.append(constructButton.apply(self, [{
									text : button.text,
									value : button.value,
									options : options
								}]));
							});
						break;
					}
				} else if (options.hasOwnProperty('footer')) {
					$footer = $('<div/>', {
						'class' : 'aops-modal-footer',
						html : options.footer
					}).appendTo($inner_wrapper);
				}
			
			
				if (options.closeX) {
					$('<a/>', {
						'class' : 'aops-close-x clickable'
					}).appendTo($inner_wrapper).on('click', function() {
						if (options.onClickX()) {
							self.closeTopModal();
						}
					});
				}
			
				if (options.hasOwnProperty('frame_class')) {
					$framed.addClass(options.frame_class);
				}
			
				if (!_.isNull($title)) {
					$framed.addClass(($framed.find('.aops-modal-footer').length > 0 ? 'top-and-bottom' : 'top-only'));
				} else if ($framed.find('.aops-modal-footer').length > 0) {
					$framed.addClass('bottom-only');
				}
			
				$framed.css({
					'max-height' : options.max_height,
					'max-width' : options.max_width,
					'height' : options.height,
					'width' : options.width
				});
			
				return $framed;
			},
		
			/**
			 * Set the z-indices of this modal.  We just keep going up and up!
			 */
			setZIndices : function (modal) {
				modal.$mask.css({
					'z-index' : modal_z++
				});
				modal.$wrapper.css({
					'z-index' : modal_z++
				});
			},

			/**
			 * Prepare the modal options object.
			 * @param string or object : id string of the modal or an object to describe the modal
			 *    See documentation atop the AoPS.Ui.Modal object for properties that describe a modal.
			 * @param object (optional) : if the first argument is a string (fetching
			 *    a pre-loaded modal), then we can send an optional object as 
			 *    second argument to overwrite or add options to preloaded modal.
			 */
			prepareOptions : function (input) {
				var options;
				if (typeof input === 'string') {
					options = this.fetchPreloadedModal(input);
					if (_.isUndefined(options)) {
						// If we don't have have the modal already on the front end,
						// fetchPreloadedModal will have to go to the database.  It 
						// will take over from there.  We return type 'ignore-loading' 
						// to tell show() to skip this one.
						return {
							'type' : 'ignore-loading'
						};
					}
					if (arguments.length === 2) {
						options = _.defaults(arguments[1], options);				
					}
				} else {
					options = input;
				}
				// PUT THE DEFAULTS PARSING HERE.
			
				return this.appendDefaults(options);
			},

			/** 
			 * Append the default options for a modal to the modal's options object.
			 */
			appendDefaults : function (options) {			
				if (options.hasOwnProperty('defaults_parsed') &&
						options.defaults_parsed) {
					return options;
				} else {
					return _.extend({
						defaults_parsed : true,
						focus_on_alert : true, // only used for type alert
						max_width : '80%',
						max_height : '80%',
						width : '',
						height : '',
						frame_class : '',
						mask_alpha : 0.4,
						kill_phrase : '',
						mask_fade_in_speed : 200,
						overall_max_width : 1000,
						force_response : false,
						mathjax : false,
						closeX : true,
						draggable : false,
						draggable_options : {},
						scrollable : false,
						scroll_axis : 'y',
						close_on_button_click : true,
						alert_button_ok : 'OK',
						confirm_button_ok : 'OK',
						confirm_button_cancel : 'Cancel',
						onClickMask : function () {
								return true;
							},
						onClickX : function () {
								return true;
							},
					}, options);
				}
			},
		
			/**
			 * Parse the force_response setting of a modal, setting the click 
			 *  behavior for the wrapper of a modal.
			 *
			 * @param object : modal object.
			 */
			parseForceResponse : function (modal) {
				var processing_click;
			
				// Needs to be outside the stuff below so that stacking,
				//  replaceTopModal, etc. don't inherit old wrapper click actions.
				//  There might be edge cases where we want to inherit, in which
				//  case we'll need something different here.
				modal.$wrapper.off('click.wrapper');
			
				if (!modal.options.force_response) {
					modal.$obj.data('clicked_modal', false);
					modal.$obj.on('click.modal', function () { // add .modal to click?
						// If we click on what's on the mask, we don't want to auto-close.
						// So, we register that click on the object on the mask
						// Assumes that we'll bubble small to large, which seems to be the case
						// where I've tested, and is the only sensible way for this to work.
						modal.$obj.data('clicked_modal', true);
					});
					modal.$wrapper.on('click.wrapper', _.bind(function (e) {// add .modal to click?
						if (modal.$obj.data('clicked_modal')) {
							modal.$obj.data('clicked_modal', false);
						} else {
							modal.$obj.data('clicked_modal', false);
							if (modal.options.onClickMask()) {
								this.closeTopModal();
								modal.$obj.off('click.modal');
							}
						}
					}, this));
				} else {
					modal.$obj.off('click.modal');
				}
			},
		
			/** End show/create modal functions **/
		
			/** Start close modal functions **/
		
			/**
			 * Take away the top modal.
			 */
			closeTopModal : function () {
				var top_modal;
			
				if (this.active_modals.length == 0) {
					return;
				}
			
				top_modal = this.active_modals.pop();
			
				if (top_modal.options.hasOwnProperty('replace_with')) {
					this.active_modals.push(top_modal);
					this.replaceTopModal(top_modal.options.replace_with);
					return;
				}
			
				this.removeModal(top_modal);
			
				if (this.active_modals.length === 0) {
					$('body').removeClass('aops-modal-open');
					$('body').removeClass('modal-page-overflow');
				}
			},
		

			/**
			 * Close those modals with the submitted phrase as the kill phrase
			 *
			 * @param string
			 **/
			applyKillPhrase : function (phrase) {
				var n_modals = this.active_modals.length,
					i;
				for (i = n_modals - 1; i >= 0; i--) {
					if (this.active_modals[i].options.kill_phrase === phrase) {
						this.closeParticularModal(this.active_modals[i]);
					}
				}
			},

			/**
			 * Close a particular modal, no matter where it is in the modal stack.
			 *
			 * @param object member of the this.active_modals array
			 **/
			closeParticularModal : function (modal) {
				this.active_modals = _.without(this.active_modals, modal);
				this.removeModal(modal);
				if (this.active_modals.length === 0) {
					$('body').removeClass('aops-modal-open');
					$('body').removeClass('modal-page-overflow');
				}
			},

			/**
			 * Is there a modal on-screen now?
			 **/
			isModalVisible : function () {
				return !(this.active_modals.length === 0);
			},
		
		
			/**
			 * For replaceTopModal and makeHelp, we want to add a default frame_class
			 *  before going on to build the modal.  But we don't know if the input
			 *  parameters were (string, obj), (obj), or (string).  
			 *
			 * Here, we address all three possibilities by creating a new 
			 *  set of input arguments in which the desired class_to_add
			 *  is tacked on to the Modal options object.
			 *
			 * If we totally abandon pre-loaded modals, we can make this a lot easier.
			 *
			 * @param string class to add.
			 * @param string|object first argument passed to replaceTopModal or makeHelp
			 * @param array Arguments array passed to replaceTopModal or makeHelp
			 * @return array modified arguments array with the target class added.
			 **/
			appendClassToInput : function (class_to_add, input, input_arguments) {
				var options_index = 1;
			
				if (typeof input !== 'string') {
					obj = input;
					options_index = 0;
				} else if (input_arguments.length === 2) {
					obj = input_arguments[1];
				} else {
					obj = {};
				}
			
				obj.frame_class = this.extFrameClass(class_to_add, obj);
			
				input_arguments[options_index] = obj;
			
				return input_arguments;
			},
		
			/**
			 * Replace the top modal with the submitted modal, using the aops-modal-standard style
			 **/
			replaceTopModal : function (input) {
				var input_arguments;

				input_arguments = this.appendClassToInput('aops-modal-standard', input, arguments);
			
				input_arguments[0] = _.extend({
					mask_fade_in_speed : 0
				}, input_arguments[0]);
			
				this.replace.apply(this, input_arguments);
			},

			/**
			 * Replace the top modal with the submitted modal, using the aops-modal-standard and aops-modal-quick styles
			 **/
			replaceTopModalQuick : function (input) {
				var input_arguments = this.appendClassToInput('aops-modal-standard aops-modal-quick', input, arguments);
			
				input_arguments[0] = _.extend({
					mask_fade_in_speed : 0
				}, input_arguments[0]);
			
				this.replace.apply(this, input_arguments);
			},
		
			replaceOrShow : function (input) {
				if (this.active_modals.length > 0) {
					return this.replaceTopModal(input);
				} else {
					return this.show(input);
				}
			},
		
			replaceOrShowQuick : function (input) {
				if (this.active_modals.length > 0) {
					return this.replaceTopModalQuick(input);
				} else {
					return this.showQuick(input);
				}
			},
		
			/**
			 * Replace the top modal with the submitted modal, using the aops-modal-standard style
			 **/
			replaceTopModalPlain : function (input) {
				this.replace.apply(this, arguments);
			}, 
		
			/**
			 * Replace the obj on this modal with a new object, unstyled.
			 *  Use this to keep the mask in place and just replace the object
			 *  on it.
			 *
			 * @param string or object : id string of the modal or an object to describe the modal
			 *    See documentation atop the AoPS.Ui.Modal object for properties that describe a modal.
			 * @param object (optional) : if the first argument is a string (fetching
			 *    a pre-loaded modal), then we can send an optional object as 
			 *    second argument to overwrite or add options to preloaded modal.
			 */
			replace : function (input) {
				var options,
					modal,
					old_modal = this.active_modals.pop();
			
				// Clip off the modal, pass the rest of the arguments
				modal = _.defaults({
					options : this.prepareOptions.apply(this, arguments)
				}, old_modal);
				//modal.options = this.prepareOptions.apply(this, arguments);
			
				old_modal.$obj.detach();
			
				switch (modal.options.type) {
					case '$':
						modal.$obj = modal.options.$obj;
					break;
				
					case 'unframed_html' : 
						modal.$obj = $($.parseHTML(modal.options.body));
					break;
				
					default:
						modal.$obj = this.makeFramed$Object(modal.options);
					break;
				}
				modal.$wrapper.hide();
				modal.$wrapper.append(modal.$obj);
				this.active_modals.push(modal);
			
				this.parseForceResponse(modal);
			
			
			
				modal.$wrapper.fadeIn(modal.options.mask_fade_in_speed, function () {
					if (modal.options.type === 'alert') {
						if (modal.options.focus_on_alert) {
							modal.$obj.find('button').first().focus();
						}
					}
					if (modal.options.hasOwnProperty('onShow')) {
						// Do onShow next tick, giving modal time to render into DOM
						setTimeout( function() {
							modal.options.onShow();
						}, 1 );
					}
				});
			
				// Must follow addition to active_masks and follow fadeIn
				this.fitMasks();

                return modal;
			},
		
		
			/**
			 * Remove a modal 
			 *
			 * @param object in the active_modals array.
			 */
			removeModal : function (modal) {
				modal.$obj.detach();
				modal.$obj.off('click.modal');
			
				modal.$mask.remove();
				modal.$wrapper.remove();
				if (modal.options.hasOwnProperty('onClose')) {
					modal.options.onClose();
				}
			},
		
			/**
			 * close the next-to-top modal
			 */
			closePenultimateModal : function () {
				var kept_modal,
					removed_modal;
				if (this.active_modals.length < 2) {
					return;
				}
			
				kept_modal = this.active_modals.pop();
				this.removeModal(this.active_modals.pop());
				this.active_modals.push(kept_modal);
			},
		
			/**
			 * Close all active modals.
			 */
			closeAllModals : function () {
				if (this.active_modals.length > 0) {
					this.closeTopModal();
					this.closeAllModals();
				}		
			},

			/** End close modal functions **/

			/** Start preloading functions **/
		
			/** 
			 * Preload a domain of modals
			 *
			 * @param string : domain to load
			 */
			loadDomain : function (domain) {
				if (!this.isDomainLoaded()) {
					$.post('/ajax.php', {
						a : 'load_modal_domain',
						domain : domain
					}, _.bind(function (msg) {
						this.addPreloadedModals(msg.response);
					}, this), 'json');
				}
			},
		
			/**
			 * Mark a particular domain as loaded.  
			 *
			 * @param string : domain to mark loaded.
			 *
			 * Kept separate from loadDomain so we can mark domains 
			 *  loaded from bootstrap as loaded.
			 */
			markDomainLoaded : function (domain) {
				if (!this. isDomainLoaded()) {
					this.preloaded_domains.push(domain);
				}
			},
		
		
			/**
			 * Check if a particular domain has already been loaded.
			 *
			 * @param string : domain to check loaded.
			 */
			isDomainLoaded : function (domain) {
				return (this.preloaded_domains.indexOf(domain) > -1)
			},
		
		
			/**
			 * Fetch a preloaded modal.  If it's not there, then go get it from the database.
			 *
			 * @param string : id of the modal to load
			 */
			fetchPreloadedModal : function (modal_id) {
				if (this.preloaded_modals.hasOwnProperty(modal_id)) {
					return this.preloaded_modals[modal_id];
				} else {
					var modal = this.show({
						type : 'message',
						title : 'Now, where did we put that message?',
						mask_fade_in_speed : 20,
						body : 'The AoPS Ninja Squad has been called in to find the message that \
							should be here.  Back in a minute.',
						force_response : true,
						closeX : false		
					});
				
					this.loadModalFromDb(modal_id);
                    return modal;
				}
			},


			/**
			 * Load a particular modal from the database, or throw an error if it's not there.
			 *
			 * @param string id of modal
			 */
			loadModalFromDb : function (modal_id) {
				$.post('/ajax.php', {
					a : 'load_modal_id',
					modal_id : modal_id
				}, _.bind(function (msg) {
					if (!msg.response.hasOwnProperty('error')) {
						this.preloaded_modals[modal_id] = msg.response.data;
						this.replaceTopModal(modal_id);
					} else {
						if (msg.response.error === 'bad_modal_id') {
							this.replaceTopModal({
								type : 'alert',
								mask_fade_in_speed : 20,
								title : 'Uh-oh.',
								body : 'Someone messed up. I can\'t find the message I was supposed \
									to display here.  <br />I have sent an email to the AoPS \
									webmaster to let him know that he needs better minions.<br /> \
									<b> LARRY </b> : How should we log errors?',
								alert_button_ok : 'Take me back to what I was doing'
							});
						}
					}
				}, this), 'json');
			},

			/**
			 * Add a preloaded modal to the preloaded_modals object.
			 *
			 * @param string : id of the modal to load
			 * @param object : The object used to define the modal.
			 * @param string : domain of the modal.
			 */	
			addPreloadedModal : function (modal_id, modal_data) {
				if (!this.preloaded_modals.hasOwnProperty(modal_id)) {
					this.preloaded_modals[modal_id] = modal_data;
				}
			},
		
			/**
			 * Load a whole array of preloaded modals.
			 *
			 * @param array : Array of {id, data} pairs to describe the modals.
			 */
			addPreloadedModals : function (modal_array) {
				var self = this;
				_.each(modal_array, function (modal) {
					self.addPreloadedModal(modal.id, modal.data);
				});
			},
		
			/** End preloaded modal functions **/
		
			/** Start other functions **/
		
			/**
			 * Create a little help button that will fire a modal when clicked.
			 *  The modal will be in the Aops Standard Style.
			 *
			 * @param string or object : id or object to describe modal to show.
			 * @param object (optional) : if the first argument is a string (fetching
			 *    a pre-loaded modal), then we can send an optional object as 
			 *    second argument to overwrite or add options to preloaded modal.
			 */
			makeHelp : function (input) {	
				var input_arguments;
			
				input_arguments = this.appendClassToInput('aops-modal-standard', input, arguments);
			
				return $('<div/>', {
					'class' : 'aops-modal-help'
				}).on('click', _.bind(function() {
					this.show.apply(this, input_arguments);
				}, this));
			}
		
			/** End other functions **/
		}
	
		/** Set window resize and scroll actions.  We may get rid of the scroll thingy if
				we decide that just nuking the bars is fine. **/
		$(window).resize(function () {
			Ui.Modal.fitMasks();
		});
	
	
		/**
		 * Parse modals that are passed from bootstrap
		 */
		if (AoPS.hasOwnProperty('bootstrap_data')) {
			if (AoPS.bootstrap_data.hasOwnProperty('preloaded_modals')) {
				Ui.Modal.addPreloadedModals(AoPS.bootstrap_data.preloaded_modals);	
			}
		
			if (AoPS.bootstrap_data.hasOwnProperty('preloaded_modal_domains')) {
				_.each(AoPS.bootstrap_data.preloaded_modal_domains, function (modal_domain) {
					Ui.Modal.markDomainLoaded(modal_domain);
				});
			}
		}
	
		/** End AoPS.Ui.Modal **/

		/** Start AoPS.Ui.buildLoginConfirm **/
		Ui.buildLoginConfirm = function (message, obj) {
			var settings = {
					//'confirm_button_cancel' : 'Cancel',
					//'confirm_button_ok' : 'Log In / Join',
					'buttons' : [{
						text : 'Create Account',
						value : 2
					}, {
						text : 'Log In',
						value : 1
					}, {
						text : 'Cancel',
						value : 0
					}],
					'type' : 'buttons',
					'body' : message,
					'frame_class' : 'aops-modal-standard login-prompt-modal',
					'close_on_button_click' : false,
					'width' : '500px',
					'onButtonClick' : function (value) {
						if (value == 2) {
							window.location.href = '/user/register.php';
						} else if (value == 1) {
							if (AoPS.login.$login_form.length == 0) {
								window.location.href = '/user/login.php?redirect=' + encodeURIComponent(window.location.href);
							} else {
								AoPS.login.display();
							}
						} else {
							AoPS.Ui.Modal.closeTopModal();
						}
					}
				};
			if (arguments.length === 2) {
				settings = _.extend(settings, obj);
			};

			return AoPS.Ui.Modal.show(settings);
		};	
		
	
		/** End AoPS.Ui.buildLoginConfirm **/
	

		/** Start AoPS.Ui.buildAopsScrollbar **/
	
		/**
		 *
		 * SEE DEMO PAGES FOR UP-TO-DATE DOCUMENTATION.  
		 *
		 * The AopsScrollbar works by hijacking the browser's natural scroll
		 *  capacities for scrollable divs, but hiding the browser scrollbar and 
		 *  showing yours instead.  To pull this off, we put the content inside an 
		 *  inner_wrapper, and the inner_wrapper inside an outer_wrapper.  The outer_wrapper
		 *  is smaller than the inner_wrapper, with its overflow hidden.  The inner_wrapper
		 *  is the scrollable div with the content, but the outer_wrapper hides that scrollbar.
		 *  The scrollbar you construct is inside the outer_wrapper but outside the inner_wrapper.
		 *
		 * Required structure:
		 *	<div> <!-- outer_wrapper -->
		 *		<div> <!-- bar -->
		 *			<div class="aops-scroll-slider"></div> <!-- slider -->
		 *		</div>
		 *		<div> <!-- inner_wrapper -->
		 *			<div></div> <!-- content -->
		 *		</div>
		 *	</div>	
		 *
		 * Required CSS attributes
		 *   Adjust widths to heights and x's to y's as needed for horizontal scrolls  
		 * outer_wrapper:
		 *	position : relative
		 *	width : 20px narrower than inner_wrapper
		 *	overflow-x : hidden
		 *
		 * bar:
		 *	position : absolute;
		 *
		 * slider: (note to put class aops-scroll-slider on the slider)
		 *	position : relative;
		 *
		 * inner_wrapper:
		 *	position : relative;
		 *	overflow-y : scroll;
		 *  width : 20px more than outer_wrapper;
		 *  height : height of outerwrapper, modulo margins/paddings (TODO : figure those details out)
		 *
		 * content :
		 *  position : relative;
		 *  width : no wider than outer_wrapper (you won't see anything wider)
		 *
		 *
		 * Properties used to define a scrollbar:
		 * axis (optional, default 'y') : 'x' or 'y'
		 * $content (required) : div that holds the content you want to scroll around 
		 * fade_end_class
		 * fade_start_class
		 *
		 *
		 * hide_scrollbar : Hide the scroll bar when it isn't needed.
		 *
		 * onScroll (optional) : function to fire when you scroll
		 * $scrollbar (required) : jQuery object for the div that holds the scrollbar.
		 * show_on_hover (optional, default false) : only show the scrollbar when you hover over the window. 
		 * slider_end_tolerance (optional, default 10.5) : number of pixels slider must be within end of bar to trigger
		 *      end events (see triggers)
		 * 
		 *
		 * TODO: Throw error if missing any required items
		 *
		 * SEE NOTE IN adjustSlider for how we're using the minimum_slider_length
		 */

		Ui.buildAopsScrollbar = function (obj) {
			var priv = { // private data we don't want the outside world messing with
				slider_size : 0,
				bar_size : 0,
				min_slider_length : 12,
				slider_position : 0,
				is_scrollable : false,
				is_dragging : false,
				is_visible : false,
				'axis' : 'y',
				'loc' : 'top',
				'scroll_loc' : 'scrollTop',
				'size_f' : 'outerHeight',
				'autosize_client' : 'clientWidth',
				'autosize_f' : 'outerWidth',
				'is_draggable' : false,
				'hide_scrollbar' : true,
				'show_on_hover' : false,
				onScroll : undefined,
				onStopScroll : undefined,
				slider_end_tolerance : 10.5,
				content_size : -1,
				content_size_at_last_slider_end_check : 0,
				slider_now_at_end : false,
				slider_now_at_start : false,
				autosize : false,
				autosize_nudge : 0,
				autosize_bargutter : 22,
				autosize_exclusions : [],
				has_autosize_exclusions : false,
				fade_end_active : false,
				fade_start_active : false,
				activate_keys : true,
				stop_scroll_timeout_id : '',
				stop_scrolling_delay : 250,
				stop_scroll_propagation : false,
				onDragStart : function () {},
				onDragRelease : function () {},
				arrow_speed : parseInt(obj.$content.css('line-height'))
				/**
				 * We also add fade_end and fade_start to this list later.
				 */
			},
				aops_scroll,
				slider;
		
			if (!obj.hasOwnProperty('$scrollbar')) {
				console.log('You called AoPS.Ui.buildAopsScrollbar without setting $scrollbar.  Bad.  I quit.');
			}
			if (!obj.hasOwnProperty('$content')) {
				console.log('You called AoPS.Ui.buildAopsScrollbar without setting $ content.  Bad.  I quit.');
			}
		
		
			/**
			 * priv consists of protected properties of the scrollbar.  The user can
			 *  overwrite defaults upon initiation of the scrollbar.  The line below
			 *  picks these overwritten properties out of the initiation options 
			 *  and ignores the rest of the initiation options.
			 */
			priv = _.defaults(_.pick.apply({}, _.union([obj], _.keys(priv))), priv);

			if (priv.autosize_exclusions.length > 0) {
				priv.has_autosize_exclusions = true;
			}
			if (priv.axis === 'x') {
				priv = _.extend(priv, {
					'loc' : 'left',
					'scroll_loc' : 'scrollLeft',
					'size_f' : 'outerWidth',
					'autosize_client' : 'clientHeight',
					'autosize_f' : 'outerHeight'
				});
			}
			aops_scroll = {
				$slider : obj.$scrollbar.find('.aops-scroll-slider').first(),
				$bar : obj.$scrollbar,
				$outer_wrapper : obj.$scrollbar.parent(),
				$inner_wrapper : obj.$content.parent(),
				$content : obj.$content,
			
				get : function (property) {
					if (priv.hasOwnProperty(property)) {
						return priv[property];
					} else {
						return null;
					}
				},
			
				/**
				 * Adjust slider sets the slider's size and position based on the
				 *  the content and inner_wrapper's size and location.  We fire this
				 *  whenever the content scrolls.
				 */
				adjustSlider : function () {
					var inner_wrapper_size = this.$inner_wrapper[priv.size_f](), 
						content_size = this.$content[priv.size_f](),
						content_shift,
						fake_slider_size,
						inner_wrapper_pad = 0;

					priv.content_size = content_size;
						// Below was the inner_wrapper pad before we went to the new box model and 
						// using browser scrollbars.  Browser scrollbars push padding outside
						// the scrollable area, so you'll need a div wrapping around content in
						// order to put padding on the bottom of your scrolling area.  Grrr.
						//Math.floor(parseFloat(this.$inner_wrapper.css('padding-' + priv.loc)) + 0.5);

					// Open question: should the size functions be outerHeights?
								
					/**
					 * We're doing something a little crafty here.  
					 *
					 * We set a minimum length for the slider.  Let that length be MIN.
					 *  To get all the math straight, we then
					 *  pretend the bar is smaller by MIN.  We then compute the theoretical
					 *  length of the slider based on this smaller bar, and then add MIN
					 *  to the length of the slider for display only.  We do all the math
					 *  regarding positioning based on the adjusted bar length and the theoretically
					 *  correct (i.e. smaller) slider length.
					 */
					priv.bar_size = this.$bar[priv.size_f]() - priv.min_slider_length;
				
					// Figure out where the content is, adjust by the padding of the inner_wrapper
					content_shift = -1.0*(parseFloat(this.$inner_wrapper[priv.scroll_loc]()) - inner_wrapper_pad);
				
					// Compute the size of the slider: slider/scrollbar = inner_wrapper/content
					priv.slider_size = inner_wrapper_size / content_size * (priv.bar_size);
				
					fake_slider_size = inner_wrapper_size / content_size * (priv.bar_size) + priv.min_slider_length;
				
					// Adjust by the border of the slider; otherwise, if we set the slider's size to
					//  the computed slider_size above, the borders will be added on, thus making the slider
					//  too large.  That is, the slider's size on the screen is its height/width plus
					//  its borders -- that's what we are trying to set.
					this.$slider[priv.size_f](fake_slider_size - this.getBorderNudge());

					if (content_size <= inner_wrapper_size) {
						// Content too small for scrolling.
						priv.is_scrollable = false;
						this.$slider.css({display : 'none'});//hide();
						if (priv.hide_scrollbar) {
							this.setBarVisibility(false);
						}	
						priv.slider_position = 0;
					} else { // Time for some scrolling
						priv.is_scrollable = true;
						if (content_shift < 0) {
							// Check if scrollable assets are too far left/up.
							//  The 0.5 adjusts for rounding issues.
							if (content_shift + content_size < inner_wrapper_size) {
								priv.slider_position = priv.bar_size - priv.slider_size + 0.5;
							} else {
								// Keep the containers in place; position the slider
								priv.slider_position = -content_shift / content_size * priv.bar_size  + 0.5; 
							}
						} else { // Content not shifted at all
							priv.slider_position = 0;
						}

						this.$slider.css({display : 'block'});//.show();
						if (priv.show_on_hover && !priv.is_dragging) {
							// If show_on_hover set, then we only show the scrollbar if we're
							// hovering over the outer_wrapper
						
							if (this.$outer_wrapper.data('hovered')) {
								this.setBarVisibility(true);
							} else {
								if (priv.hide_scrollbar) {
									this.setBarVisibility(false);
								}
							}
						} else {
							this.setBarVisibility(true);
						}
					}
				
					if (priv.slider_position + priv.slider_size > priv.bar_size) {
						priv.slider_position = priv.bar_size - priv.slider_size;
					}
	//				priv.slider_position = Math.floor(priv.slider_position);
					this.$slider.css(priv.loc, priv.slider_position);

					this.checkSliderAtEnd();
				},
			
				setBarVisibility : function (is_visible) {
					this.$bar.toggle(is_visible);
					priv.is_visible = is_visible;
					this.$outer_wrapper.toggleClass('aops-scrollbar-visible', is_visible);
					this.$outer_wrapper.toggleClass('aops-scrollbar-not-visible', !is_visible);
					if (priv.autosize) {
						setAutosize();
					}
				},			
			
				/**
				 * Compute the borders of the slider, used to adjust the slider's height.
				 *  See adjustSlider() for details.
				 */
				getBorderNudge : function () {
					if (priv.axis === 'x') {
						return parseFloat(this.$slider.css('border-left-width')) + 
							parseFloat(this.$slider.css('border-right-width'));
					} else {
						return parseFloat(this.$slider.css('border-top-width')) + 
							parseFloat(this.$slider.css('border-bottom-width'));
					}
				},

				/**
				 * moveSlider moves the slider to the specified location, and then triggers the targets to move
				 *  accordingly.
				 *
				 * @param location : location to which the slider should be moved.
				 */
				moveSlider : function (location) {	
					priv.slider_position = (Math.min(Math.max(0, location), priv.bar_size - priv.slider_size));
					
					this.$slider.css(priv.loc, priv.slider_position);
					
					this.scrollTargets();
					// Make little adjustments to the slider to remove little flicker/nudge issues when
					//  the slider is at the end of the scrollbar (mainly we're just normalizing position
					//  between the two scroll types -- when the user slides the slider or uses the scrollwheel,
					//  we want the final position to be the same.
					this.adjustSlider();
				},

				/** 
				 *	Scroll the contents when the slider moves.  (There are two ways the scrolling can happen:
				 *   either the user interacts with our scrollbar, in which case the AoPS slider moves, and then
				 *   this function takes care of moving the content with the hidden browser's scrollbar.  Or,
				 *   the user scrolls the hidden scrollbar with a scrollwheel, and then we use adjustSlider to
				 *   move the slider after the content moves.
				 */
				scrollTargets : function () {
					var content_size = this.$content[priv.size_f]();
					priv.content_size = content_size;
					
					// Again, we use slider/scrollbar = inner_wrapper/content; the 0.5 is for rounding issues				
					this.$inner_wrapper[priv.scroll_loc](priv.slider_position * content_size / (priv.bar_size) + 0.5); 
					this.checkSliderAtEnd();
				},
			
				/**
				 * Check if the slider is at start or end of the scrollbar.
				 *  Fire events and show faders as necessary.
				 */
				checkSliderAtEnd : function() {
					var slider_pos = this.$slider.position()[priv.loc];
					/**
					 * This addresses what should happen in places where scrolling down triggers 
					 *  loading more of whatever.  When more is loaded, and the slider therefore
					 *  changes size, then we want the "slider_at_end" to not trigger again 
					 *  when we hit the bottom.  So, we have to turn off the marker of the
					 *  previous triggering.  Otherwise, a very fast scroll will
					 *  not trigger slider_at_end when we hit a second time.
					 **/
					if (priv.content_size_at_last_slider_end_check !== parseInt(priv.content_size)) {
						priv.slider_now_at_end = false;
						priv.content_size_at_last_slider_end_check = parseInt(priv.content_size)
					}
					
					/* Check slider at end */
					if (priv.slider_position > priv.bar_size - priv.slider_size - priv.slider_end_tolerance) {
						if (!priv.slider_now_at_end === true) {
							priv.slider_now_at_end = true;
							if (priv.is_visible) {
								this.$bar.trigger('slider_at_end');
							}
							if (priv.fade_end_active) {
								priv.$fade_end.css({display : 'none'});//hide();
							}
						}
					} else {
						priv.slider_now_at_end = false;

						if (priv.fade_end_active) {
							// Edge case : called when not ready.
							if (priv.bar_size < 0) {
								priv.$fade_end.css({display : 'none'});
							} else if (priv.is_visible) {
								priv.$fade_end.css({display : 'block'});//.show();
							} 
						}
					}

					/* check slider at start */
					if (priv.slider_position < priv.slider_end_tolerance) {
						if (!priv.slider_now_at_start === true) {
							priv.slider_now_at_start = true;
							if (priv.is_visible) {
								this.$bar.trigger('slider_at_start');
							}
						}
						if (priv.fade_start_active) {
							priv.$fade_start.css({display : 'none'});//.hide();
						} 
					} else {
						priv.slider_now_at_start = false;
						if (priv.fade_start_active) {
							priv.$fade_start.css({display : 'block'});//.show();
						}
					}

				}
			}



			/**
			 * Start the watchers
			 */

			/**
			 * logWatchingData logs all the features the scroll bar watches.  If any of these data change, then
			 *  we fire adjustBar() to resize and relocate the slider.
			 *
			 * We're looking for the size of the content or the scrollbar changing or for the position of the
			 *  content changing.  If any of these happen, then we reset the scrollbar to make sure it is
			 *  in the right place.
			 */
			function logWatchingData() {
				var target_loc = parseInt(aops_scroll.$content.first().position()[priv.loc]),
					bar_size = parseInt(aops_scroll.$bar[priv.size_f]()),//parseInt(aops_scroll.$bar[priv.size_f]()),
					target_size = parseInt(aops_scroll.$content.first()[priv.size_f]());
				aops_scroll.$bar.data('aops_scroll_' + priv.loc, _.isNaN(bar_size) ? 0 : bar_size);
				aops_scroll.$content.first().data('aops_scroll_' + priv.loc, 
					_.isNaN(target_size) ? 0 : target_size);
				aops_scroll.$content.first().data('aops_target_loc_' + priv.loc, 
					(_.isNaN(target_loc) && _.isUndefined(target_loc)) ? 0 : target_loc);
				
				if (priv.autosize) {
					aops_scroll.$outer_wrapper.data('aops_scroll_not_' + priv.loc, aops_scroll.$outer_wrapper[0][priv.autosize_client]);
				}
			
			}
			
			
			function isInAutosizeRange() {
				var len,
					width,
					i;
			
				if (priv.has_autosize_exclusions) {
					len = priv.autosize_exclusions.length;
					width = window.innerWidth; /* outerWidth? clientWidth? */
				
					for (i = 0; i < len; i++) {
						if (width >= priv.autosize_exclusions[i].min &&
						width <= priv.autosize_exclusions[i].max) {
							return false;
						}
					}
				}
			
				return true;
			}
		
			function setAutosize() {
				var outer_size,
					is_scrollable_active;
			
				// Sometimes we turn off the scrolling via CSS
				// by overriding the overflow property.
				is_scrollable_active = 
					(aops_scroll.$inner_wrapper.css('overflow-' + priv.axis) === 'scroll');
			
			
				if (is_scrollable_active && isInAutosizeRange()) {
					outer_size = aops_scroll.$outer_wrapper[0][priv.autosize_client];
				
	//				if (outer_size === 0) {
	//				aops_scroll.$inner_wrapper.toggle(outer_size > 0);
	//				}
					if (outer_size > 0) {
						aops_scroll.$inner_wrapper[priv.autosize_f](outer_size + priv.autosize_bargutter);
						if (!priv.is_visible) {
							aops_scroll.$content[priv.autosize_f](outer_size);
						} else {
							aops_scroll.$content[priv.autosize_f](outer_size - priv.autosize_nudge);
						}
					}
				} else {
					aops_scroll.$inner_wrapper[priv.autosize_f]('');
					aops_scroll.$content[priv.autosize_f]('');
				
				}
			}

			function checkAutosizeRecompute () {
				if (!priv.autosize) {
					return false;
				}
//				console.log(parseInt(aops_scroll.$outer_wrapper[0][priv.autosize_client]));
//				console.log(aops_scroll.$outer_wrapper.data('aops_scroll_not_' + priv.loc));
				return Math.abs(parseInt(aops_scroll.$outer_wrapper[0][priv.autosize_client]) - 
						aops_scroll.$outer_wrapper.data('aops_scroll_not_' + priv.loc)) > 0;
			
		
			}
			/**
			 * Here's where we check if anything has changed that should trigger a scrollbar
			 * repositioning.  (See logWatchingData() above.)
			 *
			 * Could also do this with setInterval at end of buildScrollbar rather 
			 *  than using setTimeout. 
			 */
			function checkBar () {
				if ( aops_scroll.$inner_wrapper.is(':visible') && 
					((Math.abs(parseInt(aops_scroll.$content.first()[priv.size_f]()) 
					- aops_scroll.$content.first().data('aops_scroll_' + priv.loc)) > 0) ||
						(Math.abs(parseInt(aops_scroll.$bar[priv.size_f]()) - 
						aops_scroll.$bar.data('aops_scroll_' + priv.loc)) > 0) ||
							(Math.abs(parseInt(aops_scroll.$content.first().position()[priv.loc]) 
							- aops_scroll.$content.first().data('aops_target_loc_' + priv.loc)) > 0)) ||
						(checkAutosizeRecompute())
						) {
	//				if (aops_scroll.$inner_wrapper.is(':visible')) {
						logWatchingData();
						aops_scroll.adjustSlider();
						if (priv.autosize) {
							setAutosize();
						}

	//				}
				}
				setTimeout( function () {
					checkBar();
				}, 200);
			}

			/**
			 * Chrome, and probably IE, doesn't apply the CSS early enough to get the line-height right, 
			 *  so we pick it up here.
			 */
			var look_away_hack_counter = 0;
			function checkInitSettings () {
				if (aops_scroll.$content.first().is(':visible')) {
					priv.arrow_speed = parseInt(aops_scroll.$content.first().css('line-height'));
					if (_.isNaN(priv.arrow_speed) || priv.arrow_speed < 1) {
						priv.arrow_speed = 10;
					}
					logWatchingData();
				} else {
					setTimeout( function () {
						if (look_away_hack_counter < 3) {
							checkInitSettings();
							look_away_hack_counter += 1;
						} else {
							priv.arrow_speed = 10;
							logWatchingData();
						}
					}, 1000);
				}
			}


			/**
			 * End watchers
			 */ 

			/**
			 * This gets the scroll action rolling.
			 */
			aops_scroll.$inner_wrapper.css('overflow-' + priv.axis, 'scroll');

			/**
			 * Whenever the inner_wrapper scrolls, we need to adjust the slider
			 */
			aops_scroll.$inner_wrapper.on('scroll.adjust_slider touchmove.adjust_slider', function (e) {
				aops_scroll.adjustSlider();
				/**
				 * Check for onScroll and onStopScrolling events, act accordingly.
				 */
				if (!_.isUndefined(priv.onScroll)) {
					priv.onScroll(e);
				}
				if (!_.isUndefined(priv.onStopScroll)) {
					window.clearTimeout(priv.stop_scroll_timeout_id);
					priv.stop_scroll_timeout_id = setTimeout(priv.onStopScroll, priv.stop_scrolling_delay);
				}
	
			});
		
			
			/**
			 * Here we prevent the scroll from propagating upward to the window
			 *  if the scroll box is at an end.  Only on demand.
			 * DOESN'T WORK WELL IN IE.  WE WILL LIVE WITH THAT.
			 */		
			if (priv.stop_scroll_propagation  && priv.axis === 'y'/* && aops_scroll.$inner_wrapper.is(':visible')*/) {
				aops_scroll.$inner_wrapper.on('mousewheel DOMMouseScroll', function (e) {
					var delta = Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail))),
						inner_height,
						content_height,
						scroll_loc = aops_scroll.$inner_wrapper[priv.scroll_loc]();
						/* Propagate is fine if the scrollbar isn't visible */
					if (!aops_scroll.$bar.is(':visible')) {
						return;
					}
				
					function adjustAndBlock() {
						aops_scroll.adjustSlider();
						e.preventDefault();
						e.stopPropagation();
						return false;
					}
				
					/* If we're at the top, stay there */
					if (delta > 0 && scroll_loc - delta < 0) {
						aops_scroll.$inner_wrapper[priv.scroll_loc](0);
						return adjustAndBlock();
					}
					inner_size = aops_scroll.$inner_wrapper[priv.size_f]();
					content_size = aops_scroll.$content[priv.size_f]();
				
					/* If we're at the bottom, stay there (I'm calling "at least 99% of the way there = all the way down"*/
					if (delta < 0 && (scroll_loc + inner_size)/content_size > 0.99) {
						/* I think the line below was present to prevent overruning the bottom,
						   but it causes a wiggle.  I'm not sure it's really needed to deal with
						   overrunning the bottom, since I'm not having that issue now.  I'll
						   leave it here, commented out, in case we want to revive it **/
						//aops_scroll.$inner_wrapper[priv.scroll_loc](-inner_size + content_size);
						aops_scroll.moveSlider(content_size - inner_size);
						return adjustAndBlock();		
					}
					/* Otherwise, the scroll event will be captured by inner_wrapper and processed there by
						the browser bar on the div, which doesn't allow propagation */
				});
			}
		
			/**
			 * Here we set the action for clicking on the scrollbar.  We move the slider to
			 *  the location of the click.
			 */
			aops_scroll.$bar.on('mousedown', function(e) {
				var coord = 'page' + priv.axis.toUpperCase(),
					click_dist = e[coord] - obj.$scrollbar.offset()[priv.loc];

				aops_scroll.moveSlider(click_dist - priv.slider_size / 2);
			
				e.stopPropagation();
				e.preventDefault();

			});
		
			aops_scroll.$bar.on('reset_end_watchers', function () {
				priv.slider_now_at_start = false;
				priv.slider_now_at_end = false;
			});
			
			/**
			 * Set the drag action on the slider
			 */
		 
			aops_scroll.$slider.on('mousedown touchstart', function (e) {
				var coord = 'page' + priv.axis.toUpperCase(),
					start_mouse_drag = (!e.originalEvent.hasOwnProperty('touches') ? 
							e[coord] : e.originalEvent.touches[0][coord]),
					start_target_drag = parseFloat(aops_scroll.$slider.position()[priv.loc]);
				// We set is_dragging here so that we don't accidentally hide the scrollbar
				//  should "show_on_hover" be set to true and the user slides the mouse 
				//  outside the outer_wrapper while trying to drag the slider.
				priv.is_dragging = true;

				$(document).bind('mousemove touchmove', function (ev) {			
					aops_scroll.moveSlider(start_target_drag + 
						(!ev.originalEvent.hasOwnProperty('touches') ? 
						ev[coord] : ev.originalEvent.touches[0][coord]) - start_mouse_drag);

					return false;
				}).bind('mouseup touchend', function (ev) {
					$(document).unbind('mousemove mouseup touchmove touchend');
					priv.is_dragging = false;

					if (obj.hasOwnProperty('end_f')) {
						obj.end_f();
					}

					aops_scroll.adjustSlider();
					ev.stopPropagation();
					ev.preventDefault();
				});	
				e.stopPropagation();
				e.preventDefault();
			});

			/**
			 * If draggable, set drag action on the inner window.
			 **/
			if (priv.is_draggable) {
				aops_scroll.$inner_wrapper.on('mousedown.drag', function (e) {
					var coord = 'page' + priv.axis.toUpperCase(),
						start_mouse_drag = (!e.originalEvent.hasOwnProperty('touches') ? 
							e[coord] : e.originalEvent.touches[0][coord]),
						start_target_drag = parseFloat(aops_scroll.$inner_wrapper[priv.scroll_loc]());
					// We set is_dragging here so that we don't accidentally hide the scrollbar
					//  should "show_on_hover" be set to true and the user slides the mouse 
					//  outside the outer_wrapper while trying to drag the slider.
					priv.is_dragging = true;

					$(document).bind('mousemove touchmove', function (ev) {	
						priv.onDragStart();
						aops_scroll.$inner_wrapper[priv.scroll_loc](start_target_drag - 
							(!ev.originalEvent.hasOwnProperty('touches') ? 
							ev[coord] : ev.originalEvent.touches[0][coord]) + start_mouse_drag); 
						aops_scroll.adjustSlider();
					
						return false;
					}).bind('mouseup touchend', function (ev) {
						$(document).unbind('mousemove mouseup touchmove touchend');
						priv.is_dragging = false;

						if (obj.hasOwnProperty('end_f')) {
							obj.end_f();
						}

						aops_scroll.adjustSlider();
						ev.stopPropagation();
						ev.preventDefault();
						priv.onDragRelease();
					});	
					e.stopPropagation();
					e.preventDefault();
				});
		
		
		
			}
		
		
			/**
			 * Stop propagation if someone clicks on a scrollbar or a slider.
			 *  Needed for scrollbars that are in something with a click event -
			 *  people clicking on the scrollbar don't expect the event underneath
			 *  to fire.
			 **/
			aops_scroll.$slider.on('click', function (e) {
				e.stopPropagation();
				e.preventDefault();
			});
			
			aops_scroll.$bar.on('click', function (e) {
				e.stopPropagation();
				e.preventDefault();
			});
	
			/**
			 * Bind arrow keys to operate upon hover over the targets.
			 */
			if (priv.activate_keys) {
				aops_scroll.$content.add(aops_scroll.$bar).hover(function () {
					$(this).data('hover', 1);
				}, 
				function () {
					$(this).data('hover', 0);
				});

				$(document).keydown(function (e) {
					_.each(aops_scroll.$content, function (content) {
						var active_element = document.activeElement;

						if (aops_scroll.$slider.is(':visible')) {
							if ($(content).data('hover') === 1 || $(aops_scroll.$bar).data('hover') === 1) {
								if (active_element.type === 'textarea' || active_element.type === 'input') {
									return true;
								}

								if (priv.axis === 'y') {

									switch (e.which) {
										case 33 : // page up 
											aops_scroll.moveSlider(priv.slider_position - priv.slider_size);
											break;

										case 34 : // page down
											aops_scroll.moveSlider(priv.slider_position + priv.slider_size);
											break;

										case 35 : // end key
											if (e.ctrlKey) {
												aops_scroll.moveSlider(priv.bar_size - priv.slider_size);
												aops_scroll.$bar.trigger('slider_at_end');
											}
											break;

										case 36 : // home key
											if (e.ctrlKey) {
												aops_scroll.moveSlider(0);
												aops_scroll.$bar.trigger('slider_at_start');
											}
											break;

										/**
										 *  Note the 0.5 nudge.  I have *no* idea why browsers
										 *  appear to nudge the slider an extra half-pixelish after the 
										 *  arrow operations.  I suspect there's some weird rounding thing
										 *  going on deep in the brains of jQuery or the browsers.
										 *   Without the 0.5 nudges below, large windows 
										 *   will eventually scroll in the wrong direction. 
										 **/
										case 38 : // up
											aops_scroll.moveSlider(priv.slider_position - priv.arrow_speed * priv.slider_size / priv.bar_size - 0.5);
											break;

										case 40 : // down
											aops_scroll.moveSlider(priv.slider_position + priv.arrow_speed * priv.slider_size / priv.bar_size - 0.5);
											break;									

										default : 
											return true;
											break;								
									}		
								}

								if (priv.axis === 'x') {
									switch (e.which) {
										case 37 : // left
											aops_scroll.moveSlider(priv.slider_position - priv.arrow_speed * priv.slider_size / priv.bar_size);
											break;

										case 39 : //right
											aops_scroll.moveSlider(priv.slider_position + priv.arrow_speed * priv.slider_size / priv.bar_size);
											break;

										default : 
											return true;
											break;
									}
								}
								e.stopPropagation();
								e.preventDefault();
								return false;

							}
						}
					});
				});
			}
		
		
			/**
			 * If we have show_on_hover set, then we track when the outer_wrapper is hovered over, so 
			 *  we know when to show the scrollbar.
			 */
			if (priv.show_on_hover) {
				aops_scroll.$outer_wrapper.hover(function() {
					$(this).data('hovered', true);
				}, function () {
					$(this).data('hovered', false);
				});
			}
		
		
			/** Build fader **/
			if ((priv.fade_start_active = obj.hasOwnProperty('fade_start_class'))) {
				priv.$fade_start = $($.parseHTML('<div class="' + obj.fade_start_class + '"></div>'));
				aops_scroll.$outer_wrapper.append(priv.$fade_start);
			}
			if ((priv.fade_end_active = obj.hasOwnProperty('fade_end_class'))) {
				priv.$fade_end = $($.parseHTML('<div class="' + obj.fade_end_class + '"></div>'));
				aops_scroll.$outer_wrapper.append(priv.$fade_end);
			}
		
			/**
			 * This trickery prevents the outer wrapper from sliding around 
			 *  when the user is copying text from the content.  Try removing this,
			 *  and you'll see that the window slides horizontally (for vertical bars)
			 *  when you don't want it to.
			 */
			aops_scroll.$outer_wrapper.on('scroll touchmove', function (e) {
				$(e.target).scrollLeft(0);
				$(e.target).scrollTop(0);	
			});
		
		
			if (priv.axis === 'y') {
			
				aops_scroll.$bar.bind('mousewheel', function (ev, delta) {
					if (aops_scroll.$slider.is(':visible')) {
						// bar_size / slider_size makes the scrolling go at the same rate as 
						//  the scrollwheel works on the scrollable $inner window.
						aops_scroll.moveSlider(priv.slider_position - priv.bar_size / priv.slider_size * delta);
						return false; //Don't cascade to scroll the browser window, too.
					}
				});
			}
		
		
			/** Get everything rolling **/
			checkBar();
			aops_scroll.adjustSlider();
			logWatchingData();
			checkInitSettings();
			/** Must check if the slider is at an endpoint so we show/hide the faders as appropriate **/
			aops_scroll.checkSliderAtEnd();
		
			if (priv.autosize) {
				setAutosize();
			}

			/**
			 * Must be after adjust Slider
			 * Make the scrollbar appear upon hover.
			 *  TODO: Deal with touch -- scroll show on slide?
			 */
			if (priv.show_on_hover) {
				aops_scroll.$outer_wrapper.on('mouseenter', function (e) {
					if (priv.is_scrollable) {
						aops_scroll.setBarVisibility(true);
					}
				});
				aops_scroll.$outer_wrapper.on('mouseleave', function (e) {
					if (!priv.is_dragging) {
						aops_scroll.setBarVisibility(false);
					}
				});
			}

			obj.$scrollbar.aopsScroll = aops_scroll;
		}
	
		/**
		 * jQuery extension for building a scrollbar.
		 */
		$.fn.extend({
			buildAopsScrollbar : function (obj) {
				return AoPS.Ui.buildAopsScrollbar($.extend(obj, {
					$scrollbar : this
				}));
			},
		
			wrapWithScroll : function (obj) {
				var $scrollwrap = $($.parseHTML('<div class="aops-scroll-outer"><div class="aops-scroll-bar"><div class="aops-scroll-slider"></div></div><div class="aops-scroll-inner"></div></div>')),
					$scrollbar = $scrollwrap.find('.aops-scroll-bar');
			
				this.addClass('aops-scroll-content');
				$scrollwrap.find('.aops-scroll-inner').append(this);
				$scrollbar.buildAopsScrollbar($.extend(obj, {
					$content : this
				}));
			
				$scrollwrap.aopsScroll = $scrollbar.aopsScroll;
				return $scrollwrap;
			}			
		});



		/**
		 *	WORK IN PROGRESS.
		 *
		 * Properties to support:
		 *
		 * $input : jQuery object of autocomplete element.
		 * match_type : (optional, default 'any') tells us how to match
		 *      We support any, from_start, from_start_then_any
		 * source : either a function or an array of label, value pairs (more details needed)
		 * minLength : (optional, default 2) number of characters before firing
		 * autoFocus : (optional, default true) If true, first item is autofocused 
		 * delay : (optional, default 0) delay before we try completing
		 * is_case_sensitive : (optional, default false) If true, we care about case.
		 * num_matches : (optional, default no limit) number of matches to show.
		 * position : positioning the popup (see http://api.jqueryui.com/position/)
		 * onOpen: function to call upon open of the list item.  We pass the dom element of the input box
		 *    as an argument.  Can use this for styling or other manipulations.
		 * onFocus: (optional) function to call upon focus on an item.
		 * onSelect : function to call upon selecting a list item.  stopPropagation/preventDefault to block default
		 * _renderItem : If you have some processing to do for each item, set this function.  
		 *    SEE NOTES HERE http://api.jqueryui.com/autocomplete/#method-_renderItem
		 *
		 *
		 * TODO: Consider sending in a note saying that the source string/array is already
		 *   all lowercase.  Will make a mess of createSourceFunction...
		 */
		Ui.buildAutocomplete = function (obj) {
		  // Construct the function from options in a way that
		  //  doesn't cause the options to be checked in each execution of the function
			obj = _.defaults(obj, {
				match_type : 'any',
				is_case_sensitive : false,
				delay : 0, // No idea what is best here.
				autoFocus : true,
				minLength : 2,
				num_matches : 0,
				ui_class : ''
			});
			obj.$input.parent().addClass('ui-front');
			obj.$input.addClass('ui-autocomplete-input');
		
			/**
			 * (from jqueryUI documentation):
			 * When filtering data locally, you can make use of the built-in $.ui.autocomplete.escapeRegex function. 
			 * It'll take a single string argument and escape all regex characters, making the result safe to pass to new RegExp().		
			 */
			/**
			 * Create the course function from inputted array of items and the match_type setting.
			 */
			function createSourceFunction () {
				if (obj.match_type === 'from_start' || obj.match_type === 'any') {
					return function(request, response) {
						var match_regexp = new RegExp((obj.match_type === 'from_start' ? '^' : '') + 
								$.ui.autocomplete.escapeRegex(request.term), 
								(obj.is_case_sensitive ? '' : 'i')),
							matches = _.filter(obj.source, function (term) {
								return match_regexp.test(term.label);
							});
						if (obj.num_matches > 0) {
							matches = matches.slice(0,obj.num_matches);
						}
						response(matches);
					};
				} else if (obj.match_type === 'from_start_then_any') {
					return function(request, response) {
						var match_regexp1 = new RegExp('^' + $.ui.autocomplete.escapeRegex(request.term), 
								(obj.is_case_sensitive ? '' : 'i')),
							match_regexp2 = new RegExp($.ui.autocomplete.escapeRegex(request.term), 
								(obj.is_case_sensitive ? '' : 'i')),
							matches = _.union(_.filter(obj.source, function (term) {
								return match_regexp1.test(term.label);
							}), _.filter(obj.source, function (term) {
								return match_regexp2.test(term.label.substring(1));
							}));
						if (obj.num_matches > 0) {
							matches = matches.slice(0,obj.num_matches);
						}
						response(matches);
					};
				}
			}
		

			obj.$input.autocomplete({
				autoFocus : obj.autoFocus,
				source : (typeof obj.source === 'function') ? obj.source : createSourceFunction(),
				minLength : obj.minLength,
				delay : obj.delay,
				position : (obj.hasOwnProperty('position') ? obj.position : {}),
				response : function(ev, ui) {
					// This allows us to set a condition under which we'll block a response
					//  from the autocompleter.
					if (obj.hasOwnProperty('blockResponse') && obj.blockResponse()) {
						// Need this check; community has some crafty stuff that changes obj.$input, which
						//   will make some wackiness happen here.
						// NOTE: rr changed hasOwnProperty to hasClass below on 8/26
						if (obj.$input.hasClass('ui-autocomplete-input')) {
							obj.$input.autocomplete('close');
						} 
						return;
					}
					var curr_val = (!_.isNaN(this.selectionStart) ? 
						$(this).val().substr(0, this.selectionStart): $(this).val()),
						curr_length = curr_val.length;
					/**
					 * Don't push the autocompleted default into the box
					 *  if backspace, left arrow, or delete was just hit.
					 */
					if (ui.content.length > 0 && $(this).data('last_key') != 37 && $(this).data('last_key') != 8 && $(this).data('last_key') != 46) {
					//  Can only highlight the guessed autocomplete if 
					//   the default option matches from start.  Otherwise,
					//   we don't want to push a mid-string match into the box we're typing in.
						if (new RegExp('^' + $.ui.autocomplete.escapeRegex(curr_val), 'i').test(ui.content[0].value)) {
							// Set the rest of the selection to what's left of the first
							//  option we match
							$(this).val(curr_val + ui.content[0].value.substring(curr_length));
							this.setSelectionRange(curr_length,ui.content[0].label.length);
						}
					}
				},
				open : function (ev, ui) { //Apply a style to the matching piece of the string
				// This makes the substring match bold.  
					var menu = $(this).data('ui-autocomplete').menu,
						term_template = '<span class="ui-autocomplete-term">%s</span>',
						current_term = $(this).data('ui-autocomplete').term.substr(0, this.selectionStart),
						regex = new RegExp($.ui.autocomplete.escapeRegex(current_term), 'gi');
					menu.element.find('a').each(function () {
						$(this).html($(this).text().replace(regex, function (matched) {
							return term_template.replace('%s', matched);
						}) );
					});
			
					if (obj.hasOwnProperty('onOpen')) {
						obj.onOpen(this);
					}
				}
			});
		
			if (obj.hasOwnProperty('onFocus')) {
				obj.$input.on('autocompletefocus', function (ev, ui) {
					obj.onFocus(ev, ui);
				});
			}
		
			if (obj.hasOwnProperty('onSelect')) {
				obj.$input.on('autocompleteselect', function (ev, ui) { 
					obj.onSelect(ev, ui);				
				});
			}
			if (obj.hasOwnProperty('_renderItem')) {
				obj.$input.data('ui-autocomplete')._renderItem = obj._renderItem;
			}
		
			if (obj.hasOwnProperty('change')) {
				obj.$input.on('autocompletechange', obj.change);
			}
		
		
			/**
			 * If we click downstream where the autocomplete highlighting starts,
			 *  we want to trigger another autocompleting to refine results further.
			 **/
			obj.$input.on('click', function (e) {
				if (this.selectionEnd === this.value.length) {
					$(this).autocomplete('search', this.value);
				}
			});
			/**
			 * Note: keypress doesn't catch backspace.
			 * keydown doesn't know lowercase.  So,
			 * we won't be case-sensitive on checking here.
			 */
			obj.$input.on('keydown', function (e) {
				var expected_key = this.value.substr(this.selectionStart,1).toUpperCase().charCodeAt(0),
					key_pressed = (e.which || e.keyCode);
				
				if (expected_key === key_pressed) {	
					this.setSelectionRange(this.selectionStart + 1, this.value.length);
					e.stopPropagation();
					e.preventDefault();
				
					/**
					 * We block the keypress from propagating, and fire the search manually.
					 *  This prevents the keypress from deleting the highlighted stuff
					 *  when we type what is expected.  This trickery is needed to avoid
					 *  the expected completion to flicker on and off.
					 */
					$(this).autocomplete('search', this.value.substring(0, this.selectionStart));
					return false;
				}
			
				/**
				 * Capture what the last key pressed is so that we can do things like
				 * "Don't give the autocompleted, highlighted text on backspace, but 
				 *  do update the menu of autocomplete options."
				 */
				$(this).data('last_key', key_pressed);
				// TODO: Define back arrow behavior
			});
		
			if (obj.ui_class.length > 0) {
				obj.$input.autocomplete('widget').addClass(obj.ui_class);
			}
			return obj.$input;
		}

		/** jQuery extension for our Autocomplete **/
		$.fn.extend({
			aopsAutocomplete : function (obj) {
				return AoPS.Ui.buildAutocomplete($.extend(obj, {
					$input : this
				}));
			}
		});
	
		Ui.getScrollbarWidth = function () {
			if (typeof Ui.scrollbarWidth !== 'integer') {
				Ui.scrollbarWidth = Ui.computeScrollbarWidth();
			}
		
			return Ui.scrollbarWidth;
		}
	
		// Compute browser's scrollbar width.
		Ui.computeScrollbarWidth = function () {
			var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
				$outer = jQuery('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
				inner = $inner[0],
				outer = $outer[0];
	 
			jQuery('body').append(outer);
			var width1 = inner.offsetWidth;
			$outer.css('overflow', 'scroll');
			var width2 = outer.clientWidth;
			$outer.remove();
 
			return (width1 - width2);
		}
	
	
		Ui.buildUsernameAutocomplete = function ($input, data) {
			var autocomplete_settings = _.extend({
					match_type : 'from_start_then_any',
					delay : 100, 
					is_case_sensitive  : false, 
					source : function (request, response) {
							var ajax_runner_local = new AoPS.Ajax.ScriptRunner('/m/community/ajax.php');
						
							ajax_runner_local.run('fetch_username_matches', {
								'username_stub' : request.term
							},
							function(ok, msg){
								var data;

								if (ok) {
									data = _.map(msg.response.usernames, function (item) {
										return _.defaults(item, {
											label : item.value
										});
									});
								
									response(data);
								} else {
									response([]);
								}
							});
						},
					num_matches : 10,
					position : {
						my : 'left top+5'
					},
					ui_class : 'username-autocomplete'				
				}, data);
			$input.aopsAutocomplete(autocomplete_settings);
		}
	
		/** jQuery extension for our Autocomplete **/
		$.fn.extend({
			aopsUsernameAutocomplete : function (obj) {
				AoPS.Ui.buildUsernameAutocomplete(this, obj);
			}
		});
	
	
		/**
		 * autoExpandTextarea takes a text area element and makes it so that it
		 * expands as you type inside of it.
		 * 
		 * The first argument is the jquery object containing the text area to
		 * auto expand. (Only pass in one element.)
		 * The second argument is an object with options and can have the following keys:
		 *   min_height: A number giving the minimum height of the text area in pixels.
		 * 
		 * Essentially a fork of
		 * https://github.com/javierjulio/textarea-autosize.
		*/
		Ui.autoExpandTextarea = function (textarea) {
			var height = textarea.outerHeight();
			var diff = parseInt(textarea.css('paddingBottom'), 10) +
				parseInt(textarea.css('paddingTop'), 10);
		
			// Firefox fix
			if (textarea[0].scrollHeight + diff <= height) {
				diff = 0;
			}
			if (/\S/.test(textarea.val())) { // i.e. if there's text already
				adjustHeight();
			}
			
			function adjustHeight () {
				if (textarea[0].scrollHeight) {
					textarea.height('auto').height(textarea[0].scrollHeight - diff);
				} else {
					setTimeout(adjustHeight, 500);
				}
			}
			 // keyup is an IE fix
			textarea.on('input keyup', adjustHeight);
			$(window).on('resize', adjustHeight);
		}
	
		return Ui;
	} (AoPS.Ui || {}));



	// A wrapper for the scroll bar
	;(function ( $ ) {
		var
			pluginName = 'aopsscroll';
	
		var defaults = {
			adjust_container : 20
		};
	
		// Constructor
		function Plugin( element, data, options ) {

			/**
			 * Options
			 * @type {object}
			 */
			var opts = $.extend( {}, defaults, options );
		
			/**
			 * Width (or height) of outer container. Inner container needs to be
			 * 20px larger so that scrollbar does not appear
			 */
			var size = 0;
		
			// Wrap the code with the required divs
			var html = [
				'<div class="aops-scroll-outer">',
				'<div class="aops-scroll-bar"><div class="aops-scroll-slider"></div></div>',
				'<div class="aops-scroll-inner">',
				'<div class="aops-scroll-content">',
				$(element).html(),
				'</div>',
				'</div>',
				'</div>'
			].join("");
		
			$( element ).html( html );
		
			// Here we make the inner content 20px larger than the outer content
			// so that the scrollbar is no longer visible
			if ( opts.axis && opts.axis === "x" ) {
				size = parseInt( $( element ).find( ".aops-scroll-outer" ).height() );
				$( element ).find( ".aops-scroll-inner" ).height( size + opts.adjust_container );		
			} else {
				size = parseInt( $( element ).find( ".aops-scroll-outer" ).width() );
				$( element ).find( ".aops-scroll-inner" ).width( size + opts.adjust_container );
			}
		
		
			// Set the scrollbar and content doms
			opts.$scrollbar = $( element );
			opts.$content = $( element ).find( ".aops-scroll-content" );
		
			// Build the scrollbar
			AoPS.Ui.buildAopsScrollbar( opts );
		}
	
	
		// A lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( data, options ) {
			return this.each( function () { 
				if ( ! $.data( this, "plugin_" + pluginName ) ) {
					$.data( this, "plugin_" + pluginName, new Plugin( this, data, options ) );
				}
			});
		};
	
	
	
	
	
	
	}( jQuery ) );
	
	AoPS.Ui.ui_main_loaded = true;
}
