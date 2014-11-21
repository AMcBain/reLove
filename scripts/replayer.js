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
        var chatview, url, mime, lastTime, last = 0;

        url = Relive.getStreamURL(station.id, stream.id);
        mime = Relive.getStreamMimeType(station.id, stream.id);

        player = new AnnotatedPlayer(parent.lastChild, url, mime, stream.length, segments);
        player.addEventListener("segmentupdate", function (event)
        {
            cues.querySelector(".selected").className = "";
            cues.children[event.detail].className = "selected";

            //Notifications.post(title.textContent, segments[event.detail].artist + " - " + segments[event.detail].title);
        });

        if (chat)
        {
            chatview = new ChatView(parent.lastChild, chat[0].name, stream.timestamp);

            player.addEventListener("timeupdate", function ()
            {
                var i, time = Math.floor(this.currentTime);

                // Handle seeking backwards.
                if (lastTime > time)
                {
                    while (last > 0 && chat[0].rows[last].timestamp > time)
                    {
                        last--;
                        chatview.removeLine(last);
                    }
                }
                else
                {
                    while (chat[0].rows[last].timestamp <= time)
                    {
                        chatview.addLine(chat[0].rows[last]);
                        last++;
                    }
                }

                lastTime = time;
            });
        }

        buildCueList();
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

            // Clear out old data to prevent spawning a player twice.
            segments = null;
            chat = null;

            ready = function ()
            {
                if (requests === 1 && (segments || chat) || (segments && chat))
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
            document.title = title.textContent;
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
