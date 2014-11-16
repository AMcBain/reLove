"use strict";

// NOTEs: turn player background a nice shade of red or something if
// the browser says it can't play the given mime or it fails even if
// returns "maybe" for canPlayType.
function AnnotatedPlayer (parent, url, mime, length, segments)
{
    var container, canvas, progress, colors, audio = new Audio();

    container = document.createElement("div");
    container.className = "annotatedplayer";
    container.appendChild(document.createElement("div"));
    container.appendChild(document.createElement("div"));
    parent.appendChild(container);

    container.firstChild.textContent = "00:00:00";

    canvas = document.createElement("canvas");
    container.lastChild.appendChild(canvas);

    // TODO IE9 support? The rest of the app should be IE9 ready.
    progress = document.createElement("progress");
    progress.value = 0;
    progress.max = length;
    container.lastChild.appendChild(progress);

    if (!audio.canPlayType(mime))
    {
        canvas.className = "bad";
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

    this.seek = function (to)
    {
        audio.currentTime = to;
    };

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
    };

    this.redraw();
}
