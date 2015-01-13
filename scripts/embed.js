"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var bits, station, list, lists = document.querySelector("#lists");

    Object.toArray = function (obj)
    {
        return Object.keys(obj)
            .reduce(function (list, key)
            {
                list.push(obj[key]);
                return list;
            }, []);
    };

    function pause ()
    {
        Replayer.pause();
        document.body.style.overflow = "";
    }

    function menu (full)
    {
        document.getElementById("menu").style.display = (Notifications.supported || full ? "" : "none");
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
                        menu(false);
                        lists.style.marginLeft = "";
                    });
                }, App.error);
            }
            else if (station)
            {
                Relive.loadStationInfo(station.id, function (info)
                {
                    var stream = info.streams[Relive.fromBase62(bits[2])];

                    if (stream)
                    {
                        Replayer.loadStream(station, stream, 0);
                    }
                    else
                    {
                        App.error("Invalid stream ID.");
                    }
                }, App.error);
            }
            else
            {
                App.error("Invalid station ID.");
            }
        });
    }
    else
    {
        App.error("No station or stream specified.");
    }

    document.querySelector("#menu > span").addEventListener("click", function (event)
    {
        event.target.parentNode.className = (event.target.parentNode.className ? "" : "open");
    });

    if (Notifications.supported)
    {
        (function ()
        {
            var setting = document.getElementById("notify-segment-changes");

            if (localStorage)
            {
                setting.checked = (localStorage.notifySegmentChanges === "true");
            }

            setting.addEventListener("change", function (event)
            {
                if (localStorage)
                {
                    localStorage.notifySegmentChanges = setting.checked;
                }
            });
        }());
    }
    else
    {
        // If no notification support, hide the menu by default and remove the only dependent option.
        // The menu will be unhidden on the replayer screen to allow access to the remaining features.
        document.getElementById("menu").style.display = "none";
        document.getElementById("notify-segment-changes").parentNode.setAttribute("data-disabled", "disabled");
        document.querySelector("#lists header").style.paddingRight = "1em";
    }

    Events.keydown(window, 120, function (event)
    {
        document.querySelector("#menu > span").click();
    });
});
