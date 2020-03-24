"use strict";

var Messages = {
    LOADED: "relive:loaded",
    INITIALIZED: "relive:initialized",
    // Some of these events may not succeed if called before the initialized message is received.
    PLAY: "relive:play",
    PAUSE: "relive:pause",
    PAUSED: "relive:paused",
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
                parsed.message = message[0];
                return parsed;
            }

            return {
                message: message[0]
            };
        }
        return null;
    }
};
