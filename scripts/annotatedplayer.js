"use strict";

// NOTEs: turn player background a nice shade of red or something if
// the browser says it can't play the given mime or it fails even if
// returns "maybe" for canPlayType.
function AnnotatedPlayer (url, mime, info)
{
    var player = new Audio();

    this.addEventListener = function (event, callback)
    {
        player.addEventListener(event, callback);
    };

    this.play = function ()
    {
        player.play();
    };

    this.pause = function ()
    {
        player.pause();
    };
}
