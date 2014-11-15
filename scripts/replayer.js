(function ()
{
    // I can't see reason why there needs to be more than one of these.
    window.Replayer = {};

    Replayer.loadStream = function (station, stream, info, chat)
    {
        var player = document.getElementById("player");
        player.querySelector("h1").textContent = station.name + ": " + stream.name;

        Replayer.stationId = station.id;
        Replayer.streamId = stream.id;

        if (player.children.length > 1)
        {
            player.removeChild(player.lastElementChild);
        }

        
    };

    Replayer.play = function ()
    {
        // TODO resume playing on the audio tag.
    };

    Replayer.pause = function ()
    {
        // TODO pause playback. Pausing the audio tag should, by way of other items being
        // triggered by listener, pause everything.
    };
}());
