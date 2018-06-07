"use strict";

function AnnotatedPlayer (parent, url, mime, size, length, tracks, autoplay, embedded)
{
    var container, time, title, canvas, progress, menu, progX, colors, tooltip, tooltime, playpause,
            button, volume, volX, countdown, audio, menuX, buffered, track = 0, unloading, buffering;

    container = document.createElement("div");
    container.className = "annotatedplayer";
    container.appendChild(document.createElement("div"));
    container.appendChild(document.createElement("div"));
    parent.appendChild(container);

    container.firstChild.className = "info";
    container.lastChild.className = "player";

    container.firstChild.appendChild(document.createElement("div"));
    container.firstChild.firstChild.className = "controls";

    time = document.createElement("span");
    time.textContent = "00:00:00";
    time.addEventListener("click", function ()
    {
        countdown = !countdown;

        if (localStorage)
        {
            localStorage.countdown = Number(countdown);
        }
    });
    container.firstChild.appendChild(time);

    title = document.createElement("div");
    title.textContent = tracks[track].trackName;
    container.firstChild.appendChild(title);

    canvas = document.createElement("canvas");
    container.lastChild.appendChild(canvas);

    // Could be a progress tag, but support came late in IE and other browsers.
    progress = document.createElement("span");
    progress.className = "progress";
    progress.appendChild(document.createElement("span"));
    progress.firstChild.innerHTML = "Progress: 0%";
    container.lastChild.appendChild(progress);

    if (!embedded && Copy.contextMenuSupported)
    {
        progress.setAttribute("contextmenu", "annotatedplayer-menu");

        container.lastChild.insertBefore(Copy.createMenu("annotatedplayer-menu", [
                {
                    label: "Copy this track's location to clipboard",
                    call: function ()
                    {
                            document.dispatchEvent(Events.create("copytimeurl", getTrack(menuX / progress.clientWidth * length).time));
                    }
                }, {
                    label: "Copy this stream location to clipboard",
                    call: function ()
                    {
                        document.dispatchEvent(Events.create("copytimeurl", menuX / progress.clientWidth * length));
                    }
                } ]), canvas);
    }

    if (localStorage)
    {
        countdown = Number(localStorage.countdown);
    }

    audio = new Audio();

    if (!audio.canPlayType(mime))
    {
        title.textContent = "Unable to play. This browser does not support the stream's media type.";
        canvas.className = "bad";
    }
    else
    {
        audio.src = url;

        button = document.createElement("span");
        button.className = "previous";
        button.addEventListener("click", function ()
        {
            if (track > 0)
            {
                if (audio.currentTime - tracks[track].time > 3)
                {
                    seek(tracks[track].time);
                }
                else
                {
                    seek(tracks[track - 1].time);
                }
            }
        });
        container.firstChild.firstChild.appendChild(button);

        playpause = document.createElement("span");
        playpause.className = "pause";
        playpause.addEventListener("click", function ()
        {
            if (this.className === "play")
            {
                audio.play();
            }
            else
            {
                audio.pause();
            }
        });
        container.firstChild.firstChild.appendChild(playpause);

        button = document.createElement("span");
        button.className = "next";
        button.addEventListener("click", function ()
        {
            if (track < tracks.length - 1)
            {
                seek(tracks[track + 1].time);
            }
        });
        container.firstChild.firstChild.appendChild(button);

        button = document.createElement("span");
        button.className = "sound";
        container.firstChild.firstChild.appendChild(button);

        // Could be a meter tag, except IE doesn't support those. At all.
        // Edit from May 2016: Apparently Edge now does, though.
        volume = document.createElement("span");
        volume.className = "volume";
        volume.addEventListener("mousedown", function (event)
        {
            var update, end, target = document;

            // Prevent text selection due to dragging.
            event.preventDefault();

            // I love this! Every browser should have this. You can leave the window with
            // the mouse and it'll still fire events as if it came from this element. This
            // means it's possible to detect mouseup outside the window. So handy.
            if (volume.setCapture)
            {
                volume.setCapture();
                target = volume;
            }

            update = function (event)
            {
                audio.volume = Math.min(Math.max(0, (event.pageX - volX) / volume.clientWidth), 1);
            };
            update.call(this, event);

            end = function (event)
            {
                update.call(this, event);
                target.removeEventListener("mousemove", update);
                target.removeEventListener("mouseup", end);
            };

            target.addEventListener("mousemove", update);
            target.addEventListener("mouseup", end);
        });
        volume.appendChild(document.createElement("span"));
        volume.firstChild.innerHTML = "Volume: 100%";
        volume.firstChild.style.width = "100%";
        container.firstChild.firstChild.appendChild(volume);

        tooltip = document.createElement("span");
        tooltip.className = "tooltip";
        container.lastChild.appendChild(tooltip);

        progress.addEventListener("mousedown", function (event)
        {
            event.preventDefault();
        });

        progress.addEventListener("mousemove", function (event)
        {
            var x = (event.pageX - progX), track = getTrack(event);

            if (track)
            {
                tooltip.className = "tooltip";
                tooltip.textContent = track.artistName + " - " + track.trackName;
                tooltip.style.display = "block";
                tooltip.style.left = x + "px";
                tooltip.style.marginLeft = -tooltip.clientWidth / 2 + "px";

                if (tooltip.offsetLeft + tooltip.clientWidth > progress.clientWidth)
                {
                    tooltip.style.marginLeft = -tooltip.clientWidth + "px";
                    tooltip.className = "tooltip right";
                }
                else if (tooltip.offsetLeft < 0)
                {
                    tooltip.style.marginLeft = 0;
                    tooltip.className = "tooltip left";
                }

                // Call in Tim Allen?
                clearTimeout(tooltime);
                tooltime = setTimeout(function ()
                {
                    tooltip.style.display = "";
                }, 4000);
            }
        });

        progress.addEventListener("mouseleave", function ()
        {
            clearTimeout(tooltime);
            tooltime = setTimeout(function ()
            {
                tooltip.style.display = "";
            }, 250);
        });

        progress.addEventListener("mouseup", function (event)
        {
            if (!event.ctrlKey && event.which !== 3)
            {
                seek(Math.min(Math.max(0, (event.pageX - progX) / progress.clientWidth * length), length));
            }
            else
            {
                menuX = event.pageX - progX;
            }
        });

        audio.addEventListener("timeupdate", function ()
        {
            var t = this.currentTime;

            // getTrack is potentially expensive. So, this.
            if (tracks[track + 1] && t >= tracks[track + 1].time)
            {
                track++;
                notifyTrackListeners();
            }

            if (countdown)
            {
                time.textContent = "-" +  Time.duration(length - t);
            }
            else
            {
                time.textContent = Time.duration(t);
            }

            if (buffering && audio.currentTime !== buffering)
            {
                container.lastChild.className = "player";
                seek(buffering);
            }
            buffering = null;

            progress.firstChild.innerHTML = "Progress: " + Math.round(t / length * 100) + "%";
            progress.firstChild.style.width = t / length * progress.clientWidth + "px";
        });

        audio.addEventListener("error", function (error)
        {
            if (!unloading)
            {
                switch (error.target.error.code)
                {
                    case MediaError.MEDIA_ERR_NETWORK:
                        title.textContent = "Unable to play. There was a network error.";
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        title.textContent = "Unable to play. There was an error trying to decode the stream.";
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        title.textContent = "Unable to play. This browser does not support the stream's media type.";
                        break;
                    default:
                        title.textContent = "WTF! Unknown error.";
                }
                canvas.className = "bad";
            }
        });

        audio.addEventListener("pause", function ()
        {
            playpause.className = "play";
        });

        audio.addEventListener("play", function ()
        {
            playpause.className = "pause";
        });

        audio.addEventListener("volumechange", function ()
        {
            volume.firstChild.innerHTML = "Volume: " + Math.floor(audio.volume * 100) + "%";
            volume.firstChild.style.width = audio.volume * volume.clientWidth + "px";

            if (localStorage)
            {
                localStorage.volume = audio.volume;
            }
        });

        audio.addEventListener("progress", function ()
        {
            // The buffered tracks don't overlap and will combine when they meet,
            // so if everything is buffered there's only one track from 0 to end.
            if (audio.buffered.length === 1 && audio.buffered.start(0) === 0)
            {
                // Show lengths tend to be longer than the actual length by a bit.
                buffered = Math.ceil(audio.buffered.end(0)) >= length - 1;
            }
            redraw(true);
        });

        audio.volume = localStorage && Number(localStorage.volume) || 1;

        if (typeof autoplay === "undefined" || autoplay)
        {
            audio.play();
        }
        else
        {
            playpause.className = "play";
        }
    }

    function getTrack (time)
    {
        var i;

        if (time.pageX)
        {
            time = (time.pageX - progX) / progress.clientWidth * length;
        }

        // Shows don't ever seem to have enough tracks to need to making
        // a search use more intelligent methods, or at least a skiplist.
        for (i = tracks.length - 1; i >= 0; i--)
        {
            if (tracks[i].time <= time)
            {
                return tracks[i];
            }
        }
        return null;
    }

    Object.defineProperty(this, "track", {
        enumerable: true,
        get: function ()
        {
            return getTrack(audio.currentTime);
        }
    });

    function notifyTrackListeners()
    {
        var event;
        title.textContent = tracks[track].artistName + " - " + tracks[track].trackName;

        audio.dispatchEvent(Events.create("trackupdate", track));
    }

    this.addEventListener = function (event, callback)
    {
        audio.addEventListener(event, callback);
    };

    this.removeEventListener = function (event, callback)
    {
        audio.removeEventListener(event, callback);
    };

    this.getCurrentTime = function ()
    {
        return audio.currentTime;
    };

    this.play = function ()
    {
        audio.play();
    };

    this.pause = function ()
    {
        audio.pause();
    };

    Object.defineProperty(this, "paused", {
        enumerable: true,
        get: function ()
        {
            return audio.paused;
        }
    });

    var buffering;
    function seek (to)
    {
        var bytes;

        audio.currentTime = to;
        buffering = to;

        // getTrack doesn't give the index of the match.
        tracks.every(function (seg, i)
        {
            if (seg.time <= to && (i === tracks.length - 1 || to < tracks[i + 1].time))
            {
                if (i !== track)
                {
                    track = i;
                    notifyTrackListeners();
                }
                return false;
            }
            return true;
        });
    }
    this.seek = seek;

    function offset (time, width)
    {
        return Math.round(time / length * width);
    }

    // Narration could have a different color from talk, but the effect
    // is similar for both: "blah blah blah, play more music!"
    colors = {
        Default: "#a7a7a7",
        Music: "#a7a7a7",
        Talk: "#8659b3",
        Jingle: "#8a9add",
        Narration: "#8659b3"
    };

    function calculateOffsetLeft (element, ignore2)
    {
        var x = 0;

        do
        {
            // Skip the elements that cause the wonky offsets we don't want.
            if ("offsetLeft" in element && element !== parent.parentNode && element !== ignore2)
            {
                x += element.offsetLeft;
            }
        } while ((element = element.parentNode) && element.parentNode !== null);

        return x;
    }

    function redraw (buffering)
    {
        var context, width, height, i;

        if (!canvas.className)
        {
            context = canvas.getContext("2d");

            canvas.width = canvas.parentNode.clientWidth;
            canvas.height = canvas.parentNode.clientHeight;
            width = canvas.width;
            height = canvas.height;

            tracks.forEach(function (track, i)
            {
                var start, end, j;

                // This could all be simplified and replicate the reLive desktop behavior by
                // removing the type check here, the second if below, and ensuring the first
                // 1s-long chunk at the start isn't rendered.
                if (!(i % 2) && (track.trackType === "Music" || track.trackType === "Default"))
                {
                    start = offset(track.time, width);
                    end = Math.max(1, (i === tracks.length - 1 ? width : offset(tracks[i + 1].time, width)) - start);

                    context.fillStyle = colors[track.trackType];
                    context.fillRect(start, 0, end, height);
                }

                // The assumption here is that two of the same type are not next to each other.
                if (track.trackType !== "Music")
                {
                    start = offset(track.time, width);
                    end = Math.max(1, (i === tracks.length - 1 ? width : offset(tracks[i + 1].time, width)) - start);

                    context.save();
                    context.strokeStyle = colors[track.trackType];
                    context.rect(start, 0, end, height);
                    context.clip();
                    context.beginPath();

                    for (j = -9; j < end + 3; j+= 3)
                    {
                        context.moveTo(start + j, height);
                        context.lineTo(start + j + 9, 0);
                    }
                    context.closePath();
                    context.stroke();
                    context.restore();
                }
            });

            if (!buffered && audio && audio.buffered && audio.buffered.length)
            {
                context.save();
                context.strokeStyle = "rgba(0, 0, 0, .25)";
                context.beginPath();

                // Strange object, this audio.buffered ...
                for (i = 0; i < audio.buffered.length; i++)
                {
                    context.moveTo(offset(audio.buffered.start(i), width), height);
                    context.lineTo(offset(audio.buffered.end(i), width), height);
                }

                context.moveTo(audio.buffered.start(0), height);
                context.closePath();
                context.stroke();
                context.restore();
            }
        }

        if (!buffering)
        {
            // progress.getBoundingClientRect().x would be easier but as this view is off screen when this is first
            // calculated it gets values that don't match what it would be when it is in view. They also seem to be
            // off by some small incalculable value? This works in all cases.
            progX = calculateOffsetLeft(progress);

            if (volume)
            {
                volX = calculateOffsetLeft(volume, volume.parentNode);
            }
        }
    };
    this.redraw = redraw;

    this.unload = function ()
    {
        unloading = true;
    };

    redraw();
}
