"use strict";

function AnnotatedPlayer (parent, url, mime, length, segments)
{
    var container, time, title, canvas, progress, menu, progX, colors, tooltip, tooltime,
            playpause, button, volume, volX, countdown, audio, menuX, segment = 0;

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
    title.textContent = segments[segment].title;
    container.firstChild.appendChild(title);

    canvas = document.createElement("canvas");
    container.lastChild.appendChild(canvas);

    // Could be a progress tag, but support came late in IE and other browsers.
    progress = document.createElement("span");
    progress.className = "progress";
    progress.appendChild(document.createElement("span"));
    progress.firstChild.innerHTML = "Progress: 0%";
    container.lastChild.appendChild(progress);

    if (Copy.contextMenuSupported)
    {
        progress.setAttribute("contextmenu", "annotatedplayer-menu");

        container.lastChild.insertBefore(Copy.createMenu("annotatedplayer-menu",
                "Copy this stream location to clipboard", function ()
        {
            document.dispatchEvent(Events.create("copytimeurl", menuX / progress.clientWidth * length));
        }), canvas);
    }

    if (localStorage)
    {
        countdown = Number(localStorage.countdown);
    }

    audio = new Audio();
    audio.volume = localStorage && Number(localStorage.volume) || 1;

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
            if (segment > 0)
            {
                if (audio.currentTime - segments[segment].start > 3)
                {
                    seek(segments[segment].start);
                }
                else
                {
                    seek(segments[segment - 1].start);
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
            if (segment < segments.length - 1)
            {
                seek(segments[segment + 1].start);
            }
        });
        container.firstChild.firstChild.appendChild(button);

        button = document.createElement("span");
        button.className = "sound";
        container.firstChild.firstChild.appendChild(button);

        // Could be a meter tag, except IE doesn't support those. At all.
        volume = document.createElement("span");
        volume.className = "volume";
        volume.appendChild(document.createElement("span"));
        volume.addEventListener("mouseup", function (event)
        {
            audio.volume = Math.min(Math.max(0, (event.pageX - volX) / this.clientWidth), 1);
        });
        volume.firstChild.innerHTML = "Volume: 100%";
        volume.firstChild.style.width = "100%";
        container.firstChild.firstChild.appendChild(volume);

        tooltip = document.createElement("span");
        tooltip.className = "tooltip";
        container.lastChild.appendChild(tooltip);

        progress.addEventListener("mousemove", function (event)
        {
            var x = (event.pageX - progX), segment = getSegment(event);

            if (segment)
            {
                tooltip.className = "tooltip";
                tooltip.textContent = segment.artist + " - " + segment.title;
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

            // getSegment is potentially expensive. So, this.
            if (segments[segment + 1] && t >= segments[segment + 1].start)
            {
                segment++;
                notifySegmentListeners();
            }

            if (countdown)
            {
                time.textContent = "-" +  Time.duration(length - t);
            }
            else
            {
                time.textContent = Time.duration(t);
            }

            progress.firstChild.innerHTML = "Progress: " + Math.round(t / length * 100) + "%";
            progress.firstChild.style.width = t / length * progress.clientWidth + "px";
        });

        audio.addEventListener("error", function (error)
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

        audio.play();
    }

    function getSegment (time)
    {
        var i;

        if (time.pageX)
        {
            time = (time.pageX - progX) / progress.clientWidth * length;
        }

        // Shows don't ever seem to have enough segments to need to making
        // a search use more intelligent methods, or at least a skiplist.
        for (i = segments.length - 1; i >= 0; i--)
        {
            if (segments[i].start <= time)
            {
                return segments[i];
            }
        }
        return null;
    }

    this.getSegment = function ()
    {
        return getSegment(audio.currentTime);
    };

    function notifySegmentListeners()
    {
        var event;
        title.textContent = segments[segment].artist + " - " + segments[segment].title;

        audio.dispatchEvent(Events.create("segmentupdate", segment));
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

    function seek (to)
    {
        audio.currentTime = to;

        // getSegment doesn't give the index of the match.
        segments.every(function (seg, i)
        {
            if (seg.start <= to && (i === segments.length - 1 || to < segments[i + 1].start))
            {
                if (i !== segment)
                {
                    segment = i;
                    notifySegmentListeners();
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
    colors = {};
    colors[Relive.TRACKTYPE_DEFAULT] = "a7a7a7";
    colors[Relive.TRACKTYPE_MUSIC] = "#a7a7a7";
    colors[Relive.TRACKTYPE_TALK] = "#8659b3";
    colors[Relive.TRACKTYPE_JINGLE] = "#8a9add";
    colors[Relive.TRACKTYPE_NARRATION] = "#8659b3";

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

    this.redraw = function ()
    {
        var context, width, height;

        if (!canvas.className)
        {
            context = canvas.getContext("2d");

            canvas.width = canvas.parentNode.clientWidth;
            canvas.height = canvas.parentNode.clientHeight;
            width = canvas.width;
            height = canvas.height;

            segments.forEach(function (segment, i)
            {
                var start, end, j;

                // This could all be simplified and replicate the reLive desktop behavior by
                // removing the type check here, the second if below, and ensuring the first
                // 1s-long chunk at the start isn't rendered.
                if (!(i % 2) && (segment.type === Relive.TRACKTYPE_MUSIC || segment.type === Relive.TRACKTYPE_DEFAULT))
                {
                    start = offset(segment.start, width);
                    end = Math.max(1, (i === segments.length - 1 ? width : offset(segments[i + 1].start, width)) - start);

                    context.fillStyle = colors[segment.type];
                    context.fillRect(start, 0, end, height);
                }

                // The assumption here is that two of the same type are not next to each other.
                if (segment.type !== Relive.TRACKTYPE_MUSIC)
                {
                    start = offset(segment.start, width);
                    end = Math.max(1, (i === segments.length - 1 ? width : offset(segments[i + 1].start, width)) - start);

                    context.save();
                    context.strokeStyle = colors[segment.type];
                    context.rect(start, 0, end, height);
                    context.clip();
                    context.beginPath();

                    for (j = -9; j < end; j+= 3)
                    {
                        context.moveTo(start + j, height);
                        context.lineTo(start + j + 9, 0);
                    }
                    context.closePath();
                    context.stroke();
                    context.restore();
                }
            });
        }

        // progress.getBoundingClientRect().x would be easier but as this view is off screen when this is first
        // calculated it gets values that don't match what it would be when it is in view. They also seem to be
        // off by some small incalculable value? This works in all cases.
        progX = calculateOffsetLeft(progress);
        volX = calculateOffsetLeft(volume, volume.parentNode);
    };

    this.redraw();
}
