"use strict";

var App = {};

window.addEventListener("load", function ()
{
    App.embedded = document.body.className.indexOf("embedded") !== -1;
});

App.entry = function (station, stream, menu, callback)
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

        menu(true);
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
