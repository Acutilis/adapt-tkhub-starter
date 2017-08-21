define([
         'coreJS/adapt',
         'extensions/adapt-trackingHub/js/adapt-trackingHub',
         './jsonMessageComposer',
], function(Adapt, trackingHub, msgComposer) {

  var StarterChannelHandler = _.extend({

    // DO NOT REMOVE these 3 data items. They are needed by trackingHub!
    _CHID: 'starterChannelHandler',
    _OWNSTATEKEY: 'starter',
    _OWNSTATE: null,

    // DATA to be used internally by this ChannelHandler:
    _userID: null,
    _apiRoot: null,
    _numCompletedComponents: 0,
    _numEventsProcessed: 0,



    initialize: function() {
      console.log('Initializing starterChannelHandler' );
      this.listenToOnce(Adapt.trackingHub, 'stateReady', this.onStateReady);
      trackingHub.addChannelHandler(this);
    },

    /*******************************************
    /*******      CONFIG  FUNCTIONS      *******
    /*******************************************/

    checkConfig: function() {
      this._config = Adapt.config.has('_tkhub-starter')
        ? Adapt.config.get('_tkhub-starter')
        : false;
      if (!this._config )
        return false;

      this._config._channels = this._config._channels || [];
      if (! _.isArray(this._config._channels)) {
        console.log('The _channels setting must be an array.');
        return false;
      }
      var allChCorrect = true;
      _.each(this._config._channels, function(channel) {
          allChCorrect = allChCorrect && trackingHub.checkCommonChannelConfig(channel);
          allChCorrect = allChCorrect && this.checkSpecificConfig(channel);
      }, this);
      return allChCorrect;
    },

    checkSpecificConfig: function(channel) {
      // For any undefined values, set a default. Check that all the settings have the correct types.
      if (channel._apiRoot == undefined)
        channel._apiRoot = '';
      if (channel._isFakeApiRoot == undefined)
        channel._isFakeApiRoot = false;
      if (channel._userName == undefined)
        channel._userName = '';
      if (channel._password == undefined)
        channel._password = '';
      if ( _.isBoolean(channel._isFakeApiRoot)) {
         return true;
      }
      console.log('There are errors in the specific channel settings for channel ' + channel._name + '.');
      return false;
    },

    getChannelDefinitions: function() {
      return this._config._channels;
    },


    /*******  END CONFIG FUNCTIONS *******/


    /*******************************************
    /*******  LAUNCH SEQUENCE  FUNCTIONS *******
    /*******************************************/

    startLaunchSequence: function(channel, courseID) {
      // For tracking, it is usually neccesary to have at least 2 pieces of info:
      //  1- Some "identity" of the user who is using the content
      //  2- A destination for the data. This destination usually requires some form of
      //     authentication (username and password, token, etc.)
      //  Your custom tracking plugin (this ChannelHandler) will need to get or generate
      //  this information somehow.
      //  Some common ways to provide this info to the channel handler are:
      //  - In the configuration: if the info is 'static', always the same for all content,
      //    for example the endpoint of an API where you're going to send the event data,
      //    also, the credentials could be placed in the configuration.
      //  - Through query parameters. The link to launch the content could include query
      //    parameters that the ChannelHandler can read.
      //  - Through interaction with a server component.
      // Regarding sensitive data (e.g. credentials to access an API), neither placing
      // it in the configuration or passing it through query params is secure, however 
      // using the config makes the sensitive info a bit (just a bit) more concealed (and
      // we all know that security through obscurity is no good).
      // Parameters:
      //   - channel: The **configuration** of this channel, taken from the config file.
      //   - courseID: The courseID set in the configuration of TrackingHub. It MUST
      //     be a URI that -hopefully- uniquely identifies the course.
      console.log(this._CHID + ': ' + channel._name + ': starting launch sequence...');
      // Call (or place here) your custom launch code.
      // Important: pass at least the 'channel' parameter
      this.starterLaunch(channel, courseID);
    },

    starterLaunch: function(channel, courseID) {
      // This example launch sequence (very simple) we're going to get:
      //  - the userID from the query string
      //  - the endpoint (destination for the data) from the configuration file.
      // To simplify, let's assume that the endpoint does not require any credentials.
      
      var qs = trackingHub.queryString();
      this._userID = JSON.parse(qs.userID);
      this._apiRoot = channel._apiRoot;

      // Another example: if we were running this tracking pluging alongside Spoor, we could
      // get the studentID with the following:
      //  this._studentID = pipwerks.SCORM.data.get("cmi.core.student_id");
      // (hard assumption on SCORM 1.2)
        
      // IMPORTANT: it is vital to signal the end of the launch sequence triggering
      // the 'launchSequenceFinished' event. If your launch sequence requires async calls
      // to other services, make sure that you MOVE this trigger to the end of your chain
      // of async calls. If you leave it here, you would be signaling the end of the launch
      // sequence prematurery, and errors or misbehaviour would surely ensue.
      // This example launch sequence is totally synchronous, there are no async calls
      // involved, so we just trigger the event here:
      this.trigger('launchSequenceFinished');
      console.log(this._CHID + ': ' + channel._name + ': launch sequence finished.');
    },


    /*******  END LAUNCH SEQUENCE FUNCTIONS *******/



    /*******************************************
    /*******  EVENT PROCESSING FUNCTIONS *******
    /*******************************************/

    // the processEvent function MUST exist in any channel handler, even
    // if it does not do anything at all. It is called by trackingHub.
    // A channel handler may or may not do any processing on events.
    // It may report events, as they happen (but it's not required to do so)
    // It may use events to update an internal representation of state (but it's not required to do so)
    processEvent: function(channel, eventSourceName, eventName, args) {
      // This example channel handler will perform a pretty centralized processing of
      // all events. On every event, it is going to:
      //  - compose & deliver the message corresponding to this event, if configured to do so
      //    (that is, if this channel isEventTracker is true )
      //  - update its internal state representation
      // msgComposer is a reference to the message composer that this particular channel handler uses.
      // If your channel handler processes events, you can leave the following snippet
      // as is (you will write your custom code in the deliverMsg function).
      var isEventIgnored = _.contains(channel._ignoreEvents,eventName);
      if ( !isEventIgnored && channel._reportsEvents ) {
        var message = msgComposer.compose(eventSourceName, eventName, args, channel)
        if (message) {
          this.deliverMsg(message, channel);
        }
      }

      // All the functionality regarding HOW to express the information related to an event
      // is left to the MessageComposer. 
      // The information about an event (what has happened, with what parameters etc.) can
      // be expressed in any way you want, it is arbitrary. So, the channelHandler uses a
      // messageComposer to 'express' event info.
      // For example, you can express the info about your
      // events in a simple javascript object (like the provided jsonMessageComposer),
      // or as a line of text formatted as you please, or as a more complex json object,
      // like a xAPI Statement, for example.
      // So, in the snnipet above, we obtain a 'message' that expresses or conveys info
      // about an event. So we can call a 'deliverMsg' function that knows how to deliver
      // that info in your specific tracking environment.

      // If you want your channel handler to perform specific event handling (i.e., do something
      // when a specific event happens), you can leave the following snippet as is. You would
      // need to write specific handling functions as explained below.
      funcName = Adapt.trackingHub.getValidFunctionName(eventSourceName, eventName);
      if (this.hasOwnProperty(funcName)) {
         this[funcName](args);
      }
      // For example, in Adapt, the 'components' object triggers a 'change:_isComplete' event
      // every time a component is completed. In this case, the eventSourceName would be
      // 'components', and the eventName would be 'change:_isComplete'.
      // The above snippet just obtains a valid function name built from the eventSourceName
      // and the event name, and then calls it.
      // In our example, funcName would be 'components_change__isComplete'
      // Notice the double underscore, the getValidFunctionName replaces any ':' with '_'
      // (see the trackingHub source code).
      // So we would need to write a function called components_change__isComplete (see below)
      // if we want to do something every time any component is completed.
      // The above snippet is safe, that is, it checks that a function exists before attempting
      // to call it (otherwise you would get a runtime error). This means tha you ONLY need to
      // write functions for the events that you care about.

      // If there's any common processing that you want to perform every time ANY event happens,
      // (regardless of the event) you would call a custom function here.
      // For example, if we wanted to keep a counter of the events processed, we could do:
      this.incrEventsProcessed()
      // (see below for an example implementation of incrEventsProcessed)

      // And finally, if we need to update our internal State representation every time
      // an event is proccesed, do it here:
      if (channel._tracksState) {
        this.updateState();
      }
    },


    deliverMsg: function(message, channel) {
      // This is the function that really implements the mechanisms to deliver information
      // about an event to our tracking environment.
      // Let's assume that, in our example, our main apiRoot provides 2 endpoints:
      //  - /events , where we can POST our messages, and
      //  - /state, where we can POST or GET our state representation.
      // So, in this particular delivery function, we just want to POST the message
      // to the endpoint.
      if (channel._isFakeApiRoot) {
          console.log(this._CHID + ': ' + channel._name + ': FAKE deliverMsg:', message);
          return;
      }
      var completeURL = this._apiRoot + 'events';
      var payload = JSON.stringify(message);
      $.ajax({
        type: "POST",
        context: this,
        url: completeURL,
        data: payload,
        success: function(data, textStatus, xhr) {
          console.log(this._CHID + ': ' + channel._name + ': Message POSTed to endpoint.', message);
        },
        error: function(xhr, textStatus, errorStr) {
          console.log(this._CHID + ': ' + channel._name + ': Failed to POST message to endpoint.', textStatus, errorStr);
        }
      });
    },


    /*** General event processing functions ***/

    incrEventsProcessed: function() {
      this._numEventsProcessed += 1;
    },

    /*** END General event processing functions ***/

    /*** Specific event processing functions ***/

    components_change__isComplete: function(args) {
      this._numCompletedComponents += 1;
    },

    /*** END Specific event processing functions ***/


    /*******  END EVENT PROCESSING  FUNCTIONS *******/




    /*******************************************
    /*******  STATE MANAGEMENT FUNCTIONS *******
    /*******************************************/

    // We call State or State representation a piece of information (normally a 
    // javascript object, but it could be a string or whatever), that somehow 'encodes'
    // ANYTHING about the use of the course. It is totally arbitrary. Normally, the State
    // reflects what parts of the content have been completed, etc. but it could
    // get as fancy as you want, keeping track of the time that a user spends on each page,
    // on each component, etc.
    // A Channel Handler may implement the following INDEPENDENT functionalities regarding
    // State representations:
    // 1- trackState: It means to build and update a State representation. ONLY THAT. It can
    //    be as simple or as complex as you want, but it only deals with creating/updating
    //    an object that contains whatever info you want. If a channelHandler tracksState,
    //    it means that it implements this functionality.
    // 2- Save State: It means that the channel handler is capable of SENDING an arbitrary
    //    javascript object SOMEWHERE to be persisted. ONLY THAT.
    // 3- Load State: It means that the channel handler is capable of REQUESTING the State,
    //    from some service, and (normally) doing something with the info received (initialize
    //    internal data structures, initialize visual elements, etc.).
    // A channel handler MAY implement all three, only 2, only 1, or NONE of them.
    // Even if a channel handler implements these functionalities, the course developer can
    // turn them ON or OFF at will, through the configuration. A functionality

    // 1. Track State.
    // Let's assume that you want your channel handler to implement state tracking.
    // Then you must provide one or more functions that implement the state representation
    // that you need. In this simple example one function will suffice: updateState.

    updateState: function() {
      // Lets implement a very simple (and useless) state representation, in which
      // we only keep track of the total number of events processed, and the number
      // of completed events. Remember, a state representation can be anything that suits
      // your needs, very simple or very complex.

      if (this._OWNSTATE == null) {
          this._OWNSTATE = {}
      }
      this._OWNSTATE.num_completed_components = this._numCompletedComponents;
      this._OWNSTATE.num_events_processed = this._numEventsProcessed;
      
      // VERY IMPORTANT: do not forget the following line. Each channel handler maintains its own
      // representation of state, but it is ALSO RESPONSIBLE to set/update the corresponding
      // part of the global state
      Adapt.trackingHub._state[this._OWNSTATEKEY] = this._OWNSTATE ;
    },

    // 2. Save State
    // Let's assume that you want your channel handler to implement state saving.
    // Then we must implement the saveState function.
    // note: if you don't need to implement saveState, it is a good idea to still
    // place the function here, and leave it empty (that way, if the course creator
    // erroneously configures the channel as isStateStore, the function will be called,
    // but will do nothing). If the function doesn't exist, there will be an error 
    // (this will be fixed in trackingHub).
    // Also note that YOU NEVER have to CALL the saveState function from this channel Handler
    // it will be called by trackingHub!

    saveState: function(state, channel, courseID) {
      // Continuing with our simple example, we assumed that our sample backend api provides
      // an endpoint called '/state' that lets us POST our state object and it saves it.
      var completeURL = this._apiRoot + 'state';
      var obj_to_save = {
          data: state,
          user_id: this._userID,
          course_id: courseID
      }
      // Note that when saving state, we normally want to associate a 'state' with a
      // user and a course, otherwise we wouldn't know to whom or to what course the
      // state is about. That's why we've saved an object with those 3 pieces of data.
      // VERY IMPORTANT: Make sure that the data you save is the 'state' passed in the call,
      // DO NOT save this._OWNSTATE.
      // In the trackingHub ecosystem, a channel handler  is expected to SAVE whatever
      // data it receives as a parameter to saveState. That will certainly include the
      // saving channel handler's representation of state, but will also include state representations
      // that OTHER channel handlers might have created.
      // We always SAVE ALL the state. We always LOAD ALL the state. Each channel handler
      // uses the subset of the state that it knows how to handle.
      // Of course the server side will need to know what to do with the data it receives.
      // If you are implementing the server side, as well as the Channel Handler, you can
      // desing the endpoints and functionality however you want, they just have to work
      // together. If you're developing a channel handler against an existing API, you
      // need to make sure that your channel handler is calling the right endpoints with
      // the right data.
      var payload = JSON.stringify(obj_to_save);
      if (channel._isFakeApiRoot) {
          console.log(this._CHID + ': ' + channel._name + ': FAKE saved state: ', obj_to_save);
          return;
      }
      $.ajax({
        type: "POST",
        context: this,
        url: completeURL,
        data: payload,
        success: function(data, textStatus, xhr) {
          console.log(this._CHID + ': ' + channel._name + ': State POSTed to endpoint.', obj_to_save);
        },
        error: function(xhr, textStatus, errorStr) {
          console.log(this._CHID + ': ' + channel._name + ': Failed to POST message to endpoint.', textStatus, errorStr);
        }
      });
    },


    // 3. Load State
    // Let's assume that you want your channel handler to implement state loading.
    // Then we must implement the loadState function.
    // note: Any channel handlers can implement loadState functionality, but in the 
    // configuration of the course ONLY ONE channel should be configured with 
    // _isStateSource = true (i.e., only ONE of the channels.
    // Also note that YOU NEVER have to CALL the loadState function from this channel Handler
    // it will be called at the right time by trackingHub!

    loadState: function(channel, courseID) {
      // In our example api, we have the /state endpoint where we can GET the
      // state. So let's do it 
      console.log(this._CHID + ': ' + channel._name + ':  loading state...');
      if (channel._isFakeApiRoot) {
          console.log(this._CHID + ': ' + channel._name + ': FAKE loaded state');
          return;
      }
      var completeURL = this._apiRoot + 'state';
      var params = {
          user_id: this._userID,
          course_id: courseID
      }
      $.ajax({
        context: this,
        type: "GET",
        data: params,
        dataType: "json",
        url: completeURL,
        success: function(data, textStatus, xhr) {
          console.log(this._CHID + ': ' + channel._name + ': State loaded.');
          // IMPORTANT: the 'data' argument at this point is a text string (in json format)
          // we need to PARSE it to create a javascript object.
          var state_obj = data; //JSON.parse(data);
          // DO NOT, ever, use the state right here to do anything in this channel handler.
          // JUST trigger the stateLoaded event here. See below.
          this.trigger('stateLoaded', state_obj);
        },
        error: function(xhr, textStatus, errorStr) {
          console.log(this._CHID + ': ' + channel._name + ': Failed save State.', textStatus, errorStr);
        }
      });
      // REMEMBER that your channel handler works WITHIN the trackingHub ecosystem, so
      // even if the State is loaded using your channel handler, IT DOESN'T MEAN
      // that your channel handler is the only one who can use it:
      //   ANY trackingHub-compatible plugin that is active in the course can get and
      //   use the State loaded!
      // So, the way State loading works is:
      // 1- TrackingHub determines which (of the available and active channel handlers) is
      //    responsible for state loading, and it calls its 'loadState' function (the one
      //    you implemented above)
      // 2- The loadState function sends the 'stateLoaded' vent, with the full state
      //    (the data it got from the backend)
      // 3- Tracking hub hears the 'stateLoaded' event, updates its internal representation
      //    of the State (which comprises all of the individual representations of all the
      //    trackingHub plugins that track state)
      // 4- TrackingHub triggers the event 'stateReady', so EVERY active trackingHub plugin 
      //    in the course get an opportunity to get the state that was loaded.
      // 5- TrackingHub calls on each active channel handler a function called
      //    'applyStateToStructure' if it exist in the channel handler (if not, nothing
      //    happens).
    },

    onStateReady: function() {
      // This function will run at point 4 explained above.
      // All we do here is set our own state.
      this._OWNSTATE = Adapt.trackingHub._state[this._OWNSTATEKEY]; // the part of state that THIS channelHandler manages.
    },

    applyStateToStructure() {
      // In this simple example, there is nothing to apply from the state.
      // This operation, applying the state to the structure, refers to the structure
      // of the course itself. In the source code of trakingHub, take a look at the 
      // browserChannelHandler.js . In there you can see a complete implementation of
      // 'applyStateToStructure' code, along with a 'real' representation of state.
    },

    /*******  END STATE MANAGEMENT FUNCTIONS ********/

  }, Backbone.Events);

  StarterChannelHandler.initialize();
  return (StarterChannelHandler);
});

