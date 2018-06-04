"use strict";

window.addEventListener("load", function ()
{
    var player, chatview, parent, title, notify, station, stream, tracks, chat, cues, resize;

    parent = document.getElementById("player");
    title = parent.querySelector("h1");
    notify = document.getElementById("notify-track-changes");

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

                if (chatview)
                {
                    chatview.resize();
                }
            }, 250);
        }
    });

    window.addEventListener("beforeunload", function ()
    {
        if (player)
        {
            player.unload();
        }
    });

    Events.keydown(window, 119, function ()
    {
        parent.querySelector(".tracks h2").click();
    });

    function buildCueList ()
    {
        var container, toggle, track, list = document.createElement("ol");

        tracks.forEach(function (cue, i)
        {
            var time, entry;

            time = document.createElement("time");
            time.setAttribute("datetime", new Date((stream.timestamp + cue.time) * 1000).toISOString());
            time.textContent = Time.duration(cue.time);

            entry = document.createElement("li");
            entry.setAttribute("data-index", i);
            entry.textContent = " " + cue.artistName + " - " + cue.trackName;
            entry.insertBefore(time, entry.firstChild);

            if (i === 0)
            {
                entry.className = "selected";
            }

            entry.addEventListener("click", function ()
            {
                player.seek(cue.time);
            });

            list.appendChild(entry);
        });

        // Would be nice not to need the span, but it makes this much easier.
        toggle = document.createElement("h2");
        toggle.appendChild(document.createElement("span"));
        toggle.lastChild.textContent = "tracks";

        toggle.addEventListener("click", function ()
        {
            if (container.className.indexOf("open") === -1)
            {
                container.className = "tracks open";
            }
            else
            {
                container.className = "tracks";
            }
        });

        container = document.createElement("div");
        container.className = "tracks" + (chat ? "" : " all");
        container.appendChild(toggle);
        container.appendChild(list);

        if (Copy.contextMenuSupported && !App.embedded)
        {
            list.setAttribute("contextmenu", "tracks-menu");
            list.addEventListener("contextmenu", function (event)
            {
                track = tracks[event.target.getAttribute("data-index")];
            });

            container.appendChild(Copy.createMenu("tracks-menu",
                    "Copy track location to clipboard", function ()
            {
                copytimeurl(track.time);
            }));
        }

        parent.lastChild.appendChild(container);
        cues = list;
    }

    function start (at)
    {
        var url, mime, once, lastTime, last = 0;

        url = Relive.getStreamURL(station, stream);
        mime = Relive.getStreamMimeType(station, stream);

        player = new AnnotatedPlayer(parent.lastChild, url, mime, stream.size, stream.duration, tracks, Replayer.autoplay, App.embedded);
        player.addEventListener("trackupdate", function (event)
        {
            cues.querySelector(".selected").className = "";
            cues.children[event.detail].className = "selected";

            if (notify.checked)
            {
                Notifications.post(title.textContent, tracks[event.detail].artistName + " - " + tracks[event.detail].trackName);
            }
        });
        player.addEventListener("pause", function ()
        {
            if (!App.embedded)
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
            }
        });
        chatview = null;

        if (chat)
        {
            chatview = new ChatView(parent.lastChild, chat.name, stream.timestamp);

            player.addEventListener("timeupdate", function ()
            {
                var i, time = Math.floor(this.currentTime);

                // Handle seeking backwards.
                if (lastTime > time)
                {
                    if (last === chat.messages.length)
                    {
                        last--;
                    }
                    while (last > 0 && chat.messages[last].time > time)
                    {
                        last--;
                        chatview.removeLine(last);
                    }
                }
                else
                {
                    while (last < chat.messages.length && chat.messages[last].time <= time)
                    {
                        chatview.addLine(chat.messages[last]);
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
    window.Replayer = {
        autoplay: true
    };

    function archive ()
    {
        if (!App.embedded)
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

    Replayer.loadStream = function (_station, _stream, _start, _ready)
    {
        var ready, requests;

        if (station && _station.id === station.id && stream && _stream.id === stream.id)
        {
            archive();
            document.title = title.textContent;
            Replayer.play();
        }
        else
        {
            requests = 1 + _stream.chatAvailable;

            station = _station;
            stream = _stream;

            // Clear out old data to prevent spawning a player twice.
            tracks = null;
            chat = null;

            ready = function ()
            {
                if (requests === 1 && (tracks || chat) || (tracks && chat))
                {
                    start(_start);
                    parent.className = "loaded";

                    if (_ready)
                    {
                        _ready();
                    }
                }
            };

            Relive.loadStreamInfo(station, stream, function (_tracks)
            {
                tracks = _tracks;
                ready();
            }, function ()
            {
                // Use the values from the stream, and trick the annotated player to drawing
                // a light colored bar across instead of a darker one by having two tracks.
                tracks = [ {
                    title: stream.name,
                    artist: stream.host,
                    start: 0,
                    type: "Jingle"
                }, {
                    title: stream.name,
                    artist: stream.host,
                    start: 1,
                    type: "Music"
                } ];
                ready();
            });

            Relive.loadStreamChat(station, stream, function (_chat)
            {
                chat = _chat;
                ready();
            }, function ()
            {
                requests--;
                ready();
            });

            // Clear out old loaded items.
            if (parent.children.length > 1)
            {
                parent.removeChild(parent.lastElementChild);
            }
            parent.appendChild(document.createElement("div"));

            parent.className = "";
            title.textContent = station.name + ": " + stream.streamName;
            document.title = title.textContent;

            if (isNaN(Number(_start)))
            {
                archive();
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

    Object.defineProperty(Replayer, "paused", {
        enumerable: true,
        get: function ()
        {
            if (player)
            {
                return player.paused;
            }
            return true;
        }
    });

    // Handle events for app menu items relating to the replayer view.
    function genstreamhash ()
    {
        return "stream-" + Relive.toBase62(station.id) + "-" + Relive.toBase62(stream.id)
    }

    document.addEventListener("copystreamurl", function ()
    {
        var url = location.href, h = url.indexOf("#");

        if (h !== -1)
        {
            url = url.substring(0, h);
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

    document.addEventListener("copytrackurl", function ()
    {
        copytimeurl(player.track.time);
    });

    document.addEventListener("copytimeurl", function (event)
    {
        copytimeurl(Math.floor(parseInt(event.detail)));
    });
});
