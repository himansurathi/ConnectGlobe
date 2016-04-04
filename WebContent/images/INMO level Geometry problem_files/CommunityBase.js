/**
 * Base.js Holds the router for the Community. It gets the ball rolling once the page is loaded.
 *
 * NOTE: This file is an experimental mess; I will clean it when we have design and
 *  I know for sure what routes we likely need.
 */

AoPS.refreshOnBackButtonLoadWithOldData('cmty');
 
AoPS.Community = (function(Community) {
	var Lang = AoPS.Community.Lang,
		Utils = AoPS.Community.Utils,
		Constants = AoPS.Community.Constants,
		Views = AoPS.Community.Views;
	
	
	Community.Router = Utils.routerBase.extend({
		routes : {
			'' : 'constructBaseView'
		},
		
		
		master_category_id : Community.Constants.master_category_id,

		breadcrumb_base : [{
			text : 'Community',
			url : '/community/',
			data : 'data-cmty'
		}],
		
		
		initialize : function (options) {
			var self = this;
			this.models = {};


			// Set some variables in the scope of the router for the 
			//  master Backbone model and its corresponding app_model
			
			// Add the master model to the models object.  
			this.models.master = options.master;
			this.models.master_category = this.models.master.fetchCategory(this.master_category_id);
			this.models.portal_category = this.models.master.fetchCategory(Constants.portal_category_id);
			
			/**
			 * In onFinishRoute, we scroll the window to the top of the page.  On some routes we don't want
			 *  to do that, so we have to squelch the jump back to the top of the page.  
			 **/
			this.scroll_to_top = true;
			this.listenTo(Backbone, 'squelch_scroll_to_top', function() {
				self.scroll_to_top = false;
			});
			// Get Page.js started.
			
			this.myPage = AoPS.Page.constructPage('community-all');
			this.myPage.hideBreadcrumbs();

			this.has_announcement = AoPS.bootstrap_data.hasOwnProperty('community_announcement');
			
			
			// This makes any call of the type c#t#f#h#p#s# (with all these letter-number pairs optional)
			//  go to this.parseEncodedUrl
			// Meanings of these are in url_parameters definitions above.
			/*this.route(/community\/((?:c\d+)?(?:t\d+)?(?:f\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			this.route(/community\/index\/((?:c\d+)?(?:t\d+)?(?:f\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			this.route(/community\/index.php\/((?:c\d+)?(?:t\d+)?(?:f\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			*/
			//this.route(/((?:u\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			this.route(/((?:c\d+)?(?:x\d+)?(?:u\d+)?(?:q\d+)?(?:t\d+)?(?:f\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			// Saving the below in case we wish to deal with category and user differently
//			this.route(/((?:[cu]\d+)?(?:t\d+)?(?:f\d+)?(?:h\d+)?(?:p\d+)?(?:s\d+)?)/, 'parseEncodedUrl');
			this.route('my-aops', 'constructMyAops');
			this.route(/^new-topic\/(.*)/, 'launchNewTopic');
			this.route('main', 'constructAoPSMasterCollection');
			this.route('my-bookmarks', 'constructMyBookmarks');
			this.route('my-messages', 'constructMyMessages');
			this.route('my-forums', 'constructMyForums');
			this.route('my-blogs', 'constructMyBlogs');
			this.route('my-collections', 'constructMyCollections');
		//	this.route('edit-profile', 'buildEditProfile');
			this.route(/^edit-profile(.*)/, 'startEditProfile');
			this.route('edit-settings', 'buildEditSettings');
			this.route('search', 'buildBlankSearchForm');
			this.route(/^search\/(.*)/, 'performSearch');
			this.route(/^search-forum\/(.*)/, 'performForumSearch');
			this.route('search-private', 'buildPrivateSearch');
			this.route(/^search-private\/(.*)/, 'performPrivateSearch');
			this.route(/^edit-search\/(.*)/, 'editSearch');
			this.route(/^unwatch\/(.*)/, 'unwatchHash');
			this.route(/^forum-user-search\/(.*)\/(.*)/, 'performForumUserSearch');
			
			this.route('memberlist', 'buildMemberlist');
			this.route(/^memberlist\/(.*)/, 'buildSeededMemberlist');
			this.route('faq', 'buildFAQ');
			
			
			this.route('portal', 'buildPortal');
			
			this.route('log', 'buildEmptyLog');
			this.route(/^log\/user\/(.*)/,'buildLogByUser');
			this.route(/^log\/topic\/(.*)/, 'buildLogTopic');
			this.route(/^log\/category\/(.*)/, 'buildLogCategory');
			
			
			this.route('terms', 'buildTermsPage');
			this.route('term', 'buildTermsPage');
			this.route('tagmap', 'buildTagMapPage');
			this.route('tagsmap', 'buildTagMapPage');
			this.route(/^tag\/(.*)/, 'buildTagInfo');
			this.route('tag', 'buildTagInfoSearch');
			this.route('tags', 'buildTagInfoSearch');
			this.route(/^my-messages-archive(.*)/, 'buildMyMessagesArchive');
			this.route(/^reported-posts(.*)/, 'onReportedPostsRoute');
			this.route(/^category-admin(.*)/, 'startCategoryAdmin');
			this.route(/^user(.*)/, 'startUserProfile');
			this.bind('route', this.onFinishRoute);
			this.previous_route = '';
			
			Backbone.on('logged_out', this.onAjaxDetectLogout);
			Backbone.on('logged_in', this.onAjaxDetectLogin);
			this.router_counter = 0;  // see this.takeAjaxDetour below 
			this.listenTo(this.models.master, 'move_to_topic', this.goToTopic);
			Backbone.on('destroy_topic_view', function (data) {
				self.onDestroyTopic(data);
			});
			this.$loader = AoPS.Page.buildLoader();	
			this.breadcrumb_history = [];
			this.continuing_from_ajax = false;
			this.is_admin_validated = (typeof AoPS.bootstrap_data.admin_validated === 'boolean' &&
				AoPS.bootstrap_data.admin_validated);
			/** During the first run through the router, we may need to do some housecleaning. **/
			this.first_pass = true;
			this.skip_finish_route = false;
			this.previous_topic_element_id = null;

			// If there is a preloaded topic for directly navigating to a topic on page load, 
			// then this will be set to the preloaded id when the preloaded data is parsed.  
			// We then set this back to -1 once the preloaded topic is set as the focus_topic.
			//  This flag is used to prevent a redundant Ajax call (change_focus_topic) when the topic is built.
			this.preloaded_topic_id = -1;
			
			if (this.models.master.get('current_user').get('hide_avatars')) {
				$('#main-content').addClass('cmty-hide-avatars');
			}
			this.listenTo(this.models.master.get('current_user'), 'change:hide_avatars', function () {
				$('#main-content').toggleClass('cmty-hide-avatars', self.models.master.get('current_user'));
			});
			
			$(window).on('touchmove.farfromtop scroll.farfromtop resize.farfromtop', function (e) {
				self.checkTopPosition();
			});
		},

		checkTopPosition : function() {
			var height = $('#header-wrapper').outerHeight() + parseInt($('#main-content').css('padding-top'));
			$('body').toggleClass('cmty-away-from-top', window.scrollY > height);
		},

		/**
		 * Handler for whenever an Ajax call is made as a necessary step in a page build.
		 *  We check when the Ajax call returns whether or not we are still on the route
		 *  that we were on when we made the call.  We squelch the onFinish handler for the 
		 *	Ajax call if we have moved on to another route.  This is designed to prevent 
		 *	the following from happening:
		 *		A) User visits a page which builds part-way and then makes an Ajax call
		 *			to get more data needed to build the rest of the page.
		 *		B) User clicks elsewhere while waiting for the data, thereby heading down 
		 *			another route.
		 *		C) First call returns, and the page continues building, thereby throwing
		 *			elements on the page that we don't want anymore.
		 *
		 * We tackle this by setting still_on_this_route, and whenever the router's
		 *	route event fires (which happens at the end of a route),
		 *  we check if we are still on this route.  We do so by keeping this.router_counter,
		 *  a counter of how many routes we have finished.  We also keep track of 
		 *  when code is being executed as the continuation of an ajax call.
		 ***/
		takeAjaxDetour : function (obj) {
			var still_on_this_route = true,
				settings = obj.hasOwnProperty('settings')? obj.settings : {},
				counter = this.router_counter, // counter at time of this ajax call
				handlers = ['onFinish', 'onError'],
				self = this,
				continuing_from_ajax = this.continuing_from_ajax, // Was this ajax call made as a continuation from an earlier Ajax call (some rare routes may need two Ajax calls to build a whole page)
				listener_handler = function () { //Assigned to variable so we can stop listening
					/**
					 * If we are continuing from an ajax call, then the router_counter
					 *  will already have incremented prior to this ajax call being made.
					 *  Otherwise, the router_counter will increment between the 
					 *  Ajax call initiation and its completion.
					 **/
					if (self.router_counter !== counter + (continuing_from_ajax ? 0 : 1)) {
						still_on_this_route = false;
					}
				},
				new_onFinish;
			
			this.listenTo(this, 'route', listener_handler);
			this.myPage.showLoader();
			
			_.each(handlers, function (handler) {
				settings[handler] = function (data) {
					self.continuing_from_ajax = true;
					if (obj.hasOwnProperty(handler)) {
						if (still_on_this_route) {
							obj[handler](data);
						} 	
					}
					self.stopListening(self, 'route', listener_handler);
					self.continuing_from_ajax = false;
				}
			});
			obj.func(settings);
			
		},
		
		/**
		 * Actions we take at the end of every route.  Fired by the router's 'route' event.
		 **/
		onFinishRoute : function (name, args) {
			if (this.skip_finish_route) {
				this.skip_finish_route = false;
				return;
			}
			this.previous_url = Backbone.history.fragment;
			this.previous_route = name;
			if (!this.keep_fullscreen_mode) {
				this.models.master.set('fullscreen_mode', 'none');
			}
			if (this.scroll_to_top)	{
				window.scrollTo(0,0);
			}
			this.scroll_to_top = true;

			this.checkTopPosition();
			$(window).trigger('resize');
			this.keep_fullscreen_mode = false;
			this.first_pass = false;
			this.stay_on_list = false;
			this.privates_top_built = false;
			this.router_counter++;
			
		},
		
		
		goToTopic : function (args) {
			var url = '/';
			if (args.hasOwnProperty('category_id')) {
				url += 'c' + args.category_id;
			} 
			
			url += 'h' + args.topic_id;
			this.navigate(url, {
				trigger : true,
				replace : true //(args.hasOwnProperty('replace') ? args.replace : false)
			});
		},

		onReportedPostsRoute : function (url) {
			var stripped_url,
				post_match,
				topic_match,
				target = {};
			
			if (!_.isNull(url) && url.length > 1) {
				stripped_url = url.substring(1);
				post_match = stripped_url.match(/p(\d+)/);
				if (!_.isNull(post_match) ) {
					target.post_id = parseInt(post_match[1]);
				} else {
					topic_match =  stripped_url.match(/h(\d+)/);
					if (!_.isNull(topic_match)) {
						target.topic_id = parseInt(topic_match[1]);
					}
				}
			}
			
			this.startNonTopicsPage();
			this.setWindowResizeAction(false);
			
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			}
			this.setTitle(Lang['page-title-reported-posts']);
			
			this.setBreadcrumbs([{
				text : Lang['breadcrumbs-reported-posts']
			}]);
			this.myPage.showElement({
				id : 'cmty-reported-posts',
				constructor : _.bind(function () {
						return new Views.PostReports({
							model : this.models.master
						});
					}, this),
				on_add_settings : target
			});	
			
		},
		
		/**
		 * Unwatch a topic, tag, or forum.  All the work is on the back end.
		 *  All we do here is process what happens there.
		 **/
		unwatchHash : function (url) {
			var unwatch_result = AoPS.bootstrap_data.unwatch_result;
			if (!unwatch_result.success) {
				this.throwError(Lang['router-err-unwatch-' + unwatch_result.error_code]);
			} else {
				this.throwError(Utils.formatString(Lang['unwatch-success'], [unwatch_result.type]));		
			}
		},
		
		
		
		constructMyMessages : function () {
			var category;
			
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 

			category = this.models.master.get('my_privates');
			this.models.master.set('focus_category', category);
			
			// Needed to allow going from PM archive to main PM.
			//  If we don't delete previous_coords, then the router will
			//  think we're still in the same category.
			delete this.previous_coords; 
			this.parseEncodedUrl('c1');
			
		},
		
		/**
		 * For archived messages, we perform a little magic.  If we aren't looking at
		 *  a specific topic, then the url will be
		 *  aops.com/community/my-messages-archive/{t#f#}  (the tag info is optional)
		 *
		 * @param string portion of url after "my-messages-archive"
		 *
		 * If the topic is set, then the url will be the same as if the topic were not 
		 *	archived.  We check later if the topic is archived and reroute accordingly.
		 */
		buildMyMessagesArchive : function (url) {
			var category,
				tag_id = 0,
				self = this,
				tag_forum_id = 0;
			
			function continueBuilding () {
				self.models.master.set('focus_category', category);

				self.checkTagThenContinue({
					category : category,
					category_id : AoPS.Community.Constants.private_messages_id,
					tag_id : tag_id,
					tag_forum_id : tag_forum_id,
					topic_id : 0,
					archive : true
				});
			}
			
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 	
			category = this.models.master.get('my_privates_archive');

			this.myPage.clearPage();
			this.models.master.set('focus_topic', null);
				
			if (!_.isNull(url) && url.length > 1) {
				url = url.substr(1);
				tag_id = Utils.extractValueFromUrl('t', url);
				tag_forum_id = Utils.extractValueFromUrl('f', url);
			}
			
			// If we haven't loaded the private messages items (tags), then
			//  we go get them before building the page.			
			if (!this.models.master.get('private_items_fetched')) {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.fetchPrivateItems, this.models.master),
					onFinish : function () {
						self.myPage.hideLoader();
						continueBuilding();
					}
				});
			
				
			} else {
				continueBuilding();
			}
		},
		
		startNonTopicsPage : function(obj) {
			var settings = _.extend({
				reset_breadcrumbs : true
			}, obj);
		
			// Will this fly if it's not already defined?
			delete this.current_topic_list;
			this.myPage.clearPage();
			if (settings.reset_breadcrumbs) {
				this.breadcrumb_history = [];
			}
			this.models.master.set('focus_topic', null);
			
		},
		
		/**
		 * Construct the My AoPS page.
		 */
		constructMyAops : function () {
			var user;
			
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 	
			
			user = this.models.master.get('current_user');

			this.startNonTopicsPage();
			/*this.buildCoreCommunityBreadcrumbs(this.models.master.get('my_aops'), {
				url : 'my-aops'
			});*/

			this.setBreadcrumbs([{
				url : '/community/my-aops',
				text : Lang['my-profile-home']
			}, {
				text : Lang['Profile']
			}]);
				
			this.setWindowResizeAction(false);
			this.myPage.setClass('cmty-page-my-aops cmty-page-my-profile');
			this.constructMyAopsTop();
			this.setTitle(Lang['page-title-my-aops']);
			this.myPage.showElement({
				id : 'cmty-user-profile-' + user.get('user_id'),
				constructor : function () {
					return new Views.UserProfile({
						model : user
					});
				}
			});
		},
		
		/**
		 * Build the top of My AoPS -- user data and navigation.
		 **/
		constructMyAopsTop : function () {
			this.myPage.showElement({
				id : 'cmty-myaops-top',
				constructor : _.bind(function () {
						return new Views.MyAoPSTop({
							model : this.models.master
						});
					}, this)
			});
		},
		
		
		/**
		 * Construct the My Forums page.
		 **/
		constructMyForums : function () {
			this.buildMyAopsSubpage('my-forums', 'FolderMyForums');
		},
		
		/**
		 * Construct the My Bookmarks page.
		 **/
		constructMyBookmarks : function () {
			this.buildMyAopsSubpage('my-bookmarks', 'FolderMyBookmarks');
		},
		
		/**
		 * Construct the My Blogs page.
		 **/
		constructMyBlogs : function () {
			this.buildMyAopsSubpage('my-blogs', 'FolderMyBlogs');

		
		},
		
		/**
		 * Construct the My Collections page.
		 **/
		constructMyCollections : function () {
			this.buildMyAopsSubpage('my-collections', 'FolderMyCollections');

		
		},
		
		/**
		 * Construct one of the tabs of the My AoPS.
		 * Used for bookmarks and the three "My **" tabs.
		 *
		 * @param string my-forums|my-bookmarks|my-blogs|my-collections
		 * @param string Property of Views to use to construct this.
		 **/
		buildMyAopsSubpage : function (subpage, view) {
			var self = this,
				master_property = subpage.replace('-', '_');
				category = this.models.master.get(master_property);
			function finishBuilding (constructed_category) {
				this.breadcrumb_history = [];
				self.buildCoreCommunityBreadcrumbs(self.models.master.get('my_aops'), {
					url : 'my-aops'
				});
				self.buildCoreCommunityBreadcrumbs(constructed_category, {
					url : subpage
				});
				self.myPage.hideLoader();
				self.setTitle(constructed_category.get('category_name'));
				self.myPage.showElement({
					id : 'cmty-category-' + subpage + '-top',
					constructor : function () {
							return new (Views[view])({
								model : constructed_category
							});
						}
				});
			
			}
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 	
			
			this.startNonTopicsPage({
				reset_breadcrumbs : false
			});
			
			
			this.myPage.setClass('cmty-page-my-aops cmty-page-' + subpage);
			this.setWindowResizeAction(false);
			
			this.constructMyAopsTop();
			
			if (!_.isNull(category)) {
				finishBuilding(category);
			} else {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.fetchMyAopsCategory, this.models.master),
					settings : {
						category : master_property
					},
					onFinish : function (data) {
						finishBuilding(data.constructed_category);					
					}
				});
				
				
			}
		
		},
		
	
		
		/** START USER PROFILE **/
		/**
		 * Start building the User Profile page.
		 *
		 * @param string -- the url after "user"
		 *
		 * We can fetch by username or by user_id, and admins can search by email.
		 **/
		startUserProfile : function (url) {
			var user_identifier = (url.substring(1)),
				user,
				self = this;
			
			function continueBuildingUserProfile (user_model) {
				if (AoPS.session.logged_in && (user_model === self.models.master.get('current_user'))) {
					self.constructMyAops();
				} else {
					self.buildUserProfile(user_model);
				}
			}
			this.startNonTopicsPage({
				reset_breadcrumbs : true
			});
			
			user = this.models.master.fetchUser(user_identifier);
			
			if (_.isUndefined(user)) {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.buildUser, this.models.master),
					settings : {
						user_identifier : user_identifier
					},
					onFinish : function (data) {
						continueBuildingUserProfile(data.user_model);
					}, 
					onError : function (msg) {
						if (msg.error_code === 'E_NO_SUCH_USER') {
							self.throwError(AoPS.Community.Utils.formatString(Lang['user-profile-no-such-user'], [user_identifier]));
						} else {
							self.throwError(Lang['unexpected-error-code'] + msg.error_code);
						}
					}
				});
				
				
				
			} else {
				continueBuildingUserProfile(user);
			}
		},
		
		
		
		buildUserProfile : function (user) {
			if (_.isUndefined(user)) {
				// TODO : error
			}
			// Here is where we make the page.
			
			// TODO : If previous was a topic, maybe make the breadcrumbs include that?
			this.myPage.hideLoader();
			
			this.myPage.setClass('cmty-page-user-profile');
			this.setTitle(user.get('username') + Lang['user-profile-browser-title']);
			this.setWindowResizeAction(false);
			this.setBreadcrumbs([{
				text : user.get('username')
			}]);
			this.myPage.showElement({
				id : 'cmty-user-profile-' + user.get('user_id'),
				constructor : function () {
					return new Views.UserProfile({
						model : user
					});
				}
			});
			// Put the user in the breadcrumbs
		},
		
		
		/**
		 * Build the edit profile page for the currently logged-in user
		 **/
		buildEditProfile : function () {
			var self = this;
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 		
			this.constructEditProfilePage(this.models.master.get('current_user'));
		},
		
		constructEditProfilePage : function (user) {
			var is_current_user = (user === this.models.master.get('current_user'));
			
			this.startNonTopicsPage({
				reset_breadcrumbs : true
			});
			this.setWindowResizeAction(false);

			
			if (is_current_user) {
				this.constructMyAopsTop();
			
				this.myPage.setClass('cmty-page-my-aops cmty-page-edit-profile');
				this.setMyAoPSBreadcrumbs([{
					text : Lang['router-edit-profile-crumb'],
					url : 'edit-profile'
				}]);
				this.setTitle(Lang['router-edit-profile-crumb']);
			} else {
				this.setMyAoPSBreadcrumbs([{
					text : Lang['router-edit-profile-crumb'],
					url : 'edit-profile/' + user.get('user_id')
				}]);
				this.setTitle(Lang['router-edit-profile-crumb'] + ' ' + user.get('username'));
			}
			this.myPage.showElement({
				id : 'cmty-edit-profile-' + user.get('user_id'),
				constructor : function () {
					return new Views.EditUserProfile({
						model : user
					});
				}
			});
		
		},
		
		
		startEditProfile : function (url) {
			var user_identifier,
				user,
				self = this;
			
			if (_.isNull(url)) {
				this.buildEditProfile();
				return;
			} else {
				user_identifier = (url.substring(1));
			}
			function continueBuildingUserProfile (user_model) {
				if (AoPS.session.logged_in && (user_model === self.models.master.get('current_user'))) {
					self.constructMyAops();
				} else {
					self.constructEditProfilePage(user_model);
				}
			}
			
			
			// NEED permission check to block going any further if no perms to edit
				
			user = this.models.master.fetchUser(user_identifier);
		
			if (_.isUndefined(user)) {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.buildUser, this.models.master),
					settings : {
						user_identifier : user_identifier
					},
					onFinish : function (data) {
						continueBuildingUserProfile(data.user_model);
					}, 
					onError : function () {
						self.throwError(AoPS.Community.Utils.formatString(Lang['user-profile-no-such-user'], [user_identifier]));
					}
				});
				
				
				
			} else {
				continueBuildingUserProfile(user);
			}
		},
		
		
			/**
		 * Build the edit profile page for the currently logged-in user
		 **/
		buildEditSettings : function () {
			var self = this;
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			} 		
			this.startNonTopicsPage({
				reset_breadcrumbs : true
			});
			
			
			this.constructMyAopsTop();
			
			this.myPage.setClass('cmty-page-my-aops cmty-page-edit-settings');
			this.setWindowResizeAction(false);
			this.setMyAoPSBreadcrumbs([{
				text : Lang['router-edit-settings-crumb'],
				url : 'edit-settings'
			}]);
			this.setTitle(Lang['router-edit-settings-crumb']);
			this.myPage.showElement({
				id : 'cmty-edit-community-settings',
				constructor : function () {
					return new Views.EditCommunitySettings({
						model : self.models.master.get('current_user')
					});
				}
			});
			
		},
		
		/** END USER PROFILE **/
		
		
		/** START CATEGORY ADMIN FUNCTIONS **/
		
		
		startCategoryAdmin : function (url) {
			var category,
				containers,
				category_id,
				self = this,
				input;
			this.myPage.clearPage();
			
			// Not a direct-to-link navigation; we know what category we came from.
			//  Capture its url here before we go through the ajax and
			//  reset previous_url
			if (typeof this.previous_url === 'string') {
				this.breadcrumb_trail = this.previous_url;
			}
			input = url.substring(1);
			// TODO : Not logged in.
			this.startNonTopicsPage();
			this.setWindowResizeAction(false);
			if (isNaN(input)) {
				// We are given a type, not a category.
				// Build the construct-a-category page
				
				if (this.models.master.validateConstructCategory({
					'type' : input,
					'onError' : function (err_code) {
						if (err_code === 'E_NO_PERMISSION') {
							self.throwNoPermissions();
						} else if (err_code === 'E_BAD_TYPE') {
							self.throwError(Lang['router-err-cat-admin-no-create-type'] + '<b>' + input + '</b>.');
						}
					}
				})) {
					category = this.models.master.constructNewCategory({
						'category_type' : input,
						'permissions' : {
							'c_can_edit_owner' : true,
							'c_can_edit_contributor' : true,
							'c_can_edit_deny' : true,
							'c_can_edit_mod' : true,
							'c_can_edit_reader' : true,
							'c_can_edit_registered_user' : true,
							'c_can_edit_core_data' : true,
							'c_can_lock_category' : true,
							'c_can_add_item' : true,
							'c_can_remove_item' : true,
							'c_can_set_role_inherit' : (input !== 'blog')
						}
					});
					
					if (_.indexOf(['blog', 'forum', 'forum_class'], input) === -1) {
						category.set('is_locked', true);
					}
					
					/*RR remove 1/31/15
					containers = this.models.master.getDefaultContainers(input);
					category.constructContainersModel(containers);*/
					this.buildCategoryAdmin(category);
				}
			} else { // Category ID submitted
				category_id = parseInt(input);
				category = this.models.master.fetchCategory(category_id);

				/**
				 * Someday I may flatten this into a single Ajax call, but 
				 *  99.9% of the time we are calling the category admin/info page, we'll
				 *  be doing so when we already have the category loaded.
				 **/
				
				if (_.isUndefined(category)) { 
					this.takeAjaxDetour({
						func : _.bind(this.models.master.buildCategory, this.models.master),
						settings : {
							category_id : category_id
						},
						onFinish : function (response) {
							self.loadCategoryAdminData(response.category);
						},
						onError : function (msg) {
							self.processError(msg.error_code);
						}
					});
				} else { // We have the category object, rock on.
					self.loadCategoryAdminData(category);
				}
			}
			
		
		},
		
		/**
		 * Go get the admin-level data, then build the page
		 **/
		loadCategoryAdminData : function (category) {
			var self = this;
			/*this.myPage.showElement({
					id : 'cmty-category-simple-title-' + category.get('category_id') + '-' + category.cid,
					constructor : _.bind(function () {
							return new Views.BasicCategoryTitleBar({
								model : category
							});
						}, this)
				});*/
			
			this.takeAjaxDetour({
				func : _.bind(category.fetchCategoryAdminData, category),
				onFinish : function () {
					self.buildCategoryAdmin(category);
				},
				onError : function (msg) {
					self.processError(msg.error_code);
				}
			
			});
			
			
		},
		
		buildCategoryAdmin : function (category) {
			var breadcrumb_title,
				breadcrumbs = [];
			this.myPage.hideLoader();
			switch (category.get('category_type')) {
				case 'my_blogs':
				case 'my_forums':
				case 'my_collections':
					breadcrumbs = [{
						url : '/community/my-aops',
						text : Lang['my-profile-home']
					}];
				break; 
				
				case 'bookmark_forums':
				case 'bookmark_users':
				case 'bookmark_topics':
				case 'bookmark_tags':
					breadcrumbs = [{
						url : '/community/my-aops',
						text : Lang['my-profile-home']
					}, {
						url : '/community/my-bookmarks',
						text : Lang['Bookmarks']
					}];
				break;
				
				default:
				
				break;
			}

			this.myPage.showElement({
					id : 'cmty-category-simple-title-' + category.get('category_id') + '-' + category.cid,
					constructor : _.bind(function () {
							return new Views.CategoryAdminTitleBar({
								model : category
							});
						}, this)
				});	

			if (category.get('category_id') === 0) {
				this.myPage.showElement({
					id : 'cmty-category-create',
					no_save : true,
					constructor : _.bind(function () {
							return new Views.CategoryAdmin({
								model : category
							});
						}, this)
				});	
				breadcrumb_title = Lang['create'] + ' ' + 
					AoPS.Community.Utils.displayCategoryType(category.get('category_type'));
			} else {
				
				this.myPage.showElement({
					id : 'cmty-category-info-' + category.get('category_id'),
					save_element : false,// maybe not?  Depends if I realtime update things like users and items.
					constructor : _.bind(function () {
							return new Views.CategoryAdmin({
								model : category
							});
						}, this)
				});	

				if (typeof this.breadcrumb_trail === 'string') {
					breadcrumbs.push({
						url : '/community/' + this.breadcrumb_trail,
						text : category.get('category_name')
					});
				}
				breadcrumb_title = category.get('category_name') + ' ' + Lang['Info'];
				
			}
			breadcrumbs.push({
				'text' : breadcrumb_title 
			});
			this.setBreadcrumbs(breadcrumbs);
		},

		
		/** END CATEGORY ADMIN FUNCTIONS **/
		
		
		buildCoreCommunityBreadcrumbs : function (category, settings) {
			var last_category,
				length = this.breadcrumb_history.length,
				penultimate_category,
				category_url,
				category_id = category.get('category_id'),
				category_name = category.get('category_name'),
				breadcrumbs;

			if (arguments.length === 1 && 
				(category === this.models.master.get('my_privates_archive'))) {
				category_url = '/community/my-messages-archive';					
			} else if (arguments.length === 2 && settings.hasOwnProperty('url')) {
				category_url = '/community/' + settings.url;
			} else if (category.get('category_type') === 'user_search_posts') {
				category_url = '/community/u' + category.get('user_id');
			} else if (category.get('category_type') === 'search') {
				category_url = '/community/q' + category.get('search_id');
			} else {
				category_url = '/community/c' + category_id + '_' 
					+ Views.convertToUrlFragment(category_name);
			}

			if (length === 0) {
				this.breadcrumb_history.push({
					text : category_name,
					url : category_url,
					category : category,
				});
			} else {
				last_category = this.breadcrumb_history[length - 1];
				/***
				 * If we are heading to a new category, then we have three possibilities to consider:
				 *	C) Last category and new category are both fora: clip the last category
				 *		from the breadcrumb history
				 *  B) New category matches the penultimate category;
				 *		snip the last category from the history
				 *	A) New category doesn't match the penultimate;
				 *		add the category to the end.
				 **/
				if (last_category.category !== category) {
					if (last_category.category.get('is_forum') && category.get('is_forum')) {
						this.breadcrumb_history = _.initial(this.breadcrumb_history);
						length -= 1;
					}

					if ((length <= 1) || (this.breadcrumb_history[length - 2].category !== category)) {
						this.breadcrumb_history.push({
							text : category_name,
							url : category_url,
							category : category
						});
						
					} else { // Only get here if category matches penultimate.  Trim the last entry
						this.breadcrumb_history = _.initial(this.breadcrumb_history);
					}				
				}
			}
			
			breadcrumbs = _.last(this.breadcrumb_history, 2);

			if (arguments.length === 2 && settings.hasOwnProperty('extra_crumbs')) {
				breadcrumbs = breadcrumbs.concat(settings.extra_crumbs);
			}

			if (breadcrumbs[breadcrumbs.length - 1].hasOwnProperty('url')) {
				var old_crumb = _.clone(breadcrumbs.pop());
				delete old_crumb.url;
				breadcrumbs.push(old_crumb);
			}

			/***
			 * For the special categories in My AoPS, we sometimes need to
			 *  tack a few crumbs at the start
			 **/
			if (breadcrumbs.length > 0) {
				if (breadcrumbs[0].hasOwnProperty('category')) {
					switch (breadcrumbs[0].category.get('category_type')) {
						case 'my_bookmarks':
						case 'my_forums':
						case 'my_collections':
							breadcrumbs.unshift({
								url : '/community/my-aops',
								text : Lang['my-profile-home']
							});
						break;

						
						case 'bookmark_forums':
						case 'bookmark_users':
						case 'bookmark_topics':
						case 'bookmark_tags':
							breadcrumbs.unshift({
								url : '/community/my-bookmarks',
								text : Lang['Bookmarks']
							});
							breadcrumbs.unshift({
								url : '/community/my-aops',
								text : Lang['my-profile-home']
							});
						break;
					}
				}
			}
			
			this.setBreadcrumbs(breadcrumbs);
		
		},
		
		setMyAoPSBreadcrumbs : function (new_crumbs) {
			var my_aops = this.models.master.get('my_aops'),
				crumbs = [{
					text : my_aops.get('category_name'),
					url : '/community/my-aops',
					category : my_aops
				}];
			crumbs = crumbs.concat(new_crumbs);
			this.setBreadcrumbs(crumbs);
		},
		
		
		/**
		 * constructFolder makes a page for a single category that is a folder.
		 * (A folder is a category that holds other categories.)
		 *
		 * @param category: Community.Models.Category of the category whose page we're about to build.
		 */
		constructFolder : function (category) {	
			var page_class;
			if (category === this.models.master_category) {
				this.constructAoPSMasterCollection();
				return;
			} else if (category === this.models.portal_category) {
				this.buildPortal();
				return;
			}
			
			page_class = 'cmty-page-folder';
			function buildPage() {
				this.myPage.hideLoader();
				
				this.buildCoreCommunityBreadcrumbs(category);
				this.setTitle(_.unescape(category.get('category_name')));
				this.myPage.showElement({
					id : 'cmty-category-' + category.get('category_id') + '-top',
					constructor : function () {
							return new Views.Folder({
								model : category
							});
						}
				});
			}
			
			
			
			this.startNonTopicsPage({
				reset_breadcrumbs : false
			});
			if (category.get('category_type') === 'bookmark_forums') {
				this.constructMyAopsTop();
				page_class += ' cmty-page-my-aops cmty-page-my-bookmarks';
			}
			
			if (category.get('category_type') === 'bookmark_users') {
				page_class += '  cmty-page-my-aops  cmty-page-my-bookmarks';
				this.constructMyAopsTop();
			} 

			this.myPage.setClass(page_class);
			
			//Must come before the call to setPage so that window size is set.
			this.setWindowResizeAction(false);
		//	if (category.get('subcategories_data_loaded')) {
				buildPage.apply(this);
		/*	} else {
				this.myPage.showLoader();
				this.listenToOnce(category, 'change:subcategories_data_loaded', _.bind(function () {
					buildPage.apply(this);
				}, this));
				category.fillCategoriesCollection();
			}*/
		},
		
		/**
		 * constructViewPosts makes a page for a single category that is a collection of posts.
		 *
		 * @param category: Community.Models.CategoryViewPosts of the category whose page we're about to build.
		 */
		constructViewPosts : function (category) {	
			function buildPage() {
				this.myPage.hideLoader();
				
				this.buildCoreCommunityBreadcrumbs(category);
					
				this.myPage.showElement({
					id : 'cmty-category-' + category.get('category_id') + '-top',
					constructor : function () {
							return new Views.ViewPosts({
								model : category
							});
						}
				});
			}
			this.startNonTopicsPage({
				reset_breadcrumbs : false
			});

			this.myPage.setClass('cmty-page-view-posts');
			
			this.setWindowResizeAction(false);
			buildPage.apply(this);
		},
		
		/**
		 * The AoPS Master Collection and the AoPS Olympiad Portal have the same start
		 *  So does the memberlist.  So does the FAQ
		 **/
		startMainPage : function () {
			var self = this,
				category = this.models.master_category;
			
			this.startNonTopicsPage();
			document.title = 'AoPS Community';
			this.myPage.showLoader();
			AoPS.Community.Utils.cmty_ajax.cancelAll({cancel_type : 'master'});
			this.myPage.setClass('cmty-page-folder');
			//Must come before the call to setPage so that window size is set.
			this.setWindowResizeAction(false);
			this.myPage.hideBreadcrumbs();
			this.myPage.showElement({
				id : 'cmty-main-page-top',
				constructor : function () {
						return new Views.AoPSCollectionTop({
							model : self.models.master
						});
					},
				location : 'subheader'
			});
			
		},
		
		
		constructBaseView : function () {
			if (this.models.master.get('base_view') === 'main') {
				this.constructAoPSMasterCollection();
			} else {
				this.buildPortal();
			}
		},
		
		/**
		 * Build the master AoPS collection.
		 *
		 * This is different from other folders because we have some different crap at the top of the page.
		 *  Eventually.
		 */
		constructAoPSMasterCollection : function () {
			var self = this,
				category = this.models.master_category;
			
			this.startMainPage();
			

			this.constructMasterAndPortalTop();			
			
			this.myPage.showElement({
				id : 'cmty-category-' + category.get('category_id') + '-top',
				constructor : function () {
						return new Views.AoPSMasterCollection({
							model : category
						});
					}
			});
			this.myPage.hideLoader();
		},
		
		constructMasterAndPortalTop : function () {
			if (this.has_announcement) {
				this.myPage.showElement({
					id : 'cmty-announcement',
					constructor : function () {
						return new Views.Announcement({
							content : AoPS.bootstrap_data.community_announcement
						});
					},
					location : 'subheader'	
				});
			}

			if (AoPS.isUserLimited()) {
				this.myPage.showElement({
					id : 'cmty-limited-user-msg',
					constructor : function () {
						return new Views.LimitedUserMessage({});
						}	
				});
			}

		},

		/**
		 * Build the olympiad/college math portal toplevel
		 **/
		buildPortal : function () {
			var self = this,
				category = this.models.portal_category;
			this.startMainPage();

			this.constructMasterAndPortalTop();			

			this.myPage.showElement({
				id : 'cmty-category-' + category.get('category_id') + '-top',
				constructor : function () {
						return new Views.AoPSPortal({
							model : category
						});
					}
			});
			this.myPage.hideLoader();
		},
		
		
		buildSeededMemberlist : function (stub) {
			var self = this;
			if (_.isNull(stub)) {
				stub = '';
			}
		
			this.startMainPage();
			this.myPage.showElement({
				id : 'cmty-memberlist',
				constructor : function () {
						return new Views.Memberlist({
							model : self.models.master,
							stub : stub
						});
					}
			});
			this.myPage.hideLoader();
		},

		buildMemberlist : function () {
			var self = this;
			
			this.buildSeededMemberlist('');
			return;
		},
		
		
		buildFAQ : function () {
			var self = this;

			this.startMainPage();
			this.myPage.showElement({
				id : 'cmty-faq',
				constructor : function () {
						return new Views.FAQ({
							model : self.models.master
						});
					}
			});
			this.myPage.hideLoader();
			this.setBreadcrumbs([{
				text : Lang['FAQ']
			}]);
		},

		/**
		 * Strip everything out of the url besides the category if anything is set besides category.
		 *
		 * @param coords: settings used to build the page.
		 */
		stripAllButCategory : function (coords) {
			var rebuild = false;
			_.each(this.url_parameters, function (item) {
				if (item.property !== 'category_id' && coords[item.property] > 0) {
					rebuild = true;
					coords[item.property] = 0;
				}
			});
			if (rebuild) {
				this.rebuildUrl(coords);
			}
		},
		
		/** End URL Rebuilding functions **/
		
		
		performSearch : function (search_text) {
			var category;
			
			if (_.isNull(search_text) || search_text.length === 0) {
				this.buildBlankSearchForm();
				return;
			}
			category = this.models.master.buildSearchCategory({
				encoded_search_text : search_text,
				search_text : decodeURIComponent(search_text)
			});
			Backbone.history.navigate('q' + category.get('search_id') + '_' + search_text, {trigger : true, replace : true});
			this.skip_finish_route = true;
		},
		
		performForumUserSearch : function (user_id, forum_id) {
			var search_settings = {
				forums_action : 'include',
				forums : [parseInt(forum_id)],
				include_users : [user_id]
			}, 
				category;
			
			category = this.models.master.buildSearchCategory(search_settings);
//			Backbone.history.navigate('q' + category.get('search_id'), {trigger : true, replace : true});
			this.parseEncodedUrl('q' + category.get('search_id'));
		},
		
		buildPrivateSearch : function () {
			if (!AoPS.session.logged_in) {
				this.throwError(Lang['router-err-not-logged-in']);
				return;
			}
			this.buildSearchForm({
					is_private : true
				}, this.router_counter);
		},
		
		performPrivateSearch : function(url) {
			var category;

			if (_.isNull(url) || url.length === 0) {
				this.buildPrivateSearch();
			}
			
			category = this.models.master.buildSearchCategory({
				encoded_search_text : url,
				search_text : decodeURIComponent(url),
				forums : [Constants.private_messages_id],
				forums_action : 'include'
			});
			Backbone.history.navigate('q' + category.get('search_id') + '_' + url, {trigger : true, replace : true});
			this.skip_finish_route = true;
			
		},
		
		/**
		 * Set up a forum search.
		 *
		 * @param int category_id of forum.
		 *
		 * Builds a search page with the forum_id input.  If the forum has not been loaded,
		 *  we just build an empty page.  Maybe someday we'll go load the category...
		 **/	
		performForumSearch : function (forum_id) {
			var category,
				self = this;
			
			category = this.models.master.fetchCategory(parseInt(forum_id));
			
			if (_.isUndefined(category)) {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.buildCategory, this.models.master),
					settings: {
						category_id : parseInt(forum_id)
					}, 
					onFinish : function (data) {
						self.buildSearchForm({
							forums : [data.category.makeItemOfThis()]
						}, self.router_counter);
					},
					onError : function (msg) {
						self.buildSearchForm({}, self.router_couter);
					}
				});
			} else if (!category.get('is_forum') || category.get('category_id') == Constants.private_messages_id) {
				this.buildSearchForm({}, this.router_couter);
			} else {
				this.buildSearchForm({
					forums : [category.makeItemOfThis()]
				}, this.router_counter);
			}
		},
		
		buildBlankSearchForm : function () {
			this.buildSearchForm({}, this.router_counter);
		},
		
		buildSearchForm : function (options, search_view_id) {
			var self = this;

			this.myPage.clearPage();
			this.startNonTopicsPage({
				reset_breadcrumbs : false
			});
			this.setWindowResizeAction(false);
			
			this.setTitle(Lang['page-title-search']);
			if (options.hasOwnProperty('is_private') && options.is_private) {
				this.setBreadcrumbs([{
					url : '/community/my-messages',
					text : Lang['private-category-name']
				}, {
					text : Lang['Private-Message-Search']
				}]);
			} else if (options.hasOwnProperty('forums') && options.forums.length === 1 ) {
				this.setBreadcrumbs([{
					url : '/community/c' + options.forums[0].category_id,
					text : options.forums[0].label
				}, {
					text : Lang['Search']
				}]);
			} else {
				this.setBreadcrumbs([{
					text : Lang['Search']
				}]);
			}
			this.myPage.showElement({
				id : 'cmty-search-page-' + search_view_id,
				constructor : function () {
					return new Views.SearchPage({
						model : self.models.master,
						preset_settings : options,
						search_page_id : search_view_id
					});
				}
			});
		
		},
		
		editSearch : function (search_id) {
			var category = this.models.master.fetchSearchCategory(parseInt(search_id)),
				search_view_id = _.isUndefined(category) ? this.router_counter : category.get('search_page_id');
			
			this.buildSearchForm({}, search_view_id);
		},
		
		
		/** START Log Admin **/
		
		/**
		 * Build a log admin with no filters set initially
		 **/
		buildEmptyLog : function () {
			this.buildLog({});
		},
		
		/**
		 * Build a log admin initially filtered to a particular topic or topics.
		 *
		 * @param string topics_ids comma separated
		 **/
		buildLogTopic : function (topic_id) {
			this.buildLog({
				topic_ids : topic_id
			});
		},
		
		/**
		 * Build a log admin initially filtered to a particular category or categories.
		 *
		 * @param string category ids comma separated
		 **/
		buildLogCategory : function (category_id) {
			this.buildLog({
				categories : category_id
			});
		},
		
		/**
		 * Build a log admin initially filtered to a particular user.
		 *
		 * @param string user identifier (email, username, user_id)
		 **/
		buildLogByUser : function (user_id) {
			var self = this;
			this.takeAjaxDetour({
				func : _.bind(this.models.master.buildUser, this.models.master),
				settings : {
					user_identifier : user_id
				},
				onFinish : function (data) {
					self.buildLog({
						by_users : [data.user_model.makeItemOfThis()]
					});
				}, 
				onError : function () {
					self.throwError(AoPS.Community.Utils.formatString(Lang['user-profile-no-such-user'], [user_identifier]));
				}
			});
		},
		
		
		/***
		 * Build a log admin page with optional presets
		 *
		 * @param object
		 *		by_users optional array of Models.User
		 * 		categories optional string category ids csv
		 *		topic_ids optional string topic ids csv
		 **/
		buildLog : function (preloads) {
			var self = this,
				$validator;

			if (!this.models.master.fetchPermission('can_access_log')) {
				this.throwError(Lang['router-err-no-perms']);
				return;
			}
			this.setWindowResizeAction(false);
			this.myPage.clearPage();
			this.setTitle(Lang['log-admin-page-title']);
			
			
			this.validateAdmin({
				onValidated : function () {
					self.finishLogConstruction(preloads);
				}
			});
		
		},

		validateAdmin : function (obj) {
			var self = this,
				$validator = $(AoPS.Community.Lang['admin-validation']);

			if (!this.is_admin_validated) {
				AoPS.Ui.Modal.showAlert($validator, {
					'closeX' : false,
					'force_response' : true,
					'close_on_button_click' : false,
					'width' : '400px',
					'onButtonClick' : function () {

						self.models.master.validateAdmin({
							pwd : $validator.find('input').val(),
							onFinish : function () {
								self.is_admin_validated = true;
								AoPS.Ui.Modal.closeTopModal();
								obj.onValidated();
							},
							onError : function () {
								AoPS.Ui.Modal.showMessage(Lang['admin-validate-failed']);
							}

						})
					}
				});	
				$validator.find('input').focus();
			} else {
				obj.onValidated();
			}
		},

		finishLogConstruction : function (preloads) {
			var self = this;
			this.myPage.setClass('cmty-log-admin-page');
			this.myPage.showElement({
				id : 'cmty-log-management',
				constructor : function () {
					return new Views.LogAdmin({
						model : self.models.master,
						preloads : preloads
					});
				}
			});
			this.setBreadcrumbs([{
				text : Lang['breadcrumbs-log']
			}]);

		},
		
		/** END Log Admin **/
		
		
		
		/**
		 * Initialize appropriate models for a page in the term-tag management
		 *
		 * @param string|function -- name of function to execute upon load of the tag-term map
		 **/
		initTermTagPage : function (action) {
			var self = this;
			if (!this.models.master.fetchPermission('can_edit_tagspace')) {
				this.throwError(Lang['router-err-no-perms']);
				return;
			}
			
			this.myPage.clearPage();
			this.setWindowResizeAction(false);
			if (!this.models.hasOwnProperty('term_tag_manager')) {
				this.myPage.showLoader();
				this.models.term_tag_manager = new AoPS.Community.Models.TagTermManager();
				this.models.term_tag_manager.fetch_map({
					onFinish : function () {
						if (typeof action === 'string') {
							self[action]();	
						} else {
							action();
						}				
					}
				});
				return false;
			}	
			this.myPage.showElement({
				id : 'cmty-tag-term-top',
				constructor : function () {
					return new Views.TagTermAdminTop({
					
					});
				}
			});
			return true;
		},
		
		/**
		 * Construct the terms->tags map page.
		 **/
		buildTermsPage : function () {
			var self = this;

			if (!this.initTermTagPage('buildTermsPage')) {
				return;
			}

			this.validateAdmin({
				onValidated : function () {
					self.myPage.setClass('cmty-terms-page');
					self.myPage.showElement({
						id : 'cmty-terms-management',
						constructor : function () {
							return new Views.TermsManager({
								model : self.models.term_tag_manager
							});
						}
					});
					self.setBreadcrumbs([{
						text : Lang['breadcrumbs-terms']
					}]);

				}
			});
		},
		
		
		/** 
		 * Construct the tags->terms map page
		 **/
		buildTagMapPage : function () {
			var self = this;
			if (!this.initTermTagPage('buildTagMapPage')) {
				return;
			}
		
			this.validateAdmin({
				onValidated : function () {
					self.myPage.setClass('cmty-tag-map-page');
					self.myPage.showElement({
						id : 'cmty-tags-mapper',
						constructor : function () {
							return new Views.TagsMapper({
								model : self.models.term_tag_manager
							});
						}
					});
					
					self.setBreadcrumbs([{
						text : Lang['breadcrumbs-tagmap'],
					}]);
				}
			});
			
		},
		
		/**
		 * Construct the tag search box on the tag info page.
		 *  Perform initialization, go to next step.
		 **/
		buildTagInfoSearch : function () {
			var self = this;
			if (!this.initTermTagPage('buildTagInfoSearch')) {
				return;
			}
			
			this.setBreadcrumbs([{
				text : Lang['breadcrumbs-tag-info'],
			}]);
			
			this.buildTagInfoTop();
		},
		
		/**
		 * Build the top of the tag info page after initialization.
		 **/
		buildTagInfoTop : function () {
			var self = this;
			this.myPage.setClass('cmty-tag-info-page');
			this.myPage.showElement({
				id : 'cmty-tag-info',
				constructor : function () {
					return new Views.TagInfoTop({
						model : self.models.term_tag_manager
					});
				}
			});
		},
		
		/**
		 * Build the tag info page
		 **/
		buildTagInfo : function (url) {
			var tag_id = parseInt(url),
				tag,
				self = this;

			if (!this.initTermTagPage(function () {
				self.buildTagInfo(url);
			})) {
				return;
			}
			
			if (tag_id == 0) {
				// try to read this as a string -- url decode it
			} 
			
			this.buildTagInfoTop();
			
			this.validateAdmin({
				onValidated : function () {
					tag = self.models.term_tag_manager.findTagById(tag_id);
					// DEAL with tag undefined.
					if (_.isUndefined(tag)) {
						self.myPage.showLoader();
						self.models.term_tag_manager.loadTagById({
							tag_id : tag_id,
							onFinish : function (msg) {
								self.buildTagInfo(msg.tag_id);
							},
							onError : function (msg) {
								if (msg.error_code === 'E_NO_SUCH_TAG') {
									self.throwError(Lang['cmty-tag-info-no-tag']);
								} else {
									self.throwError(msg.error_code);
								}
							}
						});
						
						return;
					}
					
					self.setBreadcrumbs([{
						text : Lang['breadcrumbs-tag-info'],
						url : '/community/tag'
					}, {
						text : tag.get('tag_text')
					}]);
					
					if (tag.has('forum_data')) {
						self.finishTagInfo(tag);
					} else {
						self.myPage.showLoader();

						tag.fetchForumData({
							onFinish : function (msg) {
								self.finishTagInfo(tag);
							}
						});
					}
				}
			})
			
		},
		
		finishTagInfo : function(tag) {
			var self = this;
			this.myPage.hideLoader();
			this.myPage.showElement({
				id : 'cmty-tag-data-' + tag.get('tag_id'),
				constructor : function () {
					return new Views.TagData({
						model : tag,
						mapper : self.models.term_tag_manager
					});
				}
			});
		},
		
		/** Start functions for building pages that have ids encoded in URL **/
		
		/**
		 * Launch a new topic in a particular forum.
		 **/
		launchNewTopic : function(url) {
			var pieces, 
				tags = [];
				
			if (_.isNull(url)) {
				this.constructAoPSMasterCollection();
				return;
			}
			pieces = url.split('/');
			url = pieces[0];
			if (_.isNull(url.match(/^c\d+/))) {
				this.constructAoPSMasterCollection();
				return;
			}
			pieces.shift();
			_.each(pieces, function (piece) {
				tags.push(decodeURIComponent(piece));
			});
			setTimeout(function() {
				var $target = $('.cmty-category-cell .cmty-cat-cell-top-legit .cmty-new-topic-target').first();
				if ($target.is(':visible')) {
					$target.trigger('click', {
						tags : _.first(tags, Constants.max_tags_per_topic)
					});
				}
			}, 250);
			
			this.parseEncodedUrl(url);
		},
		
		/**
		 * parseEncodedUrl parses the url and then routes us to the appropriate function
		 *  to construct the page once we're sure we have some topics to play with.  
		 *  (We'll likely handle that "check for some topics" differently when we build the real system.)
		 *
		 * @param url: everything after # in the url.
		 *
		 */
		parseEncodedUrl : function (url) {
			/**
			 * I really wish I'd left a note about why I added the timeout
			 *  below.  Ah! It was to remove the flicker in IE!
			 *
			 * That flicker/rerendering so that the tags flood out of the tagbox at the top
			 *  seems to have stopped.  If I have to bring back this timeout,
			 *  then I will have to pull the parsing of the URL up here so that I can
			 *  reset the previous_route data prior to the route ending. 
			 *  (If we reinstate the timeout, then the route will end and onFinishRoute
			 *   will get called before the previous_coords variable is set.)
			 **/
		//	setTimeout(_.bind(function() {
				this.parseEncodedUrlContinue(url);
			//}, this), 10);
			
		},
		
		
		
		
		parseEncodedUrlContinue : function (url) {
			var self = this,
				coords = {
					topic : null,
					category : null
				};
			/**
			 * If we're hitting a category, topic, or post on page load (first_pass through the
			 *  router), then we check the preload_cmty_data property of bootstrap to see if 
			 *  there's anything we can preload, and to see if we need to rewrite the url.
			 *
			 * There are later url rewrite checks, but they shouldn't ever be triggered.
			 *  I'm leaving them in, in case down the line we introduce ways that users can 
			 *  travel down routes missing properties (like topic id with no category id) in
			 *  some way other than the initial page load.
			 **/
			if (this.first_pass) {
				if (AoPS.bootstrap_data.hasOwnProperty('preload_cmty_data')) {
					this.first_pass = false;
					if (this.parsePreloadedData()) {
						return;
					}
				}			
			}			
			
			// Fill coords object from url
			_.each(this.url_parameters, function (item) {
				coords[item.property] = Utils.extractValueFromUrl(item.letter, url);
			});
			
			/**
			 * We need the checks below because we don't want to call cancelAll if we're just
			 *  routing from one place in a topic to another (such as when we quickly click
			 *  on jump to bottom in a topic cell right after clicking on the topic cell).
			 **/
			if (_.isNull(this.models.master.get('focus_topic')) ||
			coords.topic_id == 0 || coords.topic_id != this.models.master.get('focus_topic').get('topic_id')) {
				AoPS.Community.Utils.cmty_ajax.cancelAll({cancel_type : 'master'});
			}

			// This should never happen...
			if (coords.category_id > 0 && (coords.user_id > 0 || coords.search_id > 0)) {
				coords.user_id = 0;
				coords.search_id = 0;
				this.rebuildUrl(coords);
			}
			
			// If there's no url, then go for the default: the toplevel AoPS category
			if (_.isNull(url) || url === "" || coords.category_id === this.master_category_id) {
				delete this.previous_coords;
				this.constructBaseView();
				
				return;
			}

			/**
			 * Check to see if we want to keep the current fullscreen mode.
			 *  We do so if we are staying in the same category&tag, and 
			 *  are viewing a topic.  Anything else takes us out of fullscreen
			 *  mode.
			 **/
			if (this.previous_route === 'parseEncodedUrl' &&
			this.hasOwnProperty('previous_coords')) {
				if (coords.category_id === this.previous_coords.category_id &&
					coords.priv_id === this.previous_coords.priv_id &&
					coords.user_id === this.previous_coords.user_id &&
					coords.search_id === this.previous_coords.search_id &&
					coords.tag_id === this.previous_coords.tag_id &&
					coords.tag_forum_id === this.previous_coords.tag_forum_id &&
					this.previous_coords.list_loaded) {
					
					
					this.stay_on_list = true;
					
					if (coords.topic_id > 0) {
						this.keep_fullscreen_mode = true;
					}
					coords.category = this.models.master.get('focus_category');
					coords.topic_list = this.models.master.get('focus_topic_list');
				} else {
					this.stay_on_list = false;
				}
			} else {
				this.stay_on_list = false;
			}
			if (!this.stay_on_list) {
				this.myPage.clearPage();
			}
			
			this.previous_coords = {
				category_id : coords.category_id,
				priv_id : coords.priv_id,
				user_id : coords.user_id,
				search_id : coords.search_id,
				tag_id : coords.tag_id,
				tag_forum_id : coords.tag_forum_id,
				list_loaded : this.stay_on_list
			};
			

			if (coords.category_id > 0) {
				this.startConstructingPage(coords);				
			} else if (coords.priv_id > 0) {
				this.startConstructingPrivPage(coords);
			} else if (coords.user_id > 0) {
				this.startConstructingUserSearch(coords);
			} else if (coords.search_id > 0) {
				this.startConstructingSearchResults(coords);
			} else { 
				this.parseNoCategoryUrl(coords);
			} 
		},		

		/**
		 * If we have a url with coordinates but we don't have a category id, then we 
		 *  need to check if we have a topic.  If we do have a topic, then
		 *  go get the topic, read the category from it, and continue. 
		 *  Otherwise, we're pointing at a bad URL.  Send them to the front page.
		 **/
		parseNoCategoryUrl : function (coords) {
			if (coords.topic_id > 0) {
				this.checkTopicThenContinue(coords);
			} else if (coords.post_id > 0) {
				this.checkPostThenContinue(coords);
			} else {
				Backbone.history.navigate('', {trigger : true, replace : true});
			}			
		},

		/**
		 * Start constructing a user search.  First check if we've already
		 *  built a search with this user.  If not, construct one
		 *
		 * @param coords: settings used to build the page
		 **/
		startConstructingUserSearch : function (coords) {
			coords.category = this.models.master.fetchUserSearchCategory(coords.user_id);
			this.constructPageFromCategory(coords);
		},
		
		
		startConstructingSearchResults : function (coords) {
			var arr;
			// TODO: What happens if fail?  Need to catch the "extra" and put in coords.
			coords.category = this.models.master.fetchSearchCategory(coords.search_id);
			
			if (_.isUndefined(coords.category)) {
				arr = Backbone.history.fragment.split(/_(.+)?/);
				if (arr.length > 1) {
					Backbone.history.navigate('search/' + arr[1], {trigger : true, replace : true});
					this.skip_finish_route = true;
				} else {
					Backbone.history.navigate('search', {trigger : true, replace : true});
					this.skip_finish_route = true;
				}
			} else {
				this.constructPageFromCategory(coords);
			}
		},
		
		
		/**
		 * Start constructing a priv page
		 **/
		startConstructingPrivPage : function (coords) {
			var category_model,
				self = this;

			if (!this.models.master.fetchPermission('can_view_others_pm')) {
				this.throwNoPermissions();
			}

			category_model = this.models.master.fetchPrivCategory(coords.priv_id);

			if (_.isUndefined(category_model)) {
				this.takeAjaxDetour({
					func : _.bind(this.models.master.buildPrivCategory, this.models.master),
					settings: {
						user_id : coords.priv_id
					}, 
					onFinish : function (data) {
						coords.category = data.category;
						self.constructPageFromCategory(coords);
					},
					onError : function (msg) {
						if (msg.error_code === 'E_NO_SUCH_CATEGORIES') {
							self.throwError(Lang['router-err-no-such-category']);
						} else if (msg.error_code === 'E_AJAX_FILTERED') {
							// Do nothing, I think -- we are headed down another route now
						} else if (msg.error_code === 'E_NO_SUCH_USER') {
							self.throwError(Lang['router-err-no-such-user']);
							// Do nothing, I think -- we are headed down another route now
						} else if (msg.error_code === 'E_NO_PERMISSION') {
							self.throwNoPermissions();
						} else if (msg.error_code !== 'E_AJAX_CANCEL') {
							self.throwError(msg.error_code);
						}
					}
				});
			} else {
				coords.category = category_model;
				this.constructPageFromCategory(coords);
			}
		},

		/**
		 * See if we already have loaded the category. If not, go to the database to get
		 *  the category, and then continue.
		 *
		 * @param coords: settings used to build the page.
		 */
		startConstructingPage : function(coords) {
			var category_model = this.models.master.fetchCategory(coords.category_id),
				self = this;
			
			if (coords.category_id === AoPS.Community.Constants.private_messages_id) {
				//page_class += ' cmty-page-messages';
				this.privates_top_built = true;
				if (!this.stay_on_list) {
					this.constructMyAopsTop();
				}
				/*if (coords.category.get('is_archive')) {
					category_identifier += '-archive';
				}*/
			} 
			if (_.isUndefined(category_model)) { 
				this.takeAjaxDetour({
					func : _.bind(this.models.master.buildCategory, this.models.master),
					settings: {
						category_id : coords.category_id
					}, 
					onFinish : function (data) {
						coords.category = data.category;
						self.checkSubCategoriesThenBuild(coords);
					},
					onError : function (msg) {
						if (msg.error_code === 'E_NO_SUCH_CATEGORIES') {
							self.throwError(Lang['router-err-no-such-category']);
						} else if (msg.error_code === 'E_AJAX_FILTERED') {
							// Do nothing, I think -- we are headed down another route now
						} else if (msg.error_code === 'E_NO_PERMISSION') {
							self.throwNoPermissions();
						} else if (msg.error_code !== 'E_AJAX_CANCEL') {
							self.throwError(msg.error_code);
						}
					}
				});
				
/*				this.myPage.showLoader();
				
				this.models.master.buildCategory({
					category_id : coords.category_id,
					onFinish : function (data) {
						coords.category = data.category;
						self.checkSubCategoriesThenBuild(coords);
					},
					onError : function (msg) {
						if (msg.error_code !== 'E_AJAX_CANCEL') {
							self.throwError(msg.error_code);
						}
					}
				});*/
			} else { // We have the category object, rock on.
				coords.category = category_model;
				
				this.checkSubCategoriesThenBuild(coords);
			}
		},

		
		/***
		 * For some category types, we have to load some more data before 
		 *  continuing with construction.
		 *
		 * @param coords: settings used to build the page.
		 **/
		checkSubCategoriesThenBuild : function(coords) {
			var self = this;
			// Throw error if user can't access the page.
			if (!coords.category.getPermission('c_can_read')) {
				this.throwError(Lang['router-err-no-perms']);
				return;
			}

			/** For view_forums and bookmark_forums, we need to go load all the forums in the view **/
			if (((coords.category.get('category_type') === 'view_forums') || 
				(coords.category.get('category_type') === 'bookmark_forums')) 
					&& (!coords.category.get('forums_loaded'))) {
				this.takeAjaxDetour({
					func : _.bind(coords.category.loadForums, coords.category),
					onFinish : function (data) {
						self.constructPageFromCategory(coords);
					}
				});
			} else if (coords.category.get('category_type') === 'my_privates') {
				if (!this.models.master.get('private_items_fetched')) {
					this.takeAjaxDetour({
						func : _.bind(this.models.master.fetchPrivateItems, this.models.master),
						onFinish : function () {
							self.myPage.hideLoader();
							self.constructPageFromCategory(coords);
						}
					});
				} else {
					this.constructPageFromCategory(coords);
				}
			} else if (coords.category.get('category_type') === 'view_posts' &&
				!coords.category.get('no_more_items')) { /** HERE IS WHERE TO CHECK ALL THE ITEMS IN THE HOUSE **/
					this.takeAjaxDetour({
						func : _.bind(coords.category.fetchMoreItems, coords.category),
						settings : {
							fetch_all : true
						},
						onFinish : _.bind(function () {
							this.constructPageFromCategory(coords);
						}, this)
					});
					
				/*	this.myPage.showLoader();
				
					coords.category.fetchMoreItems({
						fetch_all : true,
						onFinish : _.bind(function () {
							this.constructPageFromCategory(coords);
						}, this)
					});*/
			} else {
				this.constructPageFromCategory(coords);
			}
		},
		
		
		
		
		/**
		 * We have the category now.  Route to the appropriate function based on the category.
		 *  Right now, we just have folders and categories that hold topics.
		 *
		 * @param coords: settings used to build the page.
		 */
		constructPageFromCategory : function(coords) {
			this.models.master.set('focus_category', coords.category);

			// This if statement is dumb as hell.  Make a CategoryFolder and
			//  let these inherit from it.  This is so dumb.
			if (coords.category.get('category_type') === 'folder' ||
				coords.category.get('category_type') === 'my_forums' ||
				coords.category.get('category_type') === 'my_blogs' ||
				coords.category.get('category_type') === 'my_collections' ||
				coords.category.get('category_type') === 'bookmark_forums' ||
				coords.category.get('category_type') === 'bookmark_users' ||
				coords.category.get('category_type') === 'blogroll' ||
				coords.category.get('category_type') === 'folder_forums' ||
				coords.category.get('category_type') === 'folder_collections') {

				this.stripAllButCategory(coords);
				this.constructFolder(coords.category);
				return;
			}
			
			if (coords.category.get('category_type') === 'blog') {
				window.location.href = '/community/c' + coords.category.get('category_id');
				return;
			}
			
			if (coords.category.get('category_type') === 'view_posts') {
				this.constructViewPosts(coords.category);
				return;
			}
			
			this.checkPostThenContinue(coords);
			
		},
		
		
		/**
		 * Here we check if a post_id is submitted without a topic_id.  If that is the
		 *  case, then we have to go figure out what topic we're coming from,
		 *  and throw appropriate errors if there is no such post or if 
		 * 	there is a permissions issue.
		 *
		 * Currently, this shouldn't ever happen, as there are handlers on the back end
		 *	that will take care of this on initial page load, and we shouldn't have
		 *	links on the front end that go to a post_id without a topic_id.
		 *
		 * @param coords: settings used to build the page.
		 */
		checkPostThenContinue : function (coords) {
			var self = this;

			if (coords.post_id > 0 && coords.topic_id === 0) {
				this.takeAjaxDetour({
						func : _.bind(this.models.master.fetchTopicFromDbGivenPostId, this.models.master),
						settings : {
							post_id : coords.post_id
						},
						onFinish : function (data) {
							coords.topic = data.topic;
							coords.topic_id = data.topic.get('topic_id');
							coords.category_id = data.topic.get('category_id');
							self.rebuildUrl(coords);
							self.startConstructingPage(coords);
						}, 
						onError : function (data) {
							if (data.error_code === 'E_NO_SUCH_POST') {
								self.throwError(Lang['router-err-no-post']);
							} else if (data.error_code === 'E_NO_PERMISSION') {
								self.throwNoPermissions();
							}
						}
					});
			} else {
				this.checkTopicThenContinue(coords);
			}
		},
		
		
		/**
		 * Check the topic setting, then keep on going.  If user has
		 *  requested an unloaded topic, then we have to load it first.
		 *  This is separated from the "constructPageFromCategory" function
		 *  because sometimes the topic is loaded before the category.
		 *
		 * @param coords: settings used to build the page.
		 */
		checkTopicThenContinue : function (coords) {
			var self = this;

			function continueBuilding() {
				this.models.master.set('focus_topic', coords.topic, {
					suppress_ajax : (coords.topic_id === this.preloaded_topic_id),
					tag_id : coords.tag_id,
					tag_forum_id : coords.tag_forum_id
				});
		
				this.preloaded_topic_id = -1;
				// If a page is called without the category_id of the topic, but
				//  with the topic_id set, we will end up loading the topic before the
				//  category.  Here, we go back and get the category.
				if (coords.category_id === 0  && coords.priv_id === 0 && coords.user_id === 0 && coords.search_id === 0) {
					coords.category_id = coords.topic.get('category_id');
					this.rebuildUrl(coords);
					this.startConstructingPage(coords);
					return;
				}
				// Check if topic is in the category that the URL has 
				//  stated.  If not, rewrite the URL and recast the
				//  the tag's forum_id if necessary (if the URL has a tag set).
				// NOTE: If we have "Stay on list" marked, then we want to stay on this
				//  list for this topic even if it doesn't fit here.  Use case:
				//  view_tags and bookmark_tags.  We want the topic to stay in the list if
				//  the tags change.  Have to think later about removing it on "this user changed
				//  the tags", but we don't want topics magically disappearing from a list
				//  during a page load except for deletes and full-on moves.
				if (!_.isNull(coords.topic) && !this.stay_on_list && !coords.category.filterTopic(coords.topic)) {
					if (coords.category.get('is_my_private')) {
						// If the private message is archived, then use the my_privates_archive category.
						if (coords.topic.get('status') == 'archived') {
							coords.category = this.models.master.get('my_privates_archive');
							this.models.master.set('focus_category', coords.category);
						}
						this.checkTagThenContinue(coords);
						return;
					}
					coords.category_id = coords.topic.get('category_id');
					coords.category = null;
					if (coords.tag_forum_id != 0) {
						coords.tag_forum_id = coords.category_id;
					}

					this.rebuildPageFromStart(coords);
					return;
				} else {
					this.checkTagThenContinue(coords);
				}
			}
			
			// If the topic_id is set in the url, but the category_id is not,
			//  then we will load the topic first.  Here, we check if the 
			//  topic has already been dealt with.
			if (!_.isUndefined(coords.topic) && !_.isNull(coords.topic)) {
				continueBuilding.apply(this);
				return;
			}
			
			if (coords.topic_id === 0) { 
				// No focus topic, so the topic_list will stretch across the bottom of the screen.
				// set the app_location accordingly.
				continueBuilding.apply(this);
				return;
			} else {
				if (!_.isNull(coords.category) && !_.isUndefined(coords.category) &&
						coords.category.get('is_post_search')) {
					coords.topic = coords.category.get('active_topics').findWhere({
						topic_id : coords.topic_id,
						focus_post_id : coords.post_id	
					});						
				} else {
					coords.topic = this.models.master.fetchTopicById(coords.topic_id);
				}
				if (_.isNull(coords.topic) && !_.isUndefined(coords.topic)) {
					// this really may be moot...
					this.takeAjaxDetour({
						func : _.bind(this.models.master.fetchTopicFromDb, this.models.master),
						settings : {
							topic_id : coords.topic_id
						},
						onFinish : function (data) {
							coords.topic = data.topic;
							continueBuilding.apply(self);
						},
						onError : function (data) {
							if (data.error_code === 'E_NO_PERMISSION') {
								self.throwNoPermissions();
							} else if (data.error_code === 'E_NO_SUCH_TOPIC') {
								self.throwError(Lang['router-err-no-topic']);
							}
						}
					});
					
					return;
				} else {
					// If we have a topic, process all the tags on it (add them to their categories).
					this.models.master.processTopicTags(coords.topic);
					continueBuilding.apply(this);
					return;
				}
			}
		
		},
		
		
		
		/***
		 * Check the submitted tag if there is one.  We have two items to check:
		 *  1) Is the tag a valid item for the category
		 *  2) If there is a topic, does the topic have this tag?
		 * If the answer to either is "no", then we strip the tag from the URL and 
		 *  continue without a tag.
		 *
		 * @param coords: settings used to build the page.
		 */
		checkTagThenContinue : function (coords) {
			var tag,
				self = this;
			if (this.stay_on_list) {
				if (coords.tag_id > 0) {
					coords.tag_name = this.models.master.fetchItemName(coords.category_id, {
						item_id : coords.tag_id, 
						item_forum_id : coords.tag_forum_id,
						item_type : 'tag'
					});
				}
				self.buildThePage(coords);
				return;
			}
			function continueBuilding () {
				if (coords.tag_id > 0) {
					coords.tag_name = this.models.master.fetchItemName(coords.category_id, {
						item_id : coords.tag_id, 
						item_forum_id : coords.tag_forum_id,
						item_type : 'tag'
					});
				}
				this.checkTopicListThenContinue(coords);
			}
			
			function stripTagAndContinue () {
				this.previous_coords.tag_forum_id = 0;
				this.previous_coords.tag_id = 0;
				coords.tag_forum_id = 0;
				coords.tag_id = 0;
				this.rebuildUrl(coords);
				this.models.master.set('focus_tag', null);
				continueBuilding.apply(this);
			}
			
			if (coords.tag_id > 0) {
				switch (coords.category.get('category_type')) {
					
					// If the category is a forum, then category and tag_forum_id must match.
					//  We force that here.
					case 'forum':
						if (coords.category_id != coords.tag_forum_id) {
							coords.tag_forum_id = coords.category_id;
							this.rebuildUrl(coords);
						}
					break;
				
					// We are going to assume that views always load all tags.  The filters would be
					//   wrong if this were not the case.  If the connected tag is not
					//   in the view, then we strip it.
					case 'view_tags':
					case 'bookmark_tags':
						if (!coords.category.hasItem({
								item_id : coords.tag_id,
								item_forum_id : coords.tag_forum_id,
								item_type : 'tag'
							})) {
							stripTagAndContinue.apply(this);	
							return;
						}
					
					break;
				}
				
				// If we have a topic, let's make sure the topic has this tag.
				if (coords.topic_id > 0) {
					if (!coords.topic.hasTag(coords.tag_id)) {
						/**
						 * Here we do something subtle.  All of the code below deals with the problem
						 *  of a topic having its tag removed while the user is looking at a filter
						 *  on that tag.  As the user clicks around within that topic_list, we don't
						 *  want the topic to disappear (until the user leaves the list).  The topic won't have the tag anymore, but 
						 *  we need to get in front of the "stripTagAndContinue" line to prevent 
						 *  the user from getting redirected if they click on the topic that has had its tag
						 *  stripped.
						 **/
						if (this.hasOwnProperty('current_topic_list')) {
							coords.topic_list = this.models.master.fetchFilteredTopicList({
								category : coords.category,
								category_id : coords.category_id,
								tag_ids : [{
									tag_id : coords.tag_id,
									tag_forum_id : coords.tag_forum_id
								}] //currently assumes at most one tag_id.
							});
							if (coords.topic_list != this.current_topic_list) { //We are not on the same topic_list as before
								delete coords.topic_list;
								stripTagAndContinue.apply(this);
								return;
							} else {
								// We are still on the same list we were just on.  Rock on.
							}
						
						} else { // We are not clicking around on a page with a topic_list on it
							stripTagAndContinue.apply(this);	
							return;
						}
					}
				}
				tag = coords.category.fetchItem({
					item_id : coords.tag_id,
					item_forum_id : coords.tag_forum_id,
					item_type : 'tag'
				});

				// If the tag has not been loaded to the category yet, then we go get it
				//  from the database.  This should only happen for forums.  
				//  The earlier check should catch missing tags for views.  Views should
				//  have all of their tags already loaded, so there's no more fetching to do.
				if (_.isUndefined(tag)) {
					/*this.listenToOnce(coords.category, 'item_added', _.bind(function (item) {
						this.models.master.set('focus_tag', item);
						this.stopListening(coords.category, 'item_db_fetch_failed');
						continueBuilding.apply(this);
					}, this));
					this.listenToOnce(coords.category, 'item_db_fetch_failed', function () {
						this.stopListening(coords.category, 'item_added');
						// No tag found, take it off.
						
					});
					*/
					coords.category.fetchItemFromDb({
						item_id : coords.tag_id, 
						forum_id : coords.tag_forum_id, 
						item_type : 'tag',
						onError : function () {
							stripTagAndContinue.apply(self);
						}, 
						onFinish : function (data) {
							self.models.master.set('focus_tag', data.item);
							continueBuilding.apply(self);
						}
					});
				
				} else {
					this.models.master.set('focus_tag', tag);
					continueBuilding.apply(this);
					return;
				}
			} else {
				this.models.master.set('focus_tag', null);
				continueBuilding.apply(this);
				return;
			}
		},
	
		
		/***
		 * Construct the topic list that we use for the page.  If the topic list 
		 *  has no topics, then we go get some topics before building.
		 *
		 * @param coords: settings used to build the page.
		 */
		checkTopicListThenContinue : function (coords) {
			var page_class,
				self = this,
				category_identifier = coords.category_id; // for Page to remember this category
			
			/**
			 * Load the Category cell before looking for the topic list.
			 *  I hope this doesn't make IE do stupid stuff.  This
			 *  Allows the Category block to stay on top of the page when
			 *  the user clicks to a new tag.
			 **/
			this.myPage.hideLoader();
			
			// This must be done before we build the page.
			//  Any category with topics must have a fixed-height page.
			this.setWindowResizeAction(true);
			
			// MUST SET BEFORE ADDING THE CATEGORY, OR YOU'LL GET WACKINESS IF THE BROWSER
			//  RENDERS THE CATEGORY BEFORE THE PAGE CLASS IS SET.
			if (coords.topic_id > 0) {
				page_class = 'cmty-page-topic';
				this.myPage.setClass();
			} else {
				page_class = 'cmty-page-topic-list'
			}
			
			if (coords.category.get('is_my_private')) {
				page_class += ' cmty-page-my-aops  cmty-page-messages';
				if (!this.privates_top_built) {
					this.constructMyAopsTop();
				}
				if (coords.category.get('is_archive')) {
					category_identifier += '-archive';
				}
			} 
			
			if (coords.category.get('category_type') === 'priv') {
				page_class += ' cmty-page-priv-category';
			}

			if (coords.category.get('category_type') === 'bookmark_tags') {
				page_class += '  cmty-page-my-aops cmty-page-my-bookmarks cmty-page-my-bookmark-tags';
				this.constructMyAopsTop();
			} 
			
			if (coords.category.get('category_type') === 'bookmark_topics') {
				page_class += '  cmty-page-my-aops  cmty-page-my-bookmarks cmty-page-my-bookmark-topics';
				this.constructMyAopsTop();
			} 
			
			
			
			
			if (coords.category.get('category_type') === 'user_search_posts') {
				category_identifier = 'user-' + coords.category.get('user_id');
			}
			
			if (coords.category.get('category_type') === 'search') {
				category_identifier = 'search-' + coords.category.get('search_id');
			}
			this.myPage.setClass(page_class);
			this.myPage.showElement({
				id : 'cmty-category' + category_identifier + '-tpl',
				constructor : _.bind(function () {
						return new (Views.fetchCategoryCellCategoryTopConstructor(coords.category.get('category_type')))({
							model : coords.category,
							focus_tag : this.models.master.get('focus_tag'),
							master : this.models.master
						});
					}, this),
				location : 'cmty-topic-view-top'
			});

			
			// Construct or fetch the Community.Models.FilteredTopicList that matches
			//  the set of parameters we seek.
			// Gets called twice for topics that are shorn of tags, but we can live with that, I think
			//  That will be rare.  We could do a property check, though.  Might be more expensive than it's worth.
			coords.topic_list = this.models.master.fetchFilteredTopicList({
				category : coords.category,
				user_id : coords.user_id,
				category_id : coords.category_id,
				tag_ids : ((coords.tag_id > 0) ? [{
					tag_id : coords.tag_id,
					tag_forum_id : coords.tag_forum_id
				}] : []) //currently assumes at most one tag_id.
			});
			this.current_topic_list = coords.topic_list;
			// Not enough topics in this list; I'm gonna get more.
			if (coords.topic_list.length <= AoPS.Community.Constants.min_topic_list_initial_length && 
					!coords.topic_list.all_topics_fetched) {

				this.takeAjaxDetour({
					func : _.bind(coords.topic_list.fetchMoreTopics, coords.topic_list),
					cat_name : coords.category.get('category_name'),
					/*settings : { // I don't think we want or need this
						never_cancel : true
					},*/
					onFinish : _.bind(function () {
						this.buildThePage(coords);
					}, this),
					onError : function(data) {
						var msg;

						if (data.error_code === 'E_AJAX_CANCEL') {
							return;
						}

						if (typeof Lang['initial-fetch-err-' + data.error_code] === 'string') {
							msg = Lang['initial-fetch-err-' + data.error_code];
						} else {
							msg = Lang['unexpected-error-code'] + data.error_code;
						}
						
						self.throwError(msg);
					}
				});
				
/*				this.myPage.showLoader();
				coords.topic_list.fetchMoreTopics({
					onFinish : _.bind(function () {
						this.buildThePage(coords);
					}, this)
				});*/
			} else {
				/**
					If no topic, then mark the forum visited for purposes
					of forum notifications.  
				**/
				
				if (coords.topic_id === 0) {
					coords.category.markVisited();
				}		
				this.buildThePage(coords);
			}
		},

		/**
		 * When we want to destroy a TopicFull view, we have to remove its element
		 *  from myPage's memory.  This happens on topic moves and deletes.
		 **/		
		onDestroyTopic : function (data) {
			this.myPage.forgetElement('cmty-topic-' + data.category_id + '-topic-' + data.topic_id);
		},
		
		/**
		 * Finally, we build the page.
		 *
		 * @param coords: settings used to build the page.
		 */		 
		buildThePage : function (coords) {
			var app, 
				topic_list_app,
				reveal_type,
				last_crumb,
				extra_crumbs = [],
				my_aops,
				self = this,
				my_privates,
				topic_element,
				topic_identifier,
				page_apps = [],
				tag_filter_properties,
				category_identifier = coords.category_id,
				page_structure = [];
			if (typeof this.previous_coords === 'object') {
				this.previous_coords.list_loaded = true;
			}
			if (coords.category.get('is_my_private')) {
				my_aops = this.models.master.get('my_aops'),
				this.breadcrumb_history = [{
					text : my_aops.get('category_name'),
					url : '/community/my-aops',
					category : my_aops
				}];
				
				if (coords.category.get('is_archive')) {
					my_privates = this.models.master.get('my_privates_archive');
					category_identifier += '-archive';
				} else {
					my_privates = this.models.master.get('my_privates');
				}	

				this.breadcrumb_history.push({
					text : my_privates.get('category_name'),
					url : '/community/c1',
					category : my_privates
				});
			}
			
			
			
			if (coords.category.get('category_type') === 'user_search_posts') {
				category_identifier = 'user-' + coords.category.get('user_id');
			}
			
			if (coords.category.get('category_type') === 'search') {
				category_identifier = 'search-' + coords.category.get('search_id');
			}
			
			if (!this.stay_on_list) {
				topic_list_app = {
					id : 'cmty-cat-' + category_identifier + '-tag-' + coords.tag_id + '-forum-' + coords.tag_forum_id,
					constructor : _.bind(function() {
							return new (Views.fetchTopicsListConstructor(coords.category.get('category_type')))({
								collection : coords.topic_list,
								main_color : coords.category.get('main_color'),
								secondary_color : coords.category.get('secondary_color'),
								focus_tag : this.models.master.get('focus_tag'),
								master : this.models.master,
								// See notes at start of Community.Views.TopicsList
								//  for more info on the following line.
								suppress_initial_fetch : coords.category.get('is_my_private'),
								category_id : coords.category_id,
								can_toggle_scroll_style : true
							});
						}, this),
					location : 'cmty-topic-view-left'
				};
			
				this.models.master.set('focus_topic_list', coords.topic_list);
			} 
			this.myPage.hideLoader();	
			if (coords.category.get('has_tag_filter')) {
				tag_filter_properties = {
					id : 'cmty-category-tag-search-' + category_identifier,
					constructor : _.bind(function () {
							return new Views.CategoryTagFilter({
								model : coords.category,
								focus_tag : this.models.master.get('focus_tag'),
								master : this.models.master
							});
					}, this),
					location : 'cmty-topic-view-left'
				}
				this.myPage.addClass('cmty-page-has-tag-filter');
			} else {
				this.myPage.removeClass('cmty-page-has-tag-filter');
			}
			
			if (coords.topic_id > 0) {
				if (!this.stay_on_list) {
					if (coords.category.get('has_tag_filter')) {
						this.myPage.showElement(tag_filter_properties);
						// Needed to position the stunt double correctly
						// This is because we need to have something in cmty-topic-view-left
						//  for the setting of the height of cmty-topic-view-left in
						//  parseWindowSize to "register", and thereby be available
						//  when setting topic list heights downstream.
						$(window).trigger('resize');
					}
					this.myPage.showElement(topic_list_app);
				} else {
					this.$loader.detach();
					this.myPage.addClass('cmty-page-topic');
					this.myPage.removeClass('cmty-page-topic-list');
				}				
				
				// Keep the category identifier in the topic_identifier.  Topics are
				//  in many categories, and get rendered a bit differently in each.
				if (coords.category.get('category_type') === 'user_search_posts') {
					topic_identifier = 'cmty-topic-' + category_identifier + '-user-' + coords.user_id + '-topic-' + coords.topic_id + '-post-' + coords.post_id;
				} else if (coords.category.get('category_type') === 'search') {
					topic_identifier = 'cmty-topic-' + category_identifier + '-search-' + coords.search_id + '-topic-' + coords.topic_id + '-post-' + coords.post_id;
				} else {
					topic_identifier =  'cmty-topic-' + category_identifier + '-topic-' + coords.topic_id;
				}
				if (coords.post_id > 0) {
					reveal_type = 'show_from_middle';
				} else {
					if (coords.state === 0) {
						reveal_type = 'show_from_start';
					} else if (coords.state === 1) {
						reveal_type = 'show_from_end';
					} else if (coords.state === 2) {					
						reveal_type = 'show_unread';
					}
				}		

				// If we have a topic, then here's how we add its element
				// RR removed tag_id from the id on 6/19/14; let's see if anything goes wrong.
				//this.previous_topic_element_id = topic_identifier;
				topic_element = this.myPage.showElement({
					id : topic_identifier,
					constructor : _.bind(function () {
							var newthing = new Views.TopicFull({
								model : coords.topic,
								route_category_id : coords.category_id,
								reveal_type : reveal_type,
								post_id : coords.post_id
							});
							return newthing;
						}, this),
					on_add_settings : {
						reveal_type : reveal_type,
						post_id : coords.post_id
					},
					location : 'cmty-topic-view-right'//'topics-view-bottomd'//'cmty-no-topic-view-bottom'
				});
				
				/** 
				 * A little sleight of hand here to get the post_wrapper height correct
				 *  when we are switching from forum-view to topic-view.
				 **/
				$(window).resize();
				topic_element.view.setHeight();
				
				this.setTitle(_.unescape(coords.topic.get('topic_title')));
				if (coords.tag_id > 0) {
					extra_crumbs.push({
						text : coords.tag_name,
						url : '/community/c' + coords.category_id + 't' + coords.tag_id + 'f' + coords.tag_forum_id
					});
				}
				
				extra_crumbs.push({
						text : coords.topic.get('topic_title')
					});
				this.buildCoreCommunityBreadcrumbs(coords.category, {
					extra_crumbs : extra_crumbs
				});
			} else {
				if (!this.stay_on_list) {
					if (coords.category.get('has_tag_filter')) {
						this.myPage.showElement(tag_filter_properties);
					}
					this.myPage.showElement(topic_list_app);
				} else {
					this.myPage.addClass('cmty-page-topic-list');
					this.myPage.removeClass('cmty-page-topic');
				}
				this.previous_topic_element_id = null;
				
				if (coords.tag_id > 0) {
					this.setTitle(_.unescape(coords.category.get('category_name') + ' ' 
						+ coords.tag_name));
					this.buildCoreCommunityBreadcrumbs(coords.category, {
						extra_crumbs : [{
							text : coords.tag_name
						}]
					});

				} else {
					this.setTitle(_.unescape(coords.category.get('category_name')));
					this.buildCoreCommunityBreadcrumbs(coords.category);
				}
			
			}
			
			$(window).trigger('resize');
		},
		
		setTitle : function (title) {
			document.title = title;//'AoPS Community: ' + title;
		},
		
		
		/**
		 * Set the breadcrumbs for this page.
		 *
		 * @param array of objects, each with form
		 *		text string required Text to show
		 *		url string optional URL after www.aops.com to point to
		 *		data string optional default data-cmty used for pushState
		 **/
		setBreadcrumbs : function (crumbs) {
			crumbs = _.map(crumbs, function (crumb) {
				return crumb;
			});
			this.myPage.setBreadcrumbs(this.breadcrumb_base.concat(crumbs), 'data-cmty');
		},
		
		/**
		 * setWindowResizeAction sets the browser action on window resize.
		 *
		 * @param fit_to_window: Whether to apply the resize action or not.
		 */
		setWindowResizeAction : function (fit_to_window) {
			var self = this;
			
			if (this.hasOwnProperty('fit_to_window') &&
				(this.fit_to_window === fit_to_window)) {
					return;
			}	
			this.fit_to_window = fit_to_window;
			
			AoPS.updateLayout();
			if (fit_to_window) {
				$('#main-column-standard').css('height','');
				this.parseWindowSize();
				$(window).bind("resize.cmty", function () {
					self.parseWindowSize();	
				});
				
			} else {
				$('#header').show();
				$('#header-background').show();
				$('#breadcrumbs-wrapper').show();
				$('#main-column-standard').css('height','100%');
				$("#main-content").css('height', '100%');
				$(window).unbind("resize.cmty");			
			}
		},
		
		parseWindowSize : function() {
			var window_width,
				window_height,
				top_height,
				header_height,
				main_column_standard_height,
				footer_height,
				$header,
				my_aops_top_height,
				$footer;
			document.body.style.overflow = 'hidden';
			
			window_width = $(document).width();
			document.body.style.overflow = '';

			// Changes here should be reflected in community_embeddable, too
			if (window_width <= AoPS.Community.Constants.phone_mode_max_width) {
				$('#main-column-standard').css('height','100%');	
				$('#main-content').css('height','100%');
				$('#cmty-topic-view-left').css('height', 'auto');
				$('#cmty-topic-view-right').css('height', 'auto');				
			} else {
				$header = $('#header-wrapper');
				$footer = $('#small-footer-wrapper');
				header_height = ($header.is(':visible') ? $header.outerHeight() : 5);
				footer_height = ($footer.is(':visible') ? $footer.outerHeight() : 5);
				window_height = $(window).height();
				my_aops_top_height = ($('#cmty-my-aops-top').is(':visible') ? $('#cmty-my-aops-top').height() : 0);
				if (_.isNull(my_aops_top_height)) {
					my_aops_top_height = 0;
				}
				top_height = $('#cmty-topic-view-top').height() + my_aops_top_height;
				$('#main-column-standard').css('height','100%');
				$("#main-content").outerHeight(window_height - header_height - footer_height);
				main_column_standard_height = $('#main-column-standard').height();
				$('#cmty-topic-view-right').outerHeight(main_column_standard_height - top_height);
				$('#cmty-topic-view-left').outerHeight(main_column_standard_height - top_height);
				//$('#cmty-no-topic-view-bottom').outerHeight(main_column_standard_height - top_height);
			}
		},
		
		
		onAjaxDetectLogout : function () {
			if (!AoPS.login.user_clicked_logout) {
				AoPS.Ui.buildLoginConfirm(Lang['unexpected-logout']);
				AoPS.login.onUserAjaxLogout();
			}
		},
		
		onAjaxDetectLogin : function () {
			if (!AoPS.login.user_clicked_login) {
				document.location.reload(true);
			}
		},
		
		onAjaxDetectLoginChange : function () {
			//if (
		}
	});
	
	$(window).load(function () {
		var master,
			app,
			feed,
			feed_view;
		var start_time = new Date().getTime();

		AoPS.pushState_attr = 'data-cmty';
		AoPS.router_root = 'community';
				
		master = new AoPS.Community.Models.Master({
			in_community : true
		});
		
	//	master.performAggregateAjaxText();
		app = new Community.Router({
			master : master
		});
		
		
		$('#main-column-standard').prepend(app.myPage.el);
		
		Backbone.history.start({
			pushState : true, 
			root : 'community'
		});
		if (AoPS.session.a) {
			console.log(new Date().getTime() - start_time);
		}
		$(document).on('click', 'a[data-cmty]', function (e) {
			if (e.metaKey || e.ctrlKey) {
				window.open($(this).attr('href'), '_blank');
			} else {
				Backbone.history.navigate($(this).attr('href').substring(10), {trigger : true});
			}
			e.stopPropagation();
			e.preventDefault();
		});
		
		AoPS.Community.Utils.activateLatexOnclick();
		
		//Take care of the header link -- make it work and play with pushState
		$('#community-menu-header a').attr('data-cmty', '');
		
		$('#menu-myaops div:first-child > div').on('click', function () {
			Backbone.history.navigate('/my-aops', {trigger : true});
			$('#menu-myaops').hide();
		});
		
		/* FEED MUST COME AFTER Backbone start!*/	
		// experimenting with delay to let the page render before Feed is built.
		// If the feed is delayed, then direct-to-private-messages breaks on Larry's computer.
		//  I suspect this is because there's something in the construction of the
		//   feed that is called for in the building of the Private Messages category.  I will have to
		//  root that out before putting the timeout back in.
	//	setTimeout(function () {
			var feed = new AoPS.Community.Models.Feed({
				master : master
			}),
			feed_view = new AoPS.Feed.Views.FeedMaster({
				model : feed		
			});
			
			$('body').append(feed_view.$el);
	//	}, 1000);		
		if (typeof AoPS.bootstrap_data.cmty_is_testing === 'boolean' &&
		AoPS.bootstrap_data.cmty_is_testing) {
			app.navigate('', {trigger : true});
			setTimeout(function () {
//				Community.TestSuite.executeAll();
				Community.TestSuite.executeTestModuleByName('topic_moderate');
			}, 1000);
		}

		if (!AoPS.session.logged_in) {
			$('a.cmty-login').on('click', function (e) {
				AoPS.login.display();
				e.stopPropagation();
				e.preventDefault();
			});
		}

		
	});
	
	
	
	return Community;
}(AoPS.Community || {}));

