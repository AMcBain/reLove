"use strict";

var Events = {};

try
{
    new CustomEvent("test");

    Events.create = function (type, detail)
    {
        return new CustomEvent(type, {
            detail: detail
        });
    };
}
catch (e)
{
    // Every browser but IE allows use of the CustomEvent constructor and deprecated
    // the other ways of creating custom events. So if creation fails, fall back.
    Events.create = function (type, detail)
    {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, false, false, detail);
        return event;
    };
}

Events.keydown = function (element)
{
    var i, triggered = {}, keys = {}, listener = arguments[arguments.length - 1];

    for (i = 1; i < arguments.length - 1; i++)
    {
        keys[arguments[i]] = true;
    }

    element.addEventListener("keydown", function (event)
    {
        if (keys[event.keyCode] && !triggered[event.keyCode])
        {
            event.preventDefault();
            triggered[event.keyCode] = true;
            listener.call(element, event);
        }
    });

    element.addEventListener("keyup", function (event)
    {
        if (keys[event.keyCode])
        {
            delete triggered[event.keyCode];
        }
    });
};
