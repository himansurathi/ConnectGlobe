/**
 * AoPS.Page manages elements for the page.  It places elements on the screen,
 *  and keeps track of elements we remove from the screen but may want later.
 *
 * Page.Model : The Model that tracks the elements on the page
 *
 * Page.View : The View that is used to manage DOM interaction
 *
 * Page.constructPage : Method that initiates a Page instance for managing a page.
 *
 * Dependencies:
 *	backbone
 *	jQuery
 *	underscore
 *
 * The current implementation probably doesn't need the Backbone structure, but
 *  it's possible that we'll add more items to this for which we'll want the
 *  Backbone functionality.
 */

AoPS.Page = {}

AoPS.Page.loader_html = '<div class="aops-loader"><img src="/assets/images/logo-ludicrous.gif" /></div>'

AoPS.Page.$loader = $($.parseHTML(AoPS.Page.loader_html));

AoPS.Page.buildLoader = function () {
	return AoPS.Page.$loader.clone();
}

/**
 * AoPS.Page.Model tracks all the page elements.
 *
 * Properties:
 *
 * elements : Array of elements Page knows
 * active_elements : Array of elements that are currently on the screen
 * $loader : The loader you can add to the page.
 * locations : Array of locations that Page knows
 * active_locations : Array of locations that are currently on the screen
 *
 * Each Page element object has the following structure:
 *	type string (optional, default 'backbone'): 'jQuery_object' or 'backbone'
 *	id string : must be unique
 *	dom_element (jQuery object): The DOM element that Page puts on screen for this element 
 *	view (Backbone.View object): (type = 'backbone' only) View object for this element
 *
 * Each Page location object has the following structure:
 *	id string : must be unique
 *	dom_element jQuery_object : DOM element of this location (always a div with the given id)
 *	is_active boolean : true if this location is on screen 
 */
AoPS.Page.Model = Backbone.Model.extend({
	initialize : function () {
		this.set('elements', {});
		this.set('active_elements', []);
		this.set('locations', []);
		this.set('active_locations', []);
	},
	
	/**
	 * fetchElement gets a Page element from elements, or creates it if it does not exist 
	 *  already.  Each Page element is only created once; thereafter, this function returns
	 *  the originally-created element.
	 *
	 * @param obj Page element descriptor object (object used to describe an element to find or create)
	 *		id string : unique id; this is used to find the element in the elements array (Can omit to always force construction)
	 *		type string (optional, default 'backbone'): 'jQuery_object' or 'backbone'
	 *		jQuery_object (jQuery object, type 'jQuery_object' only) : jQuery object to use
	 *		constructor function (type 'backbone' only) : constructor to use to create the element
	 *
	 * @return obj Page element object.  See notes at start of Page.Model for properties.
	 */
	fetchElement : function (sought_element) {
		var fetched_element = (sought_element.hasOwnProperty('id') ? this.findExistingElement(sought_element.id) : null);
		
		if (_.isUndefined(fetched_element) || _.isNull(fetched_element)) {
			fetched_element = this.createElement(sought_element);
		} else if (fetched_element.type === 'backbone') {
			// Small change to account for possibility $el has changed.
			fetched_element.dom_element = fetched_element.view.$el;		
		}
				
		return fetched_element;
	},

	/**
	 * fetchElement gets a Page element from the 'elements' collection given an id, or returns null.
	 *
	 * @param string : id.
	 * @return Member of 'elements' collection, or undefined.
	 **/
	findExistingElement : function (sought_element_id) {
		var elements = this.get('elements');
		
		if (elements.hasOwnProperty(sought_element_id)) {
			return elements[sought_element_id];
		} else {
			return null;
		}
	/*	return _.find(this.get('elements'), function (element) {
			return element.id === sought_element_id;
		});*/
	},
	
	/**
	 * createElement creates a new element and adds it to the elements array
	 *
	 * @param obj Page element descriptor object (object used to describe an element to find or create)
	 *		id string : unique id; this is used to find the element in the elements array
	 *		type string (optional, default 'backbone'): 'jQuery_object' or 'backbone',
	 *		onAddToPage : (optional, function to fire whenever element put on page;  only
	 *			for type jQuery_object.  If type is backbone, then the view constructor's 
	 *			onAddToPage is used). (IMPORTANT: Backbone's extend doesn't 
	 *			attach the methods of the parent to the children's prototypes, 
	 *			so you'll have to do so manually for onAddToPage and onRemoveFromPage)
	 *		onRemoveFromPage : (optional, function to fire whenever element put on page;  only
	 *			for type jQuery_object.  If type is backbone, then the view constructor's 
	 *			onRemoveFromPage is used.  See IMPORTANT note in onAddToPage)
	 *		jQuery_object (jQuery object, type 'jQuery_object' only) : jQuery object to use
	 *		constructor function (type 'backbone' only) : constructor to use to create the element
	 *
	 * @return obj Page element object.  See notes at start of Page.Model for properties.
	 */
	createElement : function (element) {
		var new_element,
			new_view;
		
		if (!element.hasOwnProperty('type') || element.type === 'backbone') {
			// Default type is backbone
			new_view = element.constructor();
			
			new_element = {
				id : element.id,
				dom_element : new_view.$el,
				type : 'backbone',
				view : new_view,
				no_save : !!element.no_save,
				onAddToPage : ((typeof new_view.onAddToPage === 'function') ? function (obj) {
					new_view.onAddToPage(obj); 
				} : function () { return; }),
				onRemoveFromPage : ((typeof new_view.onRemoveFromPage === 'function') ? function () {
					new_view.onRemoveFromPage(); 
				} : function () { return; })
				
				/*onAddToPage : (new_view.constructor.prototype.hasOwnProperty('onAddToPage') ? function () {
					new_view.onAddToPage(); 
				} : function () { return; }),
				onRemoveFromPage : (new_view.constructor.prototype.hasOwnProperty('onRemoveFromPage') ? function () {
					new_view.onRemoveFromPage(); 
				} : function () { return; }),*/
			};
		} else if (element.type === 'jQuery_object') {
			if (!element.hasOwnProperty('jQuery_object')) {
				console.log('You tried to initiate a jQuery_object element without sending the object!');
				console.log('The id is ' + element.id);
			} 
			new_element = {
				id : element.id,
				dom_element : element.jQuery_object,
				type : 'jQuery_object',
				no_save : !!element.no_save,
				onAddToPage : (element.hasOwnProperty('onAddToPage') ? element.onAddToPage : 
					function () { return; }),
				onRemoveFromPage : (element.hasOwnProperty('onRemoveFromPage') ? element.onRemoveFromPage : 
					function () { return; })
			};
		}
		
		if (!element.no_save) {
			this.insertElement(new_element);
		}
		return new_element;
	},
	
	/**
	 * insertElement inserts an element in the elements array.
	 *
	 * @param obj : Page element object. See notes at start of Page.Model for element properties. 
	 *
	 * This is a separate function because I may sort the elements array.
	 * TODO : Test the need for sorted elements array/binary sort.
	 */
	insertElement : function (element) {
		this.get('elements')[element.id] = element;
//		this.get('elements').push(element);
	},
	
	/**
	 * activateElement takes an element descriptor, finds or creates the corresponding
	 *  element, then adds it to active_elements.  
	 *
	 * @param obj : descriptor for find/create of an element
	 *
	 * @return obj : Page element object.
	 */
	activateElement : function (obj) {
		var page_element = this.fetchElement(obj);
		this.get('active_elements').push(page_element);
		return page_element;
	},
	
	/**
	 * fetchLocation finds or creates a location.
	 *
	 * @param string : unique id of the location.
	 * @return obj : Page location object.
	 */
	fetchLocation : function (sought_location_id) {
		var fetched_location = _.find(this.get('locations'), function (location) {
			return location.id === sought_location_id;
		});
		
		if (_.isUndefined(fetched_location)) {
			fetched_location = this.createLocation(sought_location_id);
		}
		
		return fetched_location;
	},
	
	/**
	 * createLocation creates a location and adds it to the locations array.
	 *
	 * @param string : unique id of the location.
	 * @return obj : Page location object.  See AoPS.Page.Model comment for details.
	 */	
	createLocation : function(location_id) {
		var new_location = {
			id : location_id,
			dom_element : $($.parseHTML('<div id="' + location_id + '"></div>')),
			is_active : false
		};
		
		this.get('locations').push(new_location);
		return new_location; 
	},

	/**
	 * activateLocation activates a location and adds it to the active_locations array.
	 *
	 * @param string : Page location object.  See AoPS.Page.Model comment for details.
	 */		
	activateLocation : function(page_location) {
		page_location.is_active = true;
		this.get('active_locations').push(page_location);
	},
	
	/**
	 * clearActiveArrays empties the active arrays.  Page.View takes care of the 
	 *  rest of the work of emptying arrays.
	 */
	clearActiveArrays : function () {
		this.set('active_elements', []);
		this.set('active_locations', []);
	}
});


/**
 * AoPS.Page.View is the Backbone View for the page.  
 *  Its $el will hold everything that Page puts in the DOM.  Add
 *  this element to wherever you want all of Page's content to show up.
 *
 * model : AoPS.Page.Model
 */
AoPS.Page.View = Backbone.View.extend({
	classes : [],
		
	$breadcrumbs_wrapper : $('#breadcrumbs-wrapper'),
	
	$breadcrumbs_bar : $('#breadcrumbs .crumb-wrapper'),
	
	initialize : function () {
		this.$subheader = $('#subheader');

		if (this.$subheader.length == 0) {
			this.$subheader = $('<div id="subheader"></div>').css({
				'width' : '100%',
				'text-align' : 'center'
			});
			$('#header').after(this.$subheader);
		}
		this.$error_window = $('#page_error_window');
		if (this.$error_window.length == 0) {
			this.$error_window = $('<div id="page_error_window"></div>').css({
				'width' : '100%',
				'text-align' : 'left'
			});
		}
		
		this.$loader = AoPS.Page.buildLoader();
	},
	
	/**
	 * showElement reveals an element given its descriptor.  
	 *
	 * @param obj Page element descriptor object (object used to describe an element to find or create)
	 *		id string : unique id; this is used to find the element in the elements array
	 *		type string (optional, default 'backbone'): 'jQuery_object' or 'backbone'
	 *		jQuery_object (jQuery object, type 'jQuery_object' only) : jQuery object to use
	 *		constructor function (type 'backbone' only) : constructor to use to create the element
	 *
	 * showElement triggers the event 'added_to_page' on the resulting element's jQuery_object
	 *  right after adding the element to the page.  
	 */
	showElement : function (obj) {
		var page_element = this.model.activateElement(obj),
			page_location;
		// Assumes page_locations are mentioned in order we want them added.
		if (obj.hasOwnProperty('location')) {
			if (obj.location === 'subheader') {
				this.$subheader.append(page_element.dom_element);
			} else {
				page_location = this.model.fetchLocation(obj.location);
				if (!page_location.is_active) {
					this.model.activateLocation(page_location);
					this.$el.append(page_location.dom_element);
				}
				page_location.dom_element.append(page_element.dom_element);
			}
		} else {
			this.$el.append(page_element.dom_element);
		}

		page_element.dom_element.trigger('added_to_page', 
			obj.hasOwnProperty('on_add_settings') ? obj.on_add_settings : {});
		page_element.onAddToPage(obj.hasOwnProperty('on_add_settings') ? obj.on_add_settings : {});
		return _.clone(page_element);
	},
	
	
	/**
	 * showElements allows you to pass a whole array of Page element descriptors
	 *  rather than sending them one at a time.
	 *
	 * @param array : Page element descriptors (see this.showElement)
	 */
	showElements : function (arr) {
		var $added_dom_elements = [];
		_.each(arr, _.bind(function(element) {
			$added_dom_elements.push(this.showElement(element));
		}, this));
		return $added_dom_elements;
	},
	
	
	/**
	 * hideElement is an internal function for taking an element out of the DOM.
	 * If the element was not saved, then its view is also closed.
	 *
	 * @param element : Page element object to remove.
	 */
	hideElement : function (element) {
		var saved;
		if (!element) { return; }
		
		element.dom_element.detach();
		// Small change to account for possibility $el has changed.
		if (element.type === 'backbone') {
			element.view.$el.detach();
		}

		element.onRemoveFromPage();
		// Elements that were not saved should be closed now.
		if (element.no_save && element.type === 'backbone' && element.view.close) {
			element.view.close();
		}
	},
	
	/**
	 * clearPage detaches everything, marks all locations as inactive.
	 *
	 * @param optional obj
	 */
	clearPage : function (obj) {
		var settings = ((arguments.length == 0) ? {
			'remove_all' : true,
			'remove_classes' : true
		} : obj);
		AoPS.Ui.Modal.closeAllModals();
		this.hideLoader();
		if (settings.remove_classes) {
			this.clearClasses();
		}
		
		if (settings.remove_all) {
			_.each(this.model.get('active_elements'), this.hideElement, this);
			_.each(this.model.get('active_locations'), function(location) {
				location.is_active = false;
				location.dom_element.detach();
			});
			this.model.clearActiveArrays();
		}
		this.showBreadcrumbs();
	},
	
	
	/**
	 * Remove a single element.
	 *
	 * @param string id of element to remove.
	 **/
	removeElement : function (element_id) {
		var element;
	
		if (element_id.length === 0) {
			return;
		}
		element = this.model.findExistingElement(element_id);
		this.hideElement(element);
		this.model.set('active_elements', _.without(this.model.get('active_elements'), element));
	},
	
	/**
	 * Forget a single element.
	 *
	 * @param string id of element to forget.
	 **/
	forgetElement : function (element_id) {
		var element;
	
		if (element_id.length === 0) {
			return;
		}
		element = this.model.findExistingElement(element_id);
		if (!_.isUndefined(element)) {
			this.hideElement(element);
			this.model.set('active_elements', _.without(this.model.get('active_elements'), element));
			this.model.set('elements', _.without(this.model.get('elements'), element));
		}
	},
	
	/**
	 * Add a class to the page.
	 *
	 * @param string : class to add.
	 */
	addClass : function (new_class) {
		this.$el.addClass(new_class);
		this.classes.push(new_class);
	},
	
	
	/**
	 * Remove a class from the page.
	 *
	 * @param string : class to add.
	 */
	removeClass : function (del_class) {
		this.$el.removeClass(del_class);
		this.classes = _.without(this.classes, del_class);
	},
	
	/**
	 * Set a class to the page, remove all others added through 
	 *  this.addClass() or this.setClass().
	 *
	 * @param string : class to add.
	 */
	setClass : function (new_class) {
		this.clearClasses();
		this.addClass(new_class);
	},

	/**
	 * Remove all classes added through this.addClass() and this.setClass().
	 */	
	clearClasses : function () {
		_.each(this.classes, _.bind(function (page_class) {
			this.$el.removeClass(page_class);
		}, this));
		this.classes = [];
	},
	
	
	/**
	 * Fill the page with an error message.
	 *
	 * @param object
	 *  	error_type 
	 *		error_msg
	 **/
	throwError : function (obj) {
		var error_message;

		this.clearPage();

		switch (obj.error_type) {
			case 'unregistered':
				error_message = 'You must be logged in to view this page.';
			break; 
			
			case 'custom':
				error_message = obj.error_msg;
			break; 
		}
		
		this.$error_window.html(error_message);
		this.showElement({
			id : 'page-error-window-' + this.cid,
			type : 'jQuery_object',
			jQuery_object : this.$error_window
		});
		
		
	},

	
	/***
	 * Hide the breadcrumb bar.
	 */
	hideBreadcrumbs : function () {
		this.$breadcrumbs_wrapper.hide();
	},
	
	/**
	 * Show the breadcrumb bar.  Called by clearPage()
	 */
	showBreadcrumbs : function () {
		this.$breadcrumbs_wrapper.show();
	},
	
	/**
	 * Show a loader on the page.
	 */
	showLoader : function () {
		if (!this.$loader.is(':visible')) {
			this.$el.append(this.$loader);
		}
	},
	
	/**
	 * Hide the Loader 
	 */
	hideLoader : function () {
		this.$loader.detach();
	},
	
	
	/**
	 * Set the breadcrumbs.
	 *
	 * @param array of {
	 *		text : text to show in breadcrumb
	 *		url : (optional) url for breadcrumb
	 *		no_stay : (optional) true if clicking this should cause a page load
	 *	}
	 * @param attribute to give to each link to make it stay in the same page load.
	 *		Defaults to data-stay.
	 */
	setBreadcrumbs : function (data, stay_attr) {
		var sep_html = ' <i class="aops-font aops-angle-double-right"></i> ',
			crumb_html_list = _.map(data || [], function (crumb, i) {
				var content = crumb.text,
					crumb_stay_attr = crumb.no_stay ? '' : ' ' + (stay_attr || 'data-stay');
				
				if (crumb.url) {
					content = '<a href="' + crumb.url + '"' + crumb_stay_attr + '>' + content + '</a>';
				}
				
				return '<span class="crumb crumb-' + (i + 1) + '">' + content + '</span>';
	
			});
		
		this.$breadcrumbs_bar.html($.parseHTML(crumb_html_list.join(sep_html)));
	},
	
	/**
	 * Set the page title.
	 *
	 * @param sting title.
	 */
	setTitle : function (title) {
		document.title = title;
	}
});

/**
 * Set the breadcrumbs.
 *
 * @param array of {
 *		text : text to show in breadcrumb
 *		url : (optional) url for breadcrumb
 *		no_stay : (optional) true if clicking this should cause a page load
 *	}
 * @param attribute to give to each link to make it stay in the same page load.
 *		Defaults to data-stay.
 */
AoPS.Page.setBreadcrumbs = function (data, stay_attr) {
	var sep_html = ' <i class="aops-font aops-angle-double-right"></i> ',
		crumb_html_list = _.map(data || [], function (crumb, i) {
			var content = crumb.text,
				crumb_stay_attr = crumb.no_stay ? '' : ' ' + (stay_attr || 'data-stay');
			
			if (crumb.url) {
				content = '<a ' + (crumb.hasOwnProperty('data') ? crumb.data : '') + 
					' href="' + crumb.url + '"' + crumb_stay_attr + '>' + content + '</a>';
			}
			
			return '<span class="crumb crumb-' + (i + 1) + '">' + content + '</span>';

		});
	
	$('#breadcrumbs .crumb-wrapper').html($.parseHTML(crumb_html_list.join(sep_html)));
}


AoPS.Page.showBreadcrumbs = function () {
	$('#breadcrumbs-wrapper').show();
}

AoPS.Page.hideBreadcrumbs = function () {
	$('#breadcrumbs-wrapper').hide();
}

/**
 * constructPage gets everything rolling.
 *
 * @param string : id for the div that holds everything.  Page creates the div.  
 *
 * @return Page.View object.  Add the .el of this returned object wherever you want it
 * 		on your page (usually main-content).  
 *
 */
AoPS.Page.constructPage = function (id) {
	return new AoPS.Page.View({
		model : new AoPS.Page.Model(),
		id : id
	});
}
