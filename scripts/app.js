"use strict";
Relive.useSingleton = false;

window.addEventListener("load", function ()
{
    var load, latest = [];

    Element.prototype.text = function (text)
    {
        return text && (this.textContent = text) && this || this.textContent;
    };

    Object.toArray = function (obj)
    {
        return Object.keys(obj)
            .reduce(function (list, key)
            {
                list.push(obj[key]);
                return list;
            }, []);
    };

    // Display timestamp, title, host + info text, and how long the show is.
    // timestamp  | Title
    // showlength | host - info text
    function entry (item)
    {
        // new Date().toISOString().replace("T", " ").replace(/\..+$/, "");
    }

    function latestStreams ()
    {
        var date, list, lists;

        if (latest)
        {
            lists = document.getElementById("lists");

            date = new Date();
            date = date.setMonth(date.getMonth() - 3);

            list = lists.children[1];
            list.setAttribute("reversed", "reversed");

            latest.sort(function (a, b)
            {
                return b.timestamp - a.timestamp;
            })
            .every(function (stream, i)
            {
                var entry = document.createElement("li");
                entry.textContent = stream.name;
                entry.addEventListener("click", function (event)
                {
                    // TODO call player.
                });
                list.appendChild(entry);
console.log(stream);
                return stream.timestamp >= date || list.children.length < 25;
            });

            latest = null;
        }
    };

    function stationInfo (station, parent)
    {
        Relive.loadStationInfo(station.id, function (info)
        {
            var list = document.createElement("ol");
            list.setAttribute("reversed", "reversed");

            // Again? :(
            info.streams = Object.toArray(info.streams)
                .sort(function (a, b)
                {
                    return b.timestamp - a.timestamp;
                });

            info.streams.forEach(function (stream)
            {
                var entry = document.createElement("li");
                entry.textContent = stream.name;
                entry.addEventListener("click", function (event)
                {
                    // TODO call player.
                });
                list.appendChild(entry);

                if (latest)
                {
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
        event.target.className = "active";
        event.target.nextElementSibling.className = "";
        document.querySelector("#lists > ol").style.marginLeft = "";
    });

    document.getElementById("stations").addEventListener("click", function (event)
    {
        event.target.className = "active";
        event.target.previousElementSibling.className = "";
        document.querySelector("#lists > ol").style.marginLeft = "-100%";
    });
});
