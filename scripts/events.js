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
