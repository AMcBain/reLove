"use strict";

window.addEventListener("load", function ()
{
    var player, parent, title, notify, station, stream, segments, chat, cues, resize;

    parent = document.getElementById("player");
    title = parent.querySelector("h1");
    notify = document.getElementById("notify-segment-changes");

    window.addEventListener("resize", function ()
    {
        if (player)
        {
            // Some browsers send events for every step if you resize by dragging.
            // Some send a single event when the resize has finished. Normalizing.
            clearTimeout(resize);
            resize = setTimeout(function ()
            {
                player.redraw();
            }, 250);
        }
    });

    function buildCueList ()
    {
        var container, toggle, segment, list = document.createElement("ol");

        segments.forEach(function (cue, i)
        {
            var time, entry;

            time = document.createElement("time");
            time.setAttribute("datetime", new Date((stream.timestamp + cue.start) * 1000).toISOString());
            time.textContent = Time.duration(cue.start);

            entry = document.createElement("li");
            entry.setAttribute("data-index", i);
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

        if (Copy.contextMenuSupported)
        {
            list.setAttribute("contextmenu", "segments-menu");
            list.addEventListener("contextmenu", function (event)
            {
                segment = segments[event.target.getAttribute("data-index")];
            });

            container.appendChild(Copy.createMenu("segments-menu",
                    "Copy segment location to clipboard", function ()
            {
                copytimeurl(segment.start);
            }));
        }

        parent.lastChild.appendChild(container);
        cues = list;
    }

    function start (at)
    {
        var chatview, url, mime, once, lastTime, last = 0;

        url = Relive.getStreamURL(station.id, stream.id);
        mime = Relive.getStreamMimeType(station.id, stream.id);

        player = new AnnotatedPlayer(parent.lastChild, url, mime, stream.length, segments);
        player.addEventListener("segmentupdate", function (event)
        {
            cues.querySelector(".selected").className = "";
            cues.children[event.detail].className = "selected";

            if (notify.checked)
            {
                Notifications.post(title.textContent, segments[event.detail].artist + " - " + segments[event.detail].title);
            }
        });
        player.addEventListener("pause", function ()
        {
            if (history.replaceState)
            {
                history.replaceState({
                    name: "stream"
                }, "", "#" + gentimehash());
            }
            else
            {
                location.hash = gentimehash();
            }
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
                    if (last === chat[0].rows.length)
                    {
                        last--;
                    }
                    while (last > 0 && chat[0].rows[last].timestamp > time)
                    {
                        last--;
                        chatview.removeLine(last);
                    }
                }
                else
                {
                    while (last < chat[0].rows.length && chat[0].rows[last].timestamp <= time)
                    {
                        chatview.addLine(chat[0].rows[last]);
                        last++;
                    }
                }

                lastTime = time;
            });
        }

        buildCueList();

        if (at)
        {
            once = function ()
            {
                player.removeEventListener("canplay", once);
                player.seek(at);
            };
            player.addEventListener("canplay", once);
        }
    };

    // I can't see reason why there needs to be more than one of these.
    window.Replayer = {};

    Replayer.loadStream = function (_station, _stream, _start)
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
                    start(_start);
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

            if (!_start)
            {
                if (history.pushState)
                {
                    history.pushState({
                        name: "stream"
                    }, "", "#" + genstreamhash());
                }
                else
                {
                    location.hash = genstreamhash();
                }
            }
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

    // Handle events for app menu items relating to the replayer view.
    function genstreamhash ()
    {
        return "stream-" + Relive.toBase62(station.id) + "-" + Relive.toBase62(stream.id)
    }

    document.addEventListener("copystreamurl", function ()
    {
        var url = location.href, q = url.indexOf("?");

        if (q !== -1)
        {
            url = url.substring(0, q);
        }

        Copy.toClipboard(url + "#" + genstreamhash());
    });

    function gentimehash (time)
    {
        if (isNaN(time))
        {
            time = Math.floor(player.getCurrentTime());
        }

        return "track-" + Relive.toBase62(station.id) + "-" + Relive.toBase62(stream.id) + "-" + Relive.toBase62(time);
    }

    function copytimeurl (time)
    {
        var url = location.href, h = url.indexOf("#");

        if (h !== -1)
        {
            url = url.substring(0, h);
        }

        Copy.toClipboard(url + "#" + gentimehash(time));
    }

    document.addEventListener("copysegmenturl", function ()
    {
        copytimeurl(player.getSegment().start);
    });

    document.addEventListener("copytimeurl", function (event)
    {
        copytimeurl(Math.floor(parseInt(event.detail)));
    });
});
