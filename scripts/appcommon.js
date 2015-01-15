"use strict";

var App = {};

window.addEventListener("load", function ()
{
    var streamMenuItems = Array.prototype.slice.call(document.querySelectorAll("#menu .group-stream"), 0);

    document.querySelector("#menu > span").addEventListener("click", function (event)
    {
        event.target.parentNode.className = (event.target.parentNode.className ? "" : "open");
    });

    // F9
    Events.keydown(window, 120, function (event)
    {
        document.querySelector("#menu > span").click();
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

    App.menu = function (full)
    {
        streamMenuItems.forEach(function (item)
        {
            if (full)
            {
                item.removeAttribute("data-disabled");
            }
            else
            {
                item.setAttribute("data-disabled", "disabled");
            }
        });
        document.getElementById("menu").style.display = (Notifications.supported || full ? "" : "none");
    };

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

    App.embedded = document.body.className.indexOf("embedded") !== -1;
});

App.entry = function (station, stream, callback)
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

        callback(station, stream);

        App.menu(true);
        document.getElementById("lists").style.marginLeft = "-100%";
        window.scrollTo(0, 0);
    });

    return entry;
};

App.error = function (message, status)
{
    var error, list, parent = document.body.firstElementChild;

    error = document.createElement("p");
    error.className = "error";
    error.textContent = status ? status + " - bad service" : message;
    parent.appendChild(error);
    error.style.marginTop = -error.offsetHeight / 2 + "px";
    error.style.marginLeft = -error.offsetWidth / 2 + "px";

    list = document.querySelector("#lists ol");
    if (list)
    {
        list.className = "loaded";
    }
    document.getElementById("player").className = "loaded";

    parent.className = "error";
};
