(function ()
{
    // I can't see reason why there needs to be more than one of these.
    window.Replayer = {};

    Replayer.loadStream = function (station, stream, info, chat)
    {
        document.querySelector("#player h1").textContent = station.name + ": " + stream.name;
    };

    Replayer.pause = function ()
    {
    };
}());
