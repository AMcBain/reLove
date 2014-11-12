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

    function latestStreams ()
    {
        var date, list;

        date = new Date();
        date = date.setMonth(date.getMonth() - 3);

        list = document.createElement("ol");
        list.setAttribute("reversed", "reversed");

        latest.sort(function (a, b)
        {
            return b.timestamp - a.timestamp;
        })
        .every(function (station, i)
        {
            var entry = document.createElement("li");
            entry.textContent = station.name;
            entry.addEventListener("click", function (event)
            {
                // TODO call player.
            });
            list.appendChild(entry);

            return station.timestamp >= date || list.children.length < 25;
        });

        document.getElementById("lists").appendChild(list);
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
                list.appendChild(entry);

                latest.push(stream);
            });

            clearTimeout(load);
            load = setTimeout(latestStreams, 2000);

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
            var entry, name;

            entry = document.createElement("li");
            entry.addEventListener("click", function (event)
            {
                // TODO call player.
            });

            name = document.createElement("div");
            name.textContent = station.name;

            entry.appendChild(name);
            list.appendChild(entry);

            stationInfo(station, entry);
        });

        document.getElementById("lists").appendChild(list);
    });
});
