"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var error, events, allowedEvents = [], hash, bits, options = {}, station, list, initialized,
        lists = document.querySelector("#lists");

    function sendMessage (message)
    {
        // If the page that loads embed.js is loaded directly,
        // not handling this would cause us to spam ourselves.
        if (window.parent !== window)
        {
            window.parent.postMessage(message, "*");
        }
    }

    function perror (response, status)
    {
        // This reveals more to code-based API callers than the UI would. Consider changing?
        error = {
            type: "initialization",
            value: status + ": " + response
        };
        App.error.apply(this, arguments);
    }

    function initialized (station, stream, tracks)
    {
        if (!initialized)
        {
            sendMessage(Messages.INITIALIZED, "*");
        }
        if (station && stream && tracks)
        {
            sendMessage(Messages.create(Messages.INFO, {
                station: {
                    id: station.id,
                    name: station.name
                },
                stream: {
                    id: stream.id,
                    streamName: stream.streamName,
                    hostName: stream.hostName,
                    duration: stream.duration
                },
                tracks: tracks
            }));
        }
    }

    function pause ()
    {
        Replayer.pause();
        document.body.parentNode.style.overflow = "";
        document.body.style.overflow = "";
    }

    // Detect a URL with #station-0 or #stream-0-0
    if (/^#(?:station-[\da-zA-Z]+|stream-[\da-zA-Z]+-[\da-zA-Z]+|track-[\da-zA-Z]+-[\da-zA-Z]+-[\da-zA-Z]+)(?:\|options=.*)?$/.test(location.hash))
    {
        hash = location.hash;

        if (hash.indexOf("|") !== -1)
        {
            options = hash.split("|");
            hash = options[0];
            options = options[1].replace(/^options=/, "").split(",").reduce(function (opts, option)
            {
                opts[option] = true;
                return opts;
            }, {});
        }

        bits = hash.split("-");
        station = Relive.fromBase62(bits[1]);

        // Get the loading indicator sooner.
        list = document.createElement("ol");
        list.setAttribute("reversed", "reversed");
        document.getElementById("lists").appendChild(list);

        if (options.showbackbtn || station && bits[0] === "#station")
        {
            document.getElementById("back").addEventListener("click", function (event)
            {
                pause();
                App.menu(false);
                lists.style.marginLeft = "";
                if (App.scrollingElement)
                {
                    App.scrollingElement.scrollTop = App.restoreScrollTo;
                }
            });
        }

        if (bits[0] === "#stream" || bits[0] === "#track")
        {
            Replayer.autoplay = false;

            if (!options.showbackbtn)
            {
                document.getElementById("back").style.display = "none";
                lists.style.transition = "none";
            }
            lists.style.marginLeft = "-100%";

            // Normally handled by clicking an entry, but since
            // we're auto-loading one we need to do it ourself.
            document.body.parentNode.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
        }

        Relive.loadStations(function (stations)
        {
            // Yes, this should be .find(...); IE ruined it.
            stations.some(function (_station)
            {
                if (_station.id === station)
                {
                    station = _station;
                    return true;
                }
                return false;
            });

            if (station && bits[0] === "#station")
            {
                Relive.loadStationInfo(station, function (info)
                {
                    var streams;

                    streams = info.streams.sort(function (a, b)
                    {
                        return b.timestamp - a.timestamp;
                    });

                    streams.forEach(function (stream)
                    {
                        list.appendChild(App.entry(station, stream, function ()
                        {
                            Replayer.loadStream(station, stream, 0);
                        }));
                    });

                    list.className = "loaded";
                    document.querySelector("#lists h1").textContent = info.stationName;

                    initialized();
                }, perror);
            }
            else if (station)
            {
                Relive.loadStationInfo(station, function (info)
                {
                    var streams, stream, id = Relive.fromBase62(bits[2]), start = Relive.fromBase62(bits[3] || "");

                    // IE again. See above.
                    info.streams.some(function (_stream)
                    {
                        if (_stream.id === id)
                        {
                            stream = _stream;
                            return true;
                        }
                        return false;
                    });

                    if (stream)
                    {
                        if (options.showbackbtn)
                        {
                            streams = info.streams.sort(function (a, b)
                            {
                                return b.timestamp - a.timestamp;
                            });

                            streams.forEach(function (stream)
                            {
                                list.appendChild(App.entry(station, stream, function ()
                                {
                                    Replayer.loadStream(station, stream, 0);
                                }));
                            });

                            list.className = "loaded";
                            document.querySelector("#lists h1").textContent = info.stationName;
                        }

                        Replayer.loadStream(station, stream, start, initialized);
                    }
                    else
                    {
                        error = {
                            type: "initialization",
                            value: "Invalid stream ID."
                        };
                        App.error(error.value);
                    }
                }, perror);
            }
            else
            {
                error = {
                    type: "initialization",
                    value: "Invalid station ID."
                };
                App.error(error.value);
            }
        });
    }
    else
    {
        App.error("No valid station, stream, or track specified.");
    }

    // To be written as if we're initialized. It's not their job to check.
    events = {};
    events[Messages.PLAY] = function ()
    {
        // This and pause may not succeed (no player yet). If so, the outside has no idea.
        Replayer.play();
    };
    events[Messages.PAUSE] = function ()
    {
        Replayer.pause();
    };
    events[Messages.SEEK] = function (to)
    {
        Replayer.seek(to);
    };
    events[Messages.CONFIGURE] = function (data)
    {
        Replayer.configure(data);
    };

    allowedEvents = Object.keys(events);

    Replayer.addEventListener("play", function ()
    {
        sendMessage(Messages.PLAY, "*");
    });
    Replayer.addEventListener("pause", function ()
    {
        sendMessage(Messages.PAUSE, "*");
    });
    Replayer.addEventListener("trackupdate", function (event)
    {
        sendMessage(Messages.create(Messages.TRACK, event.detail));
    });

    window.addEventListener("message", function (event)
    {
        var type, data, handler;

        try
        {
            error = null;
            data = Messages.parse(event.data);
            handler = events[data.message];
        }
        catch (err)
        {
            error = {
                type: "format",
                value: err.message
            };
            sendMessage(Messages.create(Messages.ERROR, error, true));
        }

        if (data && !error)
        {
            if (handler)
            {
                try
                {
                    handler(data.value);
                }
                catch (err)
                {
                    error = {
                        type: "exec",
                        value: err.message
                    };
                }
            }
            else
            {
                error = {
                    type: "event",
                    value: "Unrecognized event. Must be one of " + allowedEvents.join(", ")
                };
            }
        }

        if (error)
        {
            sendMessage(Messages.create(event.data.split("|")[0], error, true));
        }
    });

    sendMessage(Messages.LOADED);
});
