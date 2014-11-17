reLove
======

reLove your favorite past radio broadcasts right from the browser. This project is a browser app for interfacing with http://relive.nu/
It is almost feature compatible with the reLive desktop client, lacking some of the applicable items from the settings menu. This the
first pass at such a thing and may not become the official such app or in its current form. For practical and name recognition purposes
the interface says reLive, and it would likely be deployed as such.

There are likely some bugs or rough edges in this project, as well as design issues. Please file the appropriate tickets with labels for
items of these sort.

There may be some issues with seeking and caching of streams as there is not (at time of writing) range request support for reLive. This
means browsers will try to download the entire stream first, and if you reload while its downloading it may cache a partial and stop the
stream early when playing it back later. This will go away as Ziphoid is working on range support. If you have issues of this sort and it
is **not** related to the previous, file a ticket.

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
