reLove
======

reLove your favorite past radio broadcasts right from the browser. This project is a browser app for interfacing with http://relive.nu/
It is mostly feature compatible with the reLive desktop client, more details about which are listed below. This the first pass at such a
thing and may not become the official such app or in its current form. For practical and name recognition purposes the interface says
reLive, and it would likely be deployed as such.

There are likely some bugs or rough edges in this project, as well as design issues. Please file the appropriate tickets with labels for
items of these sort.

There may be some issues with seeking and caching of streams as there is not (at time of writing) range request support for reLive. This
means browsers will try to download the entire stream first, and if you reload while its downloading it may cache a partial and stop the
stream early when playing it back later. This will go away as Ziphoid is working on range support. If you have issues of this sort and it
is _not_ related to the previous, file a ticket.

**Feature Notes**

It really all depends on whether you're referencing reLive v.19 downloadable from relive.nu or reLiveQt available from relive.gulrak.net.
They have largely the same features just named differently and in different locations. The list below skips features that do not make
sense to a web-based application, such as minimizing to the system tray or checking for updates.

Features not supported from both:

* Show the chat log for streams beyond the current playback position.
* Handling relive:// links (see issue #14)
* Generating relive:// links. All generated links are currently relative to the app itself.

Features not supported from reLive v.19:

* "Hide conversations in tracklist", because it is unknown what that actually does.
* "Ctrl+V - Start playing link from clipboard" as paste events only work on elements designed to receive a pasted data (inputs, etc.)*

Features not supported from reLiveQt:

* Showing the website URL for stations.
* Changing the base URL used to fetch data.*
* "Default Station", or a way to automatically open to a specific station.
* The entire Audio tab under Preferences. Such playback options must be configured with your OS or browser as appropriate.*
* The entire Chat tab under Preferences. Changing the colors in the chat log can be done with a custom user stylesheet for those inclined
to write CSS. Those who are not can get one from those who are.*

\* It is unlikely these features will ever be supported. Use the workarounds next to each such feature above, if listed.

Partially supported:

* (reLive v.19) "Resume playing from last position on application start" is only partially supported; the app will not intuit where to
resume playback for the last stream played when opened in a new tab, but reopened tabs or tabs from previous browser sessions with a has
at the end of the URL indicating the playback location will work.
* (reLive v.19) "Ctrl+X and Ctrl+C - Create a link to the current playback position and copy it to the clipboard." because clipboard
support is effectively non-existent. There are menu items, and context menu items in addition in Firefox, offering this ability.
* (reLiveQt) "Notify on track change" is called "notify segment changes" and is only available in browsers where support for the web
notifications API exists.

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

License
-------

Standard MIT license. See the included LICENSE file. This license does **not** apply to any submodule dependencies. Those retain their
licenses. Gargaj has indicated the relive.js project is Public Domain.

(This is a prototype software so the choice of this can be debated later.)
