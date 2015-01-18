window.addEventListener("load", function ()
{
    // Find all players and compute their height based on the default font size.
    var players = document.querySelectorAll("iframe.relive.stream.player");
    Array.prototype.forEach.call(players, function (player)
    {
        var w = player.contentWindow,
                f = parseInt(w.getComputedStyle(w.document.body).fontSize),
                b = player.className.indexOf("banner") !== -1;
        // All the height-determining values summed from the player styles.
        // (Use 4.55 over 5.1255 to remove the "extra" space after the banner.)
        player.style.height = Math.round(f * 3.312 + 24 + b * f * 5.1255) + "px";
    });
});
