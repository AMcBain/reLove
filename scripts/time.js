"use strict";

var Time = {};

Time.duration = function (time, discrete)
{
    var hours, minutes, seconds;

    hours = Math.floor(time / 3600);
    minutes = Math.floor((time - hours * 3600) / 60);
    seconds = Math.floor((time - hours * 3600 - minutes * 60));

    if (discrete)
    {
        time = (hours ? hours + "h " : "") + (minutes ? minutes + "m " : "") + (seconds ? seconds + "s" : "");
    }
    else
    {
        if (minutes < 10)
        {
            minutes = "0" + minutes;
        }
        if (seconds < 10)
        {
            seconds = "0" + seconds;
        }

        time = hours + ":" + minutes + ":" + seconds;
    }

    return time;
};

// Something like moment.js would take care of this, but not the previous.
Time.instant = function (date)
{
    var hours, minutes;

    hours = date.getHours();
    minutes = date.getMinutes();

    if (hours < 10)
    {
        hours = "0" + hours;
    }
    if (minutes < 10)
    {
        minutes = "0" + minutes;
    }

    return hours + ":" + minutes;
};
