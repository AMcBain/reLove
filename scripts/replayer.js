"use strict";

window.addEventListener("load", function ()
{
    var player, parent, title, station, stream, segments, chat, cues;

    parent = document.getElementById("player");
    title = parent.querySelector("h1");

    function buildCueList ()
    {
        var container, toggle, list = document.createElement("ol");

        segments.forEach(function (cue, i)
        {
            var time, entry;

            time = document.createElement("time");
            time.setAttribute("datetime", new Date((stream.timestamp + cue.start) * 1000).toISOString());
            time.textContent = Time.duration(cue.start);

            entry = document.createElement("li");
            entry.textContent = " " + cue.artist + " - " + cue.title;
            entry.insertBefore(time, entry.firstChild);

            if (i === 0)
            {
                entry.className = "selected";
            }

            entry.addEventListener("click", function ()
            {
                player.seek(cue.start);
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
        cues = list;
    }

    function start ()
    {
        var chatview, url, mime;

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

        url = Relive.getStreamURL(station.id, stream.id);
        mime = Relive.getStreamMimeType(station.id, stream.id);

        player = new AnnotatedPlayer(parent.lastChild, url, mime, stream.length, segments);
        player.addEventListener("segmentupdate", function (event)
        {
            cues.querySelector(".selected").className = "";
            cues.children[event.detail].className = "selected";
        });
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
                if (requests === 1 && (segments || chat) || segments && chat)
                {
                    start();
                    parent.className = "loaded";
                }
            };

            Relive.loadStreamInfo(station.id, stream.id, function (_segments)
            {
                segments = _segments;
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
                parent.removeChild(parent.lastElementChild);
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
