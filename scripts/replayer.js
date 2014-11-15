(function ()
{
    var player;

    // I can't see reason why there needs to be more than one of these.
    window.Replayer = {};

    Replayer.loadStream = function (station, stream, info, chat)
    {
        var parent = document.getElementById("player");
        parent.querySelector("h1").textContent = station.name + ": " + stream.name;

        Replayer.stationId = station.id;
        Replayer.streamId = stream.id;

        Replayer.clear();
        parent.appendChild(document.createElement("div"));

        // Try to find messages that indicate a change in channel (not user) modes.
        var _chat = JSON.stringify(chat);
        if (/"type":8,"stringCount":\d,"strings":\["[^"]+","[+-][^vob]/.test(_chat))
        {
            console.log(_chat);
        }

        player = new AnnotatedPlayer(/* TODO correct args */);

        if (chat)
        {
            chatview = new ChatView(parent.lastChild, chat[0].name, stream.timestamp);
            // TODO set up listeners on the player to add stuff as it was said.
        }
        for (var i = 0; i < chat[0].rows.length; i++)
        {
            chatview.addLine(chat[0].rows[i]);
        }
    };

    Replayer.clear = function ()
    {
        var player = document.getElementById("player");

        if (player.children.length > 1)
        {
            player.removeChild(player.lastElementChild);
        }
    };

    Replayer.play = function ()
    {
        if (player)
        {
            player.play();
        }
    };

    Replayer.pause = function ()
    {
        if (player)
        {
            player.pause();
        }
    };
}());
