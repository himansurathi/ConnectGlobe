$(document).on("ready", function() {
	jQuery.support.cors = true;
	if ( document.getElementById( "side-column" ) ) {
		$( "#submenu-icon" ).click( function () {
			$( "#side-column-wrapper" ).toggleClass( "active" );
		} );

		$( "#side-column .dropdown-box > .title" ).click( function ( e ) {
			$e = $( e.currentTarget ).parent();
			$e.toggleClass( "open" );
		} );

		$( "#side-column .menu" ).click( function ( e ) {
			$e = $( "#side-column .submenu-wrapper" ).removeClass( "open" );
			$e = $( e.currentTarget ).find( ".submenu-wrapper" ).addClass( "open" );
		} );

		// Update footer and sidebar on resize
//		$( window ).resize( _.debounce( function () {
//			AoPS.updateLayout();
//		}, 200 ) );
	}

		$( ".infobar" ).click( function ( e ) {
			if ( e.target.className.indexOf( "infobar-hide" ) >= 0 ) {
				$( this ).hide();
				$.ajax( {
					url : "/ajax.php",
					timeout : 5000,
					type : "post",
					data : {
						a : "infobar-hide",
						key : $( this ).data( "key" ),
					},
					success : function( data ) {
					}
				} );
			}
		} );


	$( "#menu-myaops-toggle" ).click( function ( e ) {
		$( "#menu-myaops" ).toggle();
		e.preventDefault();
		e.stopPropagation();
	} );

	// Remove the bars for sidemenu dropdown if no sidemenu
	if ( ! document.getElementById( "side-column" ) ) {
		var dom = document.getElementById( "submenu-icon" );
		if ( dom ) {
			dom.parentNode.removeChild( dom );
		}
	}


	AoPS.fixFooter();

	/** Reset the minimum height on page size change **/
	$(window).on('resize.fix_footer', function () {
		AoPS.fixFooter();
	});

	AoPS.login.initialize();
	AoPS.inputPlaceholders.initialize();

	// Apply svg or no-svg class to html tag
	if ( !!document.createElementNS && !!document.createElementNS( "http://www.w3.org/2000/svg", "svg" ).createSVGRect ) {
		$( "html" ).addClass( "svg" );
	} else {
		$( "html" ).addClass( "no-svg" );
	};



	var $body = $('body'),
		$top_bar = $('#top-bar'),
		$main_logo = $('#main-logo'),
		start_over_bar = false,
		over_bar = false,
		over_logo = false,
		scroll_time = 150,
		scroll_delay = 350,
		start_over_logo = false;

	/** Dealing with what to do if the cursor is at the top of the page on load.  Don't want the stuff to scroll
		in right when they start moving.  This is particularly weird when user has just clicked to company pages **/
	$top_bar.on('mousemove.start_loc', function () {
		start_over_bar = true;
	});
	$main_logo.on('mousemove.start_loc', function () {
		start_over_logo = true;
	});
	$body.on('mousemove.start_loc', function () {
		$top_bar.off('mousemove.start_loc');
		$body.off('mousemove.start_loc');
		$main_logo.off('mousemove.start_loc');
		setTimeout(function () {
			start_over_bar = false;
			start_over_logo = false;
		}, 350);
	});


	$top_bar.on('mouseenter', function () {
		over_bar = true;
		setTimeout(function () {
			if (!start_over_bar && over_bar) {
				$('#header-popin').animate({
//					top : 0
					opacity : 1
				}, scroll_time);
			}
		}, scroll_delay);
	});

	$main_logo.on('mouseenter', function () {
		over_logo = true;
		setTimeout(function () {
			if (!start_over_logo && over_logo) {
				$('#header-popin').animate({
//					top : 0
					opacity : 1
				}, scroll_time);
			}
		}, scroll_delay);
	});

	$top_bar.on('mouseleave', function () {
		over_bar = false;
	});

	$main_logo.on('mouseleave', function () {
		over_logo = false;
	});

	$('#header').on('mouseleave', function () {
		$('#header-popin').animate({
//			top : '-30px'
			opacity : 0
		}, scroll_time);
	});



});



// Set up AoPS alerts
window.classicAlert = window.alert;
window.alert = function( message, options ) {
	if ( AoPS.hasOwnProperty( "Ui" ) ) {
		AoPS.Ui.Modal.closeTopModal( );
		if ( typeof( options ) === "undefined" )
			AoPS.Ui.Modal.showAlertQuick( message );
		else
			AoPS.Ui.Modal.showAlertQuick( message, options );
	} else {
		window.classicAlert( message );
	}
}


/**
 * Set the breadcrumbs in the breadcrumb bar
 *
 * @param {array} crumbs An array of objects containing the breadcrumbs. Each
 *                object should be formatted as:
 *                {
 *                    text : breadcumb text,
 *                    url : URL to link to when user clicks on breadcrumb (optional)
 *                }
 */
AoPS.setBreadcrumbs = function ( crumbs ) {
	var content;

	var html = [];

	for ( var i = 0; i < crumbs.length; i++ ) {

		content = crumbs[ i ].text;
		if ( crumbs[ i ].url ) {
			content = '<a href="' + crumbs[ i ].url + '">' + content + '</a>';
		}

		html.push( '<span class="crumb crumb-' + ( i + 1 ) + '">' + content + "</span>" );
	}

	$( ".crumb-wrapper" ).html( html.join( ' <i class="aops-font aops-angle-double-right"></i> ' ) );
};



AoPS.fixFooter = function() {
	// Determine minimum height of #main-content
	var height = $( window ).height();
	var has_small = $( "body" ).hasClass( "small-footer" );


	height -= $( "#header-wrapper" ).outerHeight();

	if ( has_small ) {
		height -= $( "#small-footer-wrapper" ).outerHeight();
	} else {
		height -= $( "#the-end-1" ).outerHeight();
		height -= $( "#the-end-2" ).outerHeight();
	}

	$( "#main-content" ).css( "min-height", height );

	if ( has_small ) {
		$( "#small-footer-wrapper" ).show();
	}


	var sidebar = document.getElementById( "side-column-wrapper" );
	if ( sidebar ) {
		$( sidebar ).css( "min-height", height );
	}
}


AoPS.login = {
	/**
	 * Flag indicating if an ajax call is currently taking place.
	 * Prevents users clicking over and over.
	 *
	 * @type Boolean
	 */
	ajaxing : false,

	$login_form : $( "#login-form" ),

	logout_url : AoPS.bootstrap_data && AoPS.bootstrap_data.logout_url,

	user_clicked_logout : false,

	user_clicked_login : false,

	initialize : function() {
		$( document ).on( "click", ".login-button", AoPS.login.display );
		$( "#header-logout" ).on( "click", AoPS.login.logout );

		// We always need these, not just when logged out when
		// loading page, in case we get logged out while online
		$( "#login-cancel-button" ).on( "click", AoPS.login.close );
		$( "#login-button" ).on( "click", AoPS.login.login );
		$( "#login-facebook" ).on( "click", AoPS.login.facebook );
		$( "#login-password" ).on( "keypress", function( e ) {
			if ( e.keyCode === 13 ) {
				AoPS.login.login();
			}
		} );
		$( "#login-username" ).on( "keypress", function( e ) {
			if ( e.keyCode === 13 ) {
				var username = document.getElementById( "login-username" ).value;
				var password = document.getElementById( "login-password" ).value;
				if ( password.length ) {
					AoPS.login.login();
				} else if ( username.length ) {
					document.getElementById( "login-password" ).focus();
				}
			}
		} );
	},

	logout : function ( e ) {
		if ( AoPS.login.ajaxing ) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		AoPS.login.user_clicked_logout = true;

		AoPS.login.ajaxing = true;
		var url = AoPS.protected_url + "ajax.php";
		var protocol = location.protocol;
		if ( typeof protocol !== "undefined" && protocol.indexOf( "https" ) < 0 ) {
			url = url.replace( "https", "http" );
		}
		$.ajax( {
			url : url,
			timeout : 10000,
			type : "post",
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			data : {
				a : "logout"
			},
			success : function( data ) {
				AoPS.login.ajaxing = false;
				if (AoPS.login.logout_url) {
					window.location = AoPS.login.logout_url;
				} else {
					window.location.reload( true );
				}
			}
		} );
	},



	/**
	 * Log the user in
	 */

	loggedin : function() {
	},

	login : function( tryagain ) {
		// Prevent multiple click requests
		if ( AoPS.login.ajaxing ) {
			return;
		}
		AoPS.login.user_clicked_login = true;

		AoPS.login.ajaxing = true;


		// Call the Ajax server side script which will actually
		// log the user in or return an appropriate error.
		var url = AoPS.protected_url + "ajax.php";
		if ( typeof( tryagain ) !== "undefined" && tryagain === true ) {
			var protocol = location.protocol;
			if ( typeof protocol !== "undefined" && protocol.indexOf( "https" ) < 0 ) {
			    url = url.replace( "https", "http" );
			}
		}
		$.ajax( {
			url : url,
			timeout : 10000,
			type : "post",
			data : {
				a : "login",
				username : $( "#login-username" ).val(),
				password : $( "#login-password" ).val(),
				stay : $( "#login-stay-logged-in" ).is( ":checked" )
			},
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			success : function ( data ) {
				setTimeout( function() {
					AoPS.login.ajaxing = false;
				}, 1000 );
				if ( data.error_msg ) {
					$( "#login-form > .error" ).show().html( data.error_msg );
					$( "#login-message" ).text( "" );
				} else if ( data.error_code ) {
					$( "#login-from > .error" ).show().html( data.error_code );
					$( "#login-message" ).text( "" );
				} else {
					document.location.reload(true);
				}
			},
			error : function ( data ) {
				if ( typeof( tryagain ) !== "undefined" && tryagain === true ) {
					AoPS.login.user_clicked_login = false;

					setTimeout( function() {
						AoPS.login.ajaxing = false;
					}, 1000 );
					$( "#login-form > .error" )
						.show()
						.html( "There was an error communicating with the server. Please try again." );
					$( "#login-message" ).text( "" );
				} else {
					AoPS.login.ajaxing = false;
					AoPS.login.login( true );
				}
			}
		} );
	},



	close : function () {
		AoPS.Ui.Modal.closeAllModals();
		$( document ).off( "keyup", AoPS.login.checkKeyPress );
	},



	display : function( cancel ) {
		cancel = cancel === false ? false : true;

		// If login form not loaded, need to go to login page.
		if (AoPS.login.$login_form.length == 0) {
			window.location.href = '/user/login.php?redirect=' + encodeURIComponent(window.location.href);
		}

		// Show or display cancel button
		$( "#login-cancel-button" ).toggle( cancel );

		$( "#login-message" ).text( "" );
		$( "#login-password" ).attr( "type", "password" );

		AoPS.login.$login_form.showPlainModal( {
			max_width : "500px",
			closeX : cancel,
			force_response : !cancel,
			scrollable : false
		} );

		setTimeout( function () {
			$( "#login-username" ).focus();
		}, 1);

		if ( cancel ) {
			$( document ).on( "keyup", AoPS.login.checkKeyPress );
		}
	},


	facebook : function() {
		if ( AoPS.login.ajaxing ) {
			return false;
		}

		AoPS.login.ajaxing = true;

		$.post( AoPS.protected_url + "ajax.php", {
			a : "facebook-login",
			redirect_uri : window.location.href
		}, function ( data ) {
			setTimeout( function() {
				AoPS.login.ajaxing = false;
			}, 1000 );

			if ( data.error_msg ) {
				$( "#login-form > .error" ).show().html( data.error_msg );
				$( "#login-message" ).text( "" );
			} else if ( data.error ) {
				$( "#login-from > .error" ).show().html( data.error );
				$( "#login-message" ).text( "" );
			} else {
				window.location.href = data.response.url;
			}
		} );
	},



	checkKeyPress : function ( e ) {
		if ( e.keyCode === 27 ) {
			AoPS.login.close();
		}
	},



	/**
	 * Call this function if Ajax has decided you are logged out.
	 *  Resets the Log In/User header and resets the action for clicking on that
	 *  header.
	 **/
	onUserAjaxLogout : function () {
		if ( ! AoPS.session.logged_in ) {
			$( "#header .myaops" ).remove();
			$( "#header-login" ).show();
		}
	},



	/**
	 * Call this function if Ajax has decided you are logged in.
	 *  Resets the header and resets the action for clicking on that
	 *  header.
	 **/
	onUserAjaxLogin : function () {
		document.location.reload(true);
	}
};


// Set up drop down menus
$( function() {
	var $dropdowns = $( ".header-menu, .myaops" );

	var touching = false;

	/**
	 * Mouse events
	 *
	 * @description Mimic hoverIntent plugin by waiting for the mouse to 'settle' within the target before triggering
	 */
	$dropdowns
		.on( "click", function ( e ) {
			if ( touching ) {
				e.preventDefault();
				e.stopPropagation();
			}

			// Deal with clicks on my aops menu which differs from regular menus
			// e.target points to the dom clicked, currentTarget points to myaops
			if ( e.target.className.indexOf( "username" ) >= 0 ) {
				if ( e.currentTarget.className.indexOf( "open" ) > 0 ) {
					e.currentTarget.className = e.currentTarget.className.replace( "open", "" );
				} else {
					e.currentTarget.className += " open";
				}
				e.stopPropagation();
				e.preventDefault();
			}
		} )
		.on( "mouseover", function ( e ) {
			if ( touching ) {
				e.preventDefault();
				return;
			}

			var $this = $( this );
			if ( $this.prop( "hoverTimeout" ) ) {
				$this.prop( "hoverTimeout", clearTimeout( $this.prop( "hoverTimeout" ) ) );
			}

			$this.prop( "hoverIntent", setTimeout( function () {
				$this.addClass("open");
			}, 50 ) );
		} )
		.on( "mouseleave", function ( e ) {
			if ( touching ) {
				e.preventDefault();
				return;
			}

			var $this = $( this );

			if ($this.prop( "hoverIntent" ) ) {
				$this.prop( "hoverIntent", clearTimeout( $this.prop( "hoverIntent" ) ) );
			}

			$this.prop( "hoverTimeout", setTimeout( function() {
				$this.removeClass( "open" );
			}, 50 ) );
		} );

		/**
		 * Touch events
		 *
		 * @description Support click to open if we're dealing with a touchscreen
		 */
		var event = window.navigator.msPointerEnabled ? "MSPointerDown" : "touchstart";
		if ( "ontouchstart" in document.documentElement || event === "MSPointerDown" )
		{
			$dropdowns.each( function () {
				var $this = $( this );

				this.addEventListener( event, function ( e ) {
					if (event === "MSPointerDown" || e.touches.length === 1) {

					// Prevent touch events within dropdown bubbling down to document
					e.stopPropagation();

					// Toggle hover
					if ( ! $this.hasClass( "open" ) ) {
						// Prevent link on first touch
						touching = true;
						if ( e.target === this || e.target.parentNode === this ) {
							e.preventDefault();
						}

						// Hide other open dropdowns
						$dropdowns.removeClass( "open" );
						$this.addClass( "open" );

						// Hide dropdown on touch outside
						document.addEventListener( event, closeDropdown = function ( e ) {
							e.stopPropagation();
							$this.removeClass( "open" );
							document.removeEventListener( "touchstart", closeDropdown );
							touching = false;
						} );
					} else {
						// Allow next touch to act as a click
						touching = false;
					}
				}
			}, false);
		});
	}
});




/**
 * Updates the footer and side bar to appropriate positions and sizes.
 * What a pain in the but this was. And it's not even done yet becase
 * we have not taken into account the small footer. We'll deal with
 * that when the time comes.
 * NVM...not used.
 */
AoPS.updateLayout = function() {
	return;
}

if ( typeof Backbone !== "undefined" )
{
	AoPS.Model = Backbone.Model.extend( {

	} );

	AoPS.Collection = Backbone.Collection.extend( {
		debug : function () {
			console.log(this);
			console.log(this.length);
			console.log(this.models);
		}
	} );



	AoPS.View = Backbone.View.extend( {
		getTemplate : function( template_selector, data ) {
			var template = AoPS.View.compileTemplate(template_selector);
			return $.parseHTML( $.trim( template && template( data ) ) );
		},



		/**
		 * Compile handlebars template
		 *
		 * @return {function}
		 */
		compile : function( template_selector ) {
			return AoPS.View.compileTemplate(template_selector);
		},


		/**
		 * Display the view
		 *
		 * @param {function} Handlebars template function
		 * @param {object} Data to send to handlebars template
		 */
		display : function( template, data ) {
			this.$el.html( $.parseHTML( $.trim( template( data ) ) ) );
		},



		debug : function( ) {
			console.log("View.model:", this.model);
			console.log("View.tagName:", this.tagName);
			console.log("View.className:", this.className);
			console.log("View.el:", this.el);
			console.log("View.$el:" , this.$el);
		},

		hide : function () {
			this.$el.hide();
		},

		show : function () {
			this.$el.show();
		},

		close : function () {
			this.remove();
			this.unbind();
			if ( "function" === typeof this.onClose ) {
				this.onClose();
			}
		}
	} );

	AoPS.View.template_cache = {};
	// Memoized template compiling function. You can use this function even
	// without being in AoPS.View to share the global cache with everyone else.
	AoPS.View.compileTemplate = function (template_selector) {
		var cache = AoPS.View.template_cache;

		if (!cache.hasOwnProperty(template_selector)) {
			var direct = $(template_selector);
			var precompiled = Handlebars.templates && Handlebars.templates[template_selector.slice(1)]; // Remove the #
			if (direct.length) {
				cache[template_selector] = Handlebars.compile(direct.html());
			} else if (precompiled) {
				cache[template_selector] = precompiled;
			}
		}
		return cache[template_selector];
	}

}



/**
 * Clear input placeholders. This is needed for IE 8 and 9. Yes, even 9. grrr.
 */
AoPS.inputPlaceholders = {
	initialize : function() {
		if ( ! ( "placeholder" in document.createElement( "input" ) ) ) {

			// Set up quantity placeholders (shiv for IE 8 and 9)
			$("[placeholder]").focus(function() {
			  var input = $(this);
			  if (input.val() == input.attr("placeholder")) {
				input.val("");
				input.removeClass("placeholder");
			  }
			}).blur(function() {
			  var input = $(this);
			  if (input.val() == "" || input.val() == input.attr("placeholder")) {
				input.addClass("placeholder");
				input.val(input.attr("placeholder"));
			  }
			}).blur();

			$( [ "placeholder" ] ).parents( "form" ).submit( AoPS.inputPlaceholders.clear );

			AoPS.inputPlaceholders.clear = function() {
				$( "[placeholder]" ).each( function () {
					var input = $( this );
					if ( input.val() === input.attr( "placeholder" ) ) {
						input.val( "" );
					}
				} );
			}
		}
	},

	clear : function() {}

};



/**
 * Speedy rendering of MathJax. Pass in a list of DOM elements, like a jQuery
 * object. The HTML inside each element will be replaced with the contents
 * after all MathJax has been rendered.
 *
 * @param elList. A jQuery object or an array of DOM elements.
 */
AoPS.doFastMathJax = function (elList) {
    AoPS.FastMathJax.push(elList);
};

// This is the helper that manages the global FastMathJax queue.
AoPS.FastMathJax = {
    _elements : [ ],
    _isProcessing : false,
    _process : function () {
        // Make sure that only one process is running.
        if (this._isProcessing) {
            return;
        } if (!this._elements.length) {
            this._isProcessing = false;
            return;
        } else {
            this._isProcessing = true;
        }

        // Create a hidden DIV and append it (important!)
        var $container = $('<div />').hide().appendTo($(document.body));
        var self = this, spliced = this._elements.splice(0, 250);

        // Let each spliced object know what its corresponding hidden element is
        _.each(spliced, function (obj) {
            obj.$hidden = obj.$el.clone().removeClass().appendTo($container);
        });

        // Render!
        MathJax.Hub.Queue([ "Typeset", MathJax.Hub, $container.get(0) ]);

        // Post render.
        MathJax.Hub.Queue([ function () {
            _.each(spliced, function (obj) {
                // Not using clone will cause Safari to get weird
                obj.$el.html('').append(obj.$hidden.clone());
                obj.$hidden.remove();
            });
            $container.remove();

            // Mark process as complete and clear out any leftovers.
            self._isProcessing = false;
            self._process();
        } ]);
    },
    push : function (input) {
        if (window.MathJax) {
            if (input instanceof jQuery || _.isArray(input)) {
                _.each(input, _.bind(function (el) {
                    this._elements.push({
                        $el : $(el),
                    });
                }, this));
            } else {
                this._elements.push({
                    $el : $(input),
                });
            }
            // We introduce a short delay before processing so that the flurry of elements can be queued.
            setTimeout(_.bind(function () { this._process(); }, this), 50);
        }
    }
};


/**
 * Dynamically load JavaScript file
 *
 * @param {string} uri
 */
AoPS.importJavaScript = function( uri ) {
	var dom = document.createElement( "script" );
	dom.setAttribute( "type", "text/javascript" );
	dom.setAttribute( "src", uri );
	document.getElementsByTagName( "head" )[ 0 ].appendChild( dom );
};



function number_format(number, decimals, dec_point, thousands_sep) {
  //  discuss at: http://phpjs.org/functions/number_format/

  number = (number + '')
    .replace(/[^0-9+\-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + (Math.round(n * k) / k)
        .toFixed(prec);
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
    .split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '')
    .length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1)
      .join('0');
  }
  return s.join(dec);
}


// An AoPS.refreshOnBackButtonLoadWithOldData function is defined here.
// Most browsers try to give you a cached version of the site if you access them
// via the back button. This is not good because it contains data that is out of
// date. This function tries to solve that. The fix requires users to have
// cookies enabled. If they do not have cookies turned on, they are out of luck
// and will see old data.
(function () {
    // No matter how many times AoPS.refreshOnBackButtonLoadWithOldData is called,
    //  this variable will be able to keep track of whether we have already tried to refresh.
    var already_tried_to_refresh = false;

    // This function will only ever fire once
    var refreshPage = function () {
        if (already_tried_to_refresh) return;
        already_tried_to_refresh = true;

        // Hide the page so that the user can't do crazy stuff while we're
        // waiting to refresh.
        // Do not just set display to none because it may be applied late.
        // document.getElementById("html").style.display = "none";
        var style = document.createElement("STYLE");
        var style_text = document.createTextNode("body {display: none;}");
        style.appendChild(style_text);
        document.head.appendChild(style);

        // Due to issues with users rapidly hitting the site that might have
        // been caused by this function (or might not have), we put a high
        // timeout interval on the window.location.reload to prevent it from
        // ever causing spammed requests on our site.
        // Even without the delay, a setTimeout of 0 is needed at minimum so
        // that the DOM manipulations above take effect.
        console.log("About to refresh the page due to back button use.");
        setTimeout(function () {
            window.location.reload(true);
        }, 2000);

        // Do not throw an error.
    };

    var getServerTime = function (server_time_bootstrap_name) {
        var server_time_raw = '' + AoPS.bootstrap_data[server_time_bootstrap_name];
        // If there isn't a valid time sent through from the backend, do not refresh.
        if (server_time_raw.indexOf(';') > -1) {
            return false;
        }
        return parseInt(server_time_raw) || false;
    };

    // Returns false if the cookie could not be found or is invalid or whatever.
    var getLastInitTimeCookie = function (this_name) {
        // Check if cookies are enabled.
        if (!document || _.isUndefined(document.cookie) || !navigator || !navigator.cookieEnabled) {
            return false;
        }

        // Check each cookie to see if it is the cookie we are looking for.
        // If it is, return it.
        var re = new RegExp('^\\s*' + this_name + '_init_time\\s*=\\s*(.*?)\\s*$');
        var cookies = document.cookie.split(';');
        var found;
        for (var i=0; i < cookies.length; i++) {
            found = cookies[i].match(re);
            if (found) {
                return parseInt(found[1]);
            }
        }

        return false;
    };

    var already_checked_for_old_data = false;
    AoPS.refreshOnBackButtonLoadWithOldData = function (this_name, server_time_bootstrap_name) {
        // Make sure we never do the code below more than once.
        if (already_checked_for_old_data) return;
        already_checked_for_old_data = true;

        // Parameter checking/defaults.
        if (!this_name) {
            return;
        }
        server_time_bootstrap_name = server_time_bootstrap_name || 'init_time';

        // Get the server time. This is a time sent by the server in the loaded
        // HTML through the bootstrap_data mechanism. If the user uses the back
        // button and the browser reloads the data sent before without hitting
        // our server again, this will be out of date.
        var server_time = getServerTime(server_time_bootstrap_name);
        // If we couldn't fetch the server time, there is no point in even
        // trying to refresh or set a new cookie. Stop.
        if (server_time === false) {
            return;
        }

        // Get the cookie time. This is the last known server time sent to the
        // user's device, i.e. we set its value to the server_time computed
        // above, not to the time the user's browser thinks it is. If this time
        // is equal to or exceeds the server time above, we know that the user's
        // browser reloaded old HTML in a cache and that a refresh is needed.
        var cookie_time = getLastInitTimeCookie(this_name);

        // If we fetched a valid cookie time and it is at least as high as the
        // server time sent on this page load, we know we need to refresh.
        if (cookie_time !== false && cookie_time >= server_time) {
            refreshPage();
            return;
        }

        // Wait 3 seconds before setting the cookie. If the user goes off the
        // page and then "Back" buttons to it within 3 seconds, whatever the
        // reloaded data is can't be so new that we want to reload.
        // If we're refreshing, we don't want to set the cookie, since that
        // risks an infinite loop.
        setTimeout(function () {
            if (already_tried_to_refresh) { return; }
            document.cookie = this_name + "_init_time=" + server_time + "; path=/";
        }, 3000);
    };
})();

AoPS.isUserLimited = function () {
	return (AoPS.session.role === 'limited_user');
};


AoPS.convertSmartQuotes = function( s ) {
	return s
		.replace( /[\u2018\u2019]/g, "'" )
		.replace( /[\u201C\u201D]/g, '"' )
		.replace( /[\u2013\u2014]/g, "-" )
		.replace( /[\u2026]/g, "..." );
};


if ( ! AoPS.bd || ! AoPS.bd.skipanalytics ) {
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-1905305-1', 'auto');
ga('send', 'pageview');
}



// Error logger
var gOldOnError = window.onerror;
window.onerror = function( msg, url, line, column, errorObj ) {
	/*
	if ( window.jQuery && msg && url && line ) {
		$.post( "/ajax.php", {
			action : "log-error",
			message : msg,
			url : url,
			line : line,
			column : column ? column : "Unknown",
			error : errorObj ? errorObj.stack : "none"
		} );
	}
	*/

	if ( gOldOnError ) {
		return gOldOnError( msg, url, line );
	}

	// Just let default handler run.
	return false;
}



window.onImageLoad = function() { ; }
