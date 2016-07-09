"use strict";

(function ()
{
    var map, input, close, wrapper, dialog, overlay, workaround, fallback;

    map = {
        "text/uri-list": "URL"
    };

    window.Copy = {
        mimeType: "text/uri-list",
        // This will have to change, if Firefox ever becomes spec compliant.
        contextMenuSupported: (document.createElement("menu").type === "list")
    };

    input = document.createElement("input");
    input.type = "text";

    close = document.createElement("span");
    close.className = "close";
    close.innerHTML = "close";

    wrapper = document.createElement("div");
    wrapper.appendChild(close);
    wrapper.appendChild(input);

    dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.appendChild(wrapper);

    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.addEventListener("click", function (event)
    {
        if (event.target.className === "close" || event.target.className === "overlay")
        {
            document.body.removeChild(overlay);
        }
    });
    overlay.appendChild(dialog);

    // Hidden from view but not hidden from rendering, if you were able to scroll backwards past the start of the viewport.
    workaround = document.createElement("input");
    workaround.type = "text";
    workaround.style.cssText = "position: fixed; left: -110px; top: -30px; -box-sizing: border-box; width: 100px; height: 25px;";

    function fallback (text)
    {
        input.value = text;
        document.body.appendChild(overlay);

        input.setSelectionRange(0, text.length);
        input.focus();
    }

    Copy.toClipboard = function (text)
    {
        document.body.appendChild(workaround);
        workaround.value = text;
        workaround.focus();
        workaround.select();

        try
        {
            // Implementations that don't support this, for whatever reason, will return false.
            if (!document.execCommand("copy", false, null))
            {
                fallback(text);
            }
        }
        catch (err)
        {
            // Older Firefoxes will throw an exception instead of returning false.
            fallback(text);
        }

        // It may be possible to remove it immediately, but this is just a precaution.
        setTimeout(function ()
        {
            document.body.removeChild(workaround);
        }, 0);
    };

    Copy.createMenu = function (id, label, callback)
    {
        var menu;

        if (!(label instanceof Array))
        {
            label = [ {
                label: label,
                call: callback
            } ];
        }

        menu = document.createElement("menu");
        menu.id = id;
        menu.type = "context";

        label.forEach(function (item)
        {
            var menuitem = document.createElement("menuitem");
            menuitem.label = item.label;
            menuitem.addEventListener("click", item.call);
            menu.appendChild(menuitem);
        });

        // A spec difference. "context" is not a valid type, but if the type is
        // set to "popup" like the spec says then Firefox doesn't show the menu.
        if (menu.type !== "context")
        {
            menu.type = "popup";
        }

        return menu;
    };
}());
