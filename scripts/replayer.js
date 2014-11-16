"use strict";

window.addEventListener("load", function ()
{
    var player, parent, title, station, stream, info, chat;

    parent = document.getElementById("player");
    title = parent.querySelectorAll("h1");

    function buildCueList ()
    {
        var container, toggle, list = document.createElement("ol");

        info.forEach(function (cue)
        {
            var time, entry;

            time = document.createElement("time");
            time.setAttribute("datetime", new Date((stream.timestamp + cue.start) * 1000).toISOString());
            time.textContent = Time.duration(cue.start);

            entry = document.createElement("li");
            entry.textContent = " " + cue.artist + " - " + cue.title;
            entry.insertBefore(time, entry.firstChild);

            entry.addEventListener("click", function ()
            {
                // TODO skip to this location. Or rather, tell player to skip there.
            });

            list.appendChild(entry);
        });

        // Would be nice not to need the span, but it makes this much easier.
        toggle = document.createElement("h2");
        toggle.appendChild(document.createElement("span"));
        toggle.lastChild.textContent = "segments";

        toggle.addEventListener("click", function ()
        {
            if (container.className.indexOf("open") === -1)
            {
                container.className = "segments open";
            }
            else
            {
                container.className = "segments";
            }
        });

        container = document.createElement("div");
        container.className = "segments";
        container.appendChild(toggle);
        container.appendChild(list);

        parent.lastChild.appendChild(container);
    }

    function start ()
    {
        var chatview;

        buildCueList();

        // Try to find messages that indicate a change in channel (not user) modes.
        var _chat = JSON.stringify(chat);
        if (/"type":8,"stringCount":\d,"strings":\["[^"]+","[+-][^vob]/.test(_chat))
        {
            console.log(_chat);
        }

        if (chat)
        {
            chatview = new ChatView(parent.lastChild, chat[0].name, stream.timestamp);
            // TODO set up listeners on the player to add stuff as it was said.
        }
        for (var i = 0; i < chat[0].rows.length; i++)
        {
            chatview.addLine(chat[0].rows[i]);
        }

        player = new AnnotatedPlayer(/* TODO correct args */);
    };

    // I can't see reason why there needs to be more than one of these.
    window.Replayer = {};

    Replayer.loadStream = function (_station, _stream)
    {
        var ready, requests;

        if (station && _station.id === station.id && stream && _stream.id === stream.id)
        {
            Replayer.play();
        }
        else
        {
            requests = 1 + _stream.chatAvailable;

            station = _station;
            stream = _stream;

            ready = function ()
            {
                if (requests === 1 && (info || chat) || info && chat)
                {
                    start();
                    parent.className = "loaded";
                }
            };

            Relive.loadStreamInfo(station.id, stream.id, function (_info)
            {
                info = _info;
                ready();
            });

            Relive.loadStreamChat(station.id, stream.id, function (_chat)
            {
                chat = _chat;
                ready();
            });

            // Clear out old loaded items.
            if (parent.children.length > 1)
            {
                parent.removeChild(player.lastElementChild);
            }
            parent.appendChild(document.createElement("div"));

            parent.className = "";
            title.textContent = station.name + ": " + stream.name;
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
});
