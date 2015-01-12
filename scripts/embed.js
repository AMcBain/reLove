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

    function entry (station, stream)
    {
        var date, time, length, info, title, entry;

        date = new Date(stream.timestamp * 1000).toISOString();
        time = document.createElement("time");
        time.setAttribute("datetime", date);
        time.textContent = date.replace("T", " ").replace(/\..+$/, "");

        length = document.createElement("span");
        length.textContent = Time.duration(stream.length, true);

        info = document.createElement("span");
        info.textContent = stream.host + " - " + stream.infoText;

        title = document.createElement("h3");
        title.textContent = stream.name + " ";
        title.appendChild(info);

        entry = document.createElement("li");
        entry.setAttribute("data-id", stream.id);
        entry.appendChild(time);
        entry.appendChild(length);
        entry.appendChild(title);

        entry.addEventListener("click", function ()
        {
            document.body.style.overflow = "hidden";
            Replayer.loadStream(station, stream, 0);

            menu(true);
            document.getElementById("lists").style.marginLeft = "-100%";
            window.scrollTo(0, 0);
        });

        return entry;
    }

    function error (message)
    {
        var error;

        error = document.createElement("p");
        error.className = "error";
        error.textContent = message;
        lists.appendChild(error);
        error.style.marginTop = -error.offsetHeight / 2 + "px";
        error.style.marginLeft = -error.offsetWidth / 2 + "px";

        if (list)
        {
            list.className = "loaded";
        }
        document.getElementById("player").className = "loaded";

        lists.parentNode.className = "error";
    }

    // relive:track-1-9c-L #track-1-9c-1P

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
                        list.appendChild(entry(station, stream));
                    });

                    list.className = "loaded";
                    document.querySelector("#lists h1").textContent = info.name;

                    document.getElementById("back").addEventListener("click", function (event)
                    {
                        pause();
                        menu(false);
                        lists.style.marginLeft = "";
                    });
                }, error);
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
                        error("Invalid stream ID.");
                    }
                }, error);
            }
            else
            {
                error("Invalid station ID.");
            }
        });
    }
    else
    {
        error("No station or stream specified.");
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
