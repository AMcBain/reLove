"use strict";

// NOTEs: turn player background a nice shade of red or something if
// the browser says it can't play the given mime or it fails even if
// returns "maybe" for canPlayType.
function AnnotatedPlayer (parent, url, mime, length, segments)
{
    var container, time, title, canvas, progress, rectX, colors, tooltip, tooltime,
            countdown, audio, segment = 0;

    container = document.createElement("div");
    container.className = "annotatedplayer";
    container.appendChild(document.createElement("div"));
    container.appendChild(document.createElement("div"));
    parent.appendChild(container);

    container.firstChild.className = "info";
    container.lastChild.className = "player";

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

    // TODO IE9 support? The rest of the app should be IE9 ready.
    progress = document.createElement("progress");
    progress.value = 0;
    progress.max = length;
    container.lastChild.appendChild(progress);

    if (localStorage)
    {
        countdown = Number(localStorage.countdown);
    }

    audio = new Audio();
    audio.volume = localStorage && localStorage.volume || 1;

    if (!audio.canPlayType(mime))
    {
        canvas.className = "bad";
    }
    else
    {
        audio.src = url;

        tooltip = document.createElement("span");
        tooltip.className = "tooltip";
        container.lastChild.appendChild(tooltip);

        progress.addEventListener("mousemove", function (event)
        {
            var x = (event.pageX - rectX), segment = getSegment(event);

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
            seek(Math.min(Math.max(0, (event.pageX - rectX) / progress.clientWidth * length), length));
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
            progress.value = t;
        });

        audio.addEventListener("error", function (error)
        {
            switch (error.target.error.code)
            {
                case MediaError.MEDIA_ERR_NETWORK:
                    console.log("Network Error");
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    console.log("Audio Decoding Error");
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    console.log("Audio Format Error");
                    break;
                default:
                    console.log("WTF");
           }
           canvas.className = "bad";
        });

        audio.play();
    }

    function getSegment (time)
    {
        var i;

        if (time.pageX)
        {
            time = (time.pageX - rectX) / progress.clientWidth * length;
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

    function notifySegmentListeners()
    {
        title.textContent = segments[segment].title;

        audio.dispatchEvent(new CustomEvent("segmentupdate", {
            detail: segment
        }));
    }

    this.addEventListener = function (event, callback)
    {
        audio.addEventListener(event, callback);
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

    this.redraw = function ()
    {
        var context, width, height, element;

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

        rectX = 0;
        element = progress;

        // progress.getBoundingClientRect().x would be easier but as this view is off screen when this is first
        // calculated it gets values that don't match what it would be when it is in view. They also seem to be
        // off by some small incalculable value? This works in all cases.
        do
        {
            // Skip the parent view element.
            if ("offsetLeft" in element && element !== parent.parentNode)
            {
                rectX += element.offsetLeft;
            }
        } while ((element = element.parentNode) && element.parentNode !== null);
    };

    this.redraw();
}
