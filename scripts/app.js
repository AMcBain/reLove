"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var load, latest = [], title = document.title, start, actions,
            streamMenuItems = Array.prototype.slice.call(document.querySelectorAll("#menu .group-stream"), 0);

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

    actions = {
        stream: function ()
        {
            var bits, stream, segment;

            // Detect a URL with #stream-0-0 or #track-0-0-0
            if (/^#(?:stream-[\da-zA-z]+-[\da-zA-z]+|track-[\da-zA-z]+-[\da-zA-z]+-[\da-zA-z]+)$/.test(location.hash))
            {
                bits = location.hash.split("-");
                start = Relive.fromBase62(bits[3] || "");

                try
                {
                    stream = Relive.fromBase62(bits[1]);
                    segment = Relive.fromBase62(bits[2]);
                    document.querySelector("[data-id='" + stream + "'] [data-id='" + segment + "']").click();
                }
                catch (e)
                {
                    console.log("There is no stream ", stream, " segment ", segment || "0", " only Zuul.");
                }
            }
        },
        latest: function ()
        {
            var element = document.getElementById("latest");
            element.className = "active";
            element.nextElementSibling.className = "";

            document.title = title;
            document.querySelector("#lists").style.marginLeft = "";
            document.querySelector("#lists > ol").style.marginLeft = "";

            streamMenuItems.forEach(function (item)
            {
                item.setAttribute("data-disabled", "disabled");
            });

            pause();
        },
        stations: function ()
        {
            var element = document.getElementById("stations");
            element.className = "active";
            element.previousElementSibling.className = "";

            document.title = title;
            document.querySelector("#lists").style.marginLeft = "";
            document.querySelector("#lists > ol").style.marginLeft = "-100%";

            streamMenuItems.forEach(function (item)
            {
                item.setAttribute("data-disabled", "disabled");
            });

            pause();
        }
    };
    actions[null] = actions.latest;

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
            Replayer.loadStream(station, stream, start);

            streamMenuItems.forEach(function (item)
            {
                item.removeAttribute("data-disabled");
            });

            document.getElementById("lists").style.marginLeft = "-100%";
            window.scrollTo(0, 0);
        });

        return entry;
    }

    function latestStreams ()
    {
        var date, list, lists;

        if (latest)
        {
            lists = document.getElementById("lists");

            date = new Date();
            date = date.setMonth(date.getMonth() - 3);

            list = lists.children[2];
            list.setAttribute("reversed", "reversed");

            latest.sort(function (a, b)
            {
                return b.timestamp - a.timestamp;
            })
            .every(function (stream, i)
            {
                list.appendChild(entry(stream._station, stream));
                return stream.timestamp >= date || list.children.length < 25;
            });

            list.className = "loaded";
            latest = null;

            // Firefox tries to restore the scroll state, which is now invalid.
            // Unfortunately this creates a funky state where the content is at
            // the top but the scrollbar is wherever Firefox put it. If you use
            // the scroll wheel, the page moves down from the top. Use the
            // scrollbar and Firefox snaps the page to its location first.
            window.scrollTo(0, 0);

            if (history.state && history.state.name === "stations")
            {
                actions.stations();
            }
            actions.stream();
        }
    };

    function stationInfo (station, parent)
    {
        Relive.loadStationInfo(station.id, function (info)
        {
            var list, streams;

            list = document.createElement("ol");
            list.setAttribute("reversed", "reversed");

            // Again? :(
            streams = Object.toArray(info.streams)
                .sort(function (a, b)
                {
                    return b.timestamp - a.timestamp;
                });

            streams.forEach(function (stream)
            {
                list.appendChild(entry(station, stream));

                if (latest)
                {
                    stream._station = station;
                    latest.push(stream);
                }
            });

            if (latest)
            {
                clearTimeout(load);
                load = setTimeout(latestStreams, 2000);
            }

            parent.appendChild(list);
        });
    };

    Relive.loadStations(function (stations)
    {
        var list = document.createElement("ul");

        // Why is this an object? When will there ever be meaningful holes in the list?
        stations = Object.toArray(stations)
            .sort(function (a, b)
            {
                return a.name.localeCompare(b.name);
            });

        stations.forEach(function (station, i)
        {
            var name, entry;

            name = document.createElement("div");
            name.addEventListener("click", function (event)
            {
                entry.className = (entry.className ? "" : "open");
                entry.style.height = (entry.className ? entry.scrollHeight + "px" : "");
            });
            name.textContent = station.name;

            entry = document.createElement("li");
            entry.setAttribute("data-id", station.id);
            entry.appendChild(name);
            list.appendChild(entry);

            stationInfo(station, entry);
        });

        document.getElementById("lists")
            .appendChild(document.createElement("ol"))
            .parentNode.appendChild(list);
    });

    document.getElementById("latest").addEventListener("click", function (event)
    {
        if (event.target.className !== "active")
        {
            actions.latest();

            if (history.pushState)
            {
                history.pushState({
                    name: "latest"
                }, "");
            }
        }
    });

    document.getElementById("stations").addEventListener("click", function (event)
    {
        if (event.target.className !== "active")
        {
            actions.stations();

            if (history.pushState)
            {
                history.pushState({
                    name: "stations"
                }, "");
            }
        }
    });

    if (Notifications.supported)
    {
        document.querySelector("#menu > span").addEventListener("click", function (event)
        {
            event.target.parentNode.className = (event.target.parentNode.className ? "" : "open");
        });

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
        document.getElementById("menu").style.display = "none";

        // No point reserving space for something which isn't shown. Also,
        // NodeList doesn't have nice utility properties like Array. Sadly.
        Array.prototype.forEach.call(document.querySelectorAll("header"), function (header)
        {
            header.style.paddingRight = "1em";
        });
    }

    // This will break the shortcut to turn on "caret browsing" in Firefox.
    // It is here for compatibility with the desktop client.
    Events.keydown(window, 118, 120, function (event)
    {
        if (event.keyCode === 118 && (document.querySelector("#lists").style.marginLeft || document.querySelector("#stations.active") === null))
        {
            document.querySelector("#lists > ol").style.marginLeft = "-100%";
            document.getElementById("latest").className = "";
            document.getElementById("stations").className = "active";
            document.getElementById("back").click();
        }
        else if (event.keyCode === 120)
        {
            document.querySelector("#menu > span").click();
        }
    });

    document.getElementById("back").addEventListener("click", function (event)
    {
        pause();
        start = null;

        streamMenuItems.forEach(function (item)
        {
            item.setAttribute("data-disabled", "disabled");
        });

        // Pausing is asynchronous and may do a history replacement which would happen after
        // the push state below if the action wasn't placed at the end of the event queue.
        setTimeout(function ()
        {
            if (history.pushState)
            {
                history.pushState({
                    name: document.querySelector("#latest.active,#stations.active").id
                }, "");
            }
            else
            {
                location.hash = "";
            }

            document.querySelector("#lists").style.marginLeft = "";
            document.title = title;
        }, 1);
    });

    if (history.pushState)
    {
        window.addEventListener("popstate", function (event)
        {
            actions[history.state && history.state.name]();
        });
    }

    streamMenuItems.forEach(function (item)
    {
        if (Copy.forceFallback)
        {
            item.innerHTML = item.innerHTML.replace(/\s+$/, "") + "...";
        }
        item.addEventListener("click", function (event)
        {
            document.dispatchEvent(Events.create(event.target.getAttribute("data-event")));
            document.getElementById("menu").className = "";
        });
    });
});
