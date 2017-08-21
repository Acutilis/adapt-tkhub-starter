# adapt-tkhub-starter

This Adapt extension is **for developers**.

A sample Adapt extension that is compatible with adapt-trackingHub, and serves as a starting point for anybody who needs to create a custom tracking extension for Adapt.


**Important**: This extension works with [adapt-trackingHub](https://github.com/Acutilis/adapt-trackingHub), so it is required that it be installed and enabled in your course.


## Usage 

This extension works, and implements all the major concepts that a trackingHub-compatible extension could implement. However, since it is just only an skeleton/example to make it easier for anybody to get started with her/his own tracking extension, its functionality is mimimal (and with little practical use).

To use in your dev environment:a

1. make sure you have installed [adapt-trackingHub](https://github.com/Acutilis/adapt-trackingHub) first. 
2. Clone this repo anywhere in your computer, outside of your Adapt course.
3. Copy the adapt-tkhub-starter folder to the src/extensions folder of your Adapt course.
4. Modify the config of your course to include the config shown in the example file.
     Use the following configuration for trackingHub:
  ```
  "_trackingHub": {
        "_isEnabled": true,
        "_courseID" : "http://www.acme.com/courses/4f4f4f",
        "_identifyById": false,
        "_browserChannel": {
            "_isEnabled": false,
            "_reportsEvents": false,
            "_tracksState": false,
            "_isStateSource": false,
            "_isStateStore": false,
            "_isLaunchManager": false,
            "_ignoreEvents": []
        }
   }
  ```
5. From the source directory of your course, build your course (grunt dev), and in another terminal run the dev server (grunt server).

To access the course, open your browser (open the console in dev tools) and go to http://localhost:9001/?userID=1. You will see a couple of errors: a 404 and another one. This is because the example extension is supposed to communicate with a server. If you haven't started the example server, it's normal that you get this error.

The ?userID query parameter has to be provided, because the example is written with the assumption that we'll pass the userID in the query parameters. See the explanations in the code.

### Example apiServer
In order to provide a complete example, a minimal server that implements our example API is provided in the apiServer directory. It is developed with Python/Tornado. Any explanations about Python, Tornado, the server, etc. are out of the scope of this document. It's just a piece we need to be able to run our example Adapt extension.

Open a terminal window for this.

To run the apiServer, you need Python 2.7. It is recommended to use virtual envs in Python to keep things clean (or better yet, Conda environments).

1. Create a virtual environment (or conda environment), and get into it (source activace <name_of_env>), or, if you just want to use your global Python, that's fine.
2. Install Tornado:
  ```
       pip install tornado   (for normal virtualenv or using the global Python installation)
  ```
    or
  ```
       conda install tornado   (If you're using Conda or miniConda)
  ```
3. Run the apiServer:
  ```
     python apiServer.py
  ```

With the apiServer running in your terminal window, go to your browser and open your course. In the console of the browser's dev tools, you'll see log messages detailing what's happening. In the terminal window where your apiServer is running, you'll see all the interactions with the server. If you stop the server (ctrl-C) you will see that it has created a file (or more, if you have used different userIDs in the query string of the URL). You can see its contents, it's just a text file where the state is saved, and from where the state is loaded. The name of the file is derived from the course name and the user id. This is a very spartan way to save and load states, but it is ok for an example, and besides, it's very easy to see what the server has saved.

When you've played around a bit, look at the final section (Try this twist).

When you are ready to start transforming this starter skeleton to suit your needs, you should rename everything that has the 'starter' string in the example to whatever name you want. Create a repo and don't forget to update the bower.rc file if you ever want to register your extension in the Adapt plugin registry.

## Settings

Here is the description of the settings:

- `_isEnabled`: True or false (defaults to true), to enable or disable this extension globally. Useful to turn on or off all the channels managed by this Channel Handler.
- `_channels`: An Array that contains objects with the settings for each channel you want to define.

The settings for **each** channel are:

- `_name`: An arbitrary name for the channel. It is used for logging to the browser's console, so you can clearly see from which channels the messages are coming.
- `_isEnabled`, `_reportsEvents`, `_tracksState`, `_isStateSource`, `_isStateStore`, `_isLaunchManager` and `_ignoreEvents`: These are explained in [the adatp-trackingHub documentation](https://github.com/Acutilis/adapt-trackingHub/blob/master/README.md). These settings (plus `_name`) are common to any type of channel. That is, any channel handler should implement them.

The following settings are _specific_ for the adapt-tkhub-starter extension:

- `_apiRoot`: It our example api root endpoint.
- `_isFakeApiRoot`: True or false (defaults to false). Setting it to true will cause trackingHub to **not** attempt to interact with the api server. Instead, it will just log the event or state data to the console, so you can see it. This way, you can develop/test without running the apiServer.


## Recommended reading

To really understand the [adapt-trackingHub](https://github.com/Acutilis/adapt-trackingHub) ecosystem, it is recommended to read its documentation, and also the [wiki](https://github.com/Acutilis/adapt-trackingHub/wiki).

Remember that adapt-trackingHub provides a foundation, a general infrastructure for 'tracking in general'. The **specifics** of a tracking solution are implemented in Adapt extensions that 'play well' with the trackingHub foundation. We call them 'channel handlers' because that's the role that these Adapt tracking extensions play in the trackingHub ecosystem. So, depending on what you need to do, you will have to write more or less code. The idea with this 'starter/template Adapt extension' is that it gives you a framework, a number of concepts that have already been used in custom tracking extensions (e.g., the adapt-tkhub-xAPI extension implements xAPI tracking). You can take this skeleton, and modify it for your particular situation.

The source code for the channel handler (starterChannelHandler.js) is heavily commented, explaining in detail what the code does, what you need to leave untouched and what you have to add/modify. That's the point, to provide explanations, so there are way more comments than code (but the necessary code is functional).

To get a more complete view, it is recommended to read the source code of the browserChannelHandler provided with adapt-trackingHub, and the source code of [adapt-tkhub-xAPI](https://github.com/Acutilis/adapt-tkhub-xAPI), since it implements an implementation of a real-world tracking solution.


## Try this twist

Now change the configurations of trackingHub to be like this:

```
  "_trackingHub": {
        "_isEnabled": true,
        "_courseID" : "http://www.acme.com/courses/4f4f4f",
        "_identifyById": false,
        "_browserChannel": {
            "_isEnabled": true,
            "_reportsEvents": false,
            "_tracksState": true,
            "_isStateSource": false,
            "_isStateStore": false,
            "_isLaunchManager": false,
            "_ignoreEvents": []
        }
   }
```
(we changed `_isEnabled` to `true` and `_tracksState` to `true`).

Leave the configuration for adapt-tkhub-starter as it was.

Go ahead and reload your course: http://localhost:9001/?userID=1 and navigate around. You will see in your console logs that then the state is saved, it now saves a lot more information. If you look inside the file that the server saves, you will see it saves a ton of information. Do complete a few components of your course. If you have the PageLevelProgress activated in your course, you will see indicators of your progres.

Now **reload** with the same url (http://localhost:9001/?userID=1), you will see that the course shows the progress from before. 
If you load the course with different user ids, for example http://localhost:9001/?userID=2,  3, 4 etc., you will see that the 'state' for each user is saved and restored.

What has happened? You did not touch _anything in your channel handler_!, not even in its configuration! You only enabled the default browserChannel (that comes with trackingHub), and configured it to track state (`_tracksState` is true). This shows how _trackingHub_ is really a hub that makes the different tracking extensions work together. What you did was to activate the 'trackState' functionality in the default browserChannel, which implements a pretty complete state representation. The example starterChannelHandler is set to save and load the state, **even the pieces of state that other tracking extensions create**, so they work seamlessly together. This way, you can 'mix' the fundamental pieces of tracking functionality (launch sequence, represent/track state, save state, load state) of various tracking extensions. For example, the adapt-tkhub-xAPI extension does not implement 'trackState' ... we normally use the one provided by browserChannelHandler.

Example: If you needed to use the adapt-tkhub-xAPI extension but you need a different state representation, you could -for example- write a new trackingHub-compatible extension (starting from adapt-tkhub-starter) but you would only need to implement the 'updateState' function, to suit your needs. Then, with relatively little work on your part, you can have xAPI tracking with your own state representation.

Another example: if you wanted to do just event tracking (no state) and send events to an existing API, say the Slack API, for example, you would only need to implement the 'deliverMsg' function so it works with the Slack API, and in your configuration you would turn everything else off. This way, your course would be sending messages to Slack as your users progress through the course. In this scenario, to avoid being inundated by all the default events that are tracked, you could would implement specific event handling in your extension, so you would only send messages to Slack when a user Completes a course (for example.)

Taking that last example a little further, you could 'combine' normal xAPI tracking (with adapt-tkhub-xAPI) with this other 'custom tracking extension' that only sends messages to Slack when a user completes a course. Both extensions can be in use at the same time in a course.

It is true that the trackingHub ecosystem takes some effort to 'get', but it offers great flexibility. Scenarios like the one mentioned before show why 'custom tracking' still matters, and that a 'base tracking infrastructure' that allows various specific tracking implementations to work together makes sense.
