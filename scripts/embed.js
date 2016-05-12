"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var error, events, bits, station, list, lists = document.querySelector("#lists");

    Object.toArray = function (obj)
    {
        return Object.keys(obj)
            .reduce(function (list, key)
            {
                list.push(obj[key]);
                return list;
            }, []);
    };

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
        document.body.style.overflow = "";
    }

    // Detect a URL with #station-0 or #stream-0-0
    if (/^#(?:station-[\da-zA-z]+|stream-[\da-zA-z]+-[\da-zA-z]+)$/.test(location.hash))
    {
        bits = location.hash.split("-");
        station = Relive.fromBase62(bits[1]);

        // Get the loading indicator sooner.
        if (bits[0] === "#station")
        {
            list = document.createElement("ol");
            list.setAttribute("reversed", "reversed");
            document.getElementById("lists").appendChild(list);
        }
        else
        {
            Replayer.autoplay = false;

            document.getElementById("back").style.display = "none";
            lists.style.transition = "none";
            lists.style.marginLeft = "-100%";
        }

        Relive.loadStations(function (stations)
        {
            station = stations[station];

            if (station && bits[0] === "#station")
            {
                Relive.loadStationInfo(station.id, function (info)
                {
                    var streams;

                    streams = Object.toArray(info.streams)
                        .sort(function (a, b)
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
                    document.querySelector("#lists h1").textContent = info.name;

                    document.getElementById("back").addEventListener("click", function (event)
                    {
                        pause();
                        App.menu(false);
                        lists.style.marginLeft = "";
                    });

                    initialized();
                }, perror);
            }
            else if (station)
            {
                Relive.loadStationInfo(station.id, function (info)
                {
                    var stream = info.streams[Relive.fromBase62(bits[2])];

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
