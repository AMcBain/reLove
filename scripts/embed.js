"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var error, events, hash, bits, options = {}, station, list, lists = document.querySelector("#lists");

    function perror (response, status)
    {
        // This reveals more to code-based API callers than the UI would. Consider changing?
        error = {
            type: "initialization",
            value: status + ": " + response
        };
        App.error.apply(this, arguments);
    }

    function initialized ()
    {
        window.parent.postMessage(Messages.INITIALIZED, "*");
    }

    function pause ()
    {
        Replayer.pause();
        document.body.parentNode.style.overflow = "";
        document.body.style.overflow = "";
    }

    // Detect a URL with #station-0 or #stream-0-0
    if (/^#(?:station-[\da-zA-z]+|stream-[\da-zA-z]+-[\da-zA-z]+)(?:\|options=.*)?$/.test(location.hash))
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
            });
        }

        if (bits[0] === "#stream")
        {
            Replayer.autoplay = false;

            if (!options.showbackbtn)
            {
                document.getElementById("back").style.display = "none";
                lists.style.transition = "none";
            }
            lists.style.marginLeft = "-100%";
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
                    var streams, id = Relive.fromBase62(bits[2]), stream;

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

                    if (stream)
                    {
                        Replayer.loadStream(station, stream, 0, initialized);
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
        App.error("No station or stream specified.");
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
    events[Messages.PAUSED] = function ()
    {
        window.parent.postMessage(Messages.create(Messages.PAUSED, Replayer.paused), "*");
    };

    window.addEventListener("message", function (event)
    {
        var data = Messages.parse(event.data), handler = events[data.message];

        if (handler && error)
        {
            window.parent.postMessage(Messages.create(data.message, error, true), "*");
        }
        else if (handler && !error)
        {
            handler();
        }
    });
});
