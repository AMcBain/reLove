"use strict";

var Messages = {
    ERROR: "relive:error",
    LOADED: "relive:loaded",
    INITIALIZED: "relive:initialized",
    INFO: "relive:info",
    TRACK: "relive:track",
    // Some of these events may not succeed if called before the initialized message is received.
    PLAY: "relive:play",
    PAUSE: "relive:pause",
    SEEK: "relive:seek",
    // May not succeed if called before the loaded message is received.
    CONFIGURE: "relove:config",
    create: function (message, value, error)
    {
        return message + "|" + JSON.stringify({
            value: error ? undefined : value,
            error: error ? value : undefined
        });
    },
    parse: function (message)
    {
        var parsed;

        if (message)
        {
            message = message.split("|");

            if (message.length > 1)
            {
                parsed = JSON.parse(message[1]);
                return {
                    message: message[0],
                    value: parsed
                };
            }

            return {
                message: message[0]
            };
        }
        return null;
    }
};
