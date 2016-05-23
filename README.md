Less technical: http://amcbain.github.io/reLove/

reLove
======

reLove your favorite past radio broadcasts right from the browser. This project is a browser app for interfacing with http://relive.nu/
It is mostly feature compatible with the reLive desktop clients, more details about which are listed below. This the first pass at such a
thing and may not become the official app or in its current form. For practical and name recognition purposes the interface says
reLive, and it would likely be deployed as such.

There are possibly some bugs or rough edges remaining in this project. Please file the appropriate tickets with labels for items found.

There may be some issues with seeking and caching of streams as there is not, at time of writing, range request support on reLive.nu.
This means browsers will try to download the entire stream first, and if you reload while its downloading it may cache a partial and stop
the stream early when playing it back later. This will go away as Ziphoid is working on range support. If you have issues of this sort
and it is _not_ related to the previous, please file a ticket.

**Feature Notes**

It really all depends on whether you're referencing reLive v.19 downloadable from relive.nu or reLiveQt available from relive.gulrak.net.
They have largely the same features just named differently and in different locations. The list below skips features that do not make
sense to a web-based application, such as minimizing to the system tray or checking for updates.

Unsupported features from both:

* Show the chat log for streams beyond the current playback position.
* Handling relive:// links (see [issue #14](https://github.com/AMcBain/reLove/issues/14))
* Generating relive:// links. All generated links currently point directly to the app itself.

Unsupported features from reLive v.19:

* "Hide conversations in tracklist", because it is unknown what that actually does.
* "Ctrl+V - Start playing link from clipboard" as paste events only work on elements designed to receive a pasted data (inputs, etc.)*

Unsupported features from reLiveQt:

* Searching for stations or streams.
* Changing the base URL used to fetch data.*
* The entire Audio tab under Preferences. Such playback options must be configured with your OS or browser as appropriate.*
* The entire Chat tab under Preferences. Changing the colors in the chat log can be done with a custom user stylesheet for those inclined
to write CSS. Those who are not can get one from those who are.* See [the styling documentation](https://github.com/AMcBain/reLove/blob/master/STYLING).

\* It is unlikely these features will ever be supported. Use the workarounds next to each such feature above, if listed.

Partially supported:

* (reLive v.19) "Resume playing from last position on application start" is only partially supported; the app will not intuit where to
resume playback for the last stream played when opened in a new tab, but reopened tabs or tabs from previous browser sessions with a hash
at the end of the URL indicating the playback location will work.
* (reLive v.19) "Ctrl+X and Ctrl+C - Create a link to the current playback position and copy it to the clipboard." because clipboard
support is effectively non-existent. There are menu items, and additionally context menu items in Firefox, offering this ability.
* (reLiveQt) "Notify on track change" is only available in browsers where support for the web notifications API exists.

Any remaining unmentioned features should be supported in full.

Dependencies
------------

This project depends on Gargaj's relive.js library. It is set up as a submodule in the repository, so when you clone this repository
it is likely you'll need to initialize the submodule. To initialze submodules on clone, in newer versions of Git, just include the
following flag.

    git clone --recursive [...]

If that doesn't work, ask Google how to do it.

Deploying
---------

Rather simple to deploy. Just drop the files from the repository somewhere web accessible or double click to run in a browser locally.
Internet access to be able to talk to the reLive website is required.

**Embedding**

reLove is amenable to certain kinds of embedding inside an iframe. Just reference the embed.html file with a hash corresponding to a
reLive-format value for a station (`#station-1`) or a stream (`#stream-1-9c`). These can be gotten by visiting the regular version and
borrowing the same parts from the URL that appear when a stream is opened. Certain features will be unavailable in the embedded version
as they do not make much sense in an iframe. Notably the ability to get URLs to streams through the UI has been disabled as this app does
not yet generate true reLive URIs and so any URL generated would be relative to the page the iframe is viewing.

    <iframe src="embed.html#station-1">
        Your browser is too old to display this content.
    </iframe>

The minimum recommended size of the iframe for the full experience is a width of 500px and a height of 300px. As this app does not set
its own base font size this recommended height is approximate, based on desktop browser values. Below this height the app will assume it
is being used for an embedded stream, hiding the segment list and chat log followed by the headers if made smaller still. This allows for
a rather compact display of the current track, controls, and progress area for a stream. However due to the lack of a header at such
small heights users will be unable to return to the stream list when starting from an embedded station.

***Events***

The embedded version does support events using `postMessage`. The `messages.js` file offers an API to aid in passing or decoding messages
but isn't necessary. Supported events include notification of initialization, play, pause, and getting paused status.

    var player = document.getElementById("player").contentWindow;
    
        window.addEventListener("message", function (event) {
        if (event.data === "relive:initialized") {
            player.postMessage("relive:play", "*");
        }
    });

More examples and information can be found at http://amcbain.github.io/reLove/embed.html

License
-------

Standard MIT license. See the included LICENSE file. This license does **not** apply to any submodule dependencies. Those retain their
licenses. Gargaj has indicated the relive.js project is Public Domain.
