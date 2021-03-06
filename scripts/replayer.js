"use strict";

window.addEventListener("load", function ()
{
    var player, channelmanager, parent, title, notify, station, stream, tracks, chat, cues, resize, config, events = {};

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

                if (channelmanager)
                {
                    channelmanager.resize();
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

    config = {
        titleFormat: "${station.name}: ${stream.streamName}"
    };

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
        var url, mime, once, lastTime, event, handler;

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
        for (event in events)
        {
            for (handler = 0; handler < events[event].length; handler++)
            {
                player.addEventListener(event, events[event][handler]);
            }
        }
        channelmanager = null;

        if (chat)
        {
            var channels = []
            for (var t in chat.timelines) channels.push( chat.timelines[t].title );
            channelmanager = new ChannelManager( parent.lastChild, channels, stream.timestamp );

            player.addEventListener("timeupdate", function ()
            {
                var i, time = Math.floor(this.currentTime);

                for (var t in chat.timelines)
                {
                    var timeline = chat.timelines[t];
                    var chatview = channelmanager.getChat(t);
                    var last = channelmanager.getLast(t);
                    
                    // Handle seeking backwards.
                    if (lastTime > time)
                    {
                        if (last === timeline.messages.length)
                        {
                            last--;
                        }
                        while (last > 0 && timeline.messages[last].time > time)
                        {
                            last--;
                            chatview.removeLine(last);
                        }
                    }
                    else
                    {
                        var lines = "";
                        while (last < timeline.messages.length && timeline.messages[last].time <= time)
                        {
                            lines += chatview.renderLine(timeline.messages[last]);
                            last++;
                        }
                        chatview.appendLines(lines);
                    }
                    channelmanager.setLast( t, last );
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
        autoplay: false
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

    function updateTitle () {
        title.textContent = config.titleFormat.replace(/\$\{station\.([^}]+)\}/g, function (_, match) {
                return station && station[match] || '';
            }).replace(/\$\{stream\.([^}]+)\}/g, function (_, match) {
                return stream && stream[match] || '';
            });
        document.title = title.textContent;
    }

    Replayer.configure = function (_config) {
        config = _config;
        updateTitle();
        // Just let them pass a stylesheet? :(
        var style = document.body.style;
        if (config.background)       style.setProperty("--background",        config.background);
        if (config.loadingColor)     style.setProperty("--loading-color",     config.loadingColor);
        if (config.headerColor)      style.setProperty("--header-color",      config.headerColor);
        if (config.headerBackground) style.setProperty("--header-background", config.headerBackground);
        if (config.playerColor)      style.setProperty("--player-color",      config.playerColor);
        if (config.playerBackground) style.setProperty("--player-background", config.playerBackground);
        if (config.chatColor)        style.setProperty("--chat-color",        config.chatColor);
        if (config.chatBackground)   style.setProperty("--chat-background",   config.chatBackground);
    };

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
                        _ready(station, stream, tracks);
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
                ready(tracks);
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
            updateTitle();

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
            return player.play();
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

    Replayer.seek = function (to)
    {
        if (player)
        {
            player.seek(to);
        }
    };

    Replayer.addEventListener = function (event, handler)
    {
        if (!events[event])
        {
            events[event] = [];
        }
        events[event].push(handler);

        if (player)
        {
            player.addEventListener(event, handler);
        }
    };

    Replayer.removeEventListener = function (event, handler)
    {
        var index;

        if (events[event])
        {
            index = events[event].indexOf(handler);
            if (index !== -1)
            {
                events[event].splice(index, 1);
            }
        }
        player.removeEventListener(event, handler);
    };

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
