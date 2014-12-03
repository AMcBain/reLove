"use strict";

(function ()
{
    var map, input, close, wrapper, dialog, overlay;

    map = {
        "text/uri-list": "URL"
    };

    window.Copy = {
        mimeType: "text/uri-list",
        // Copy events don't seem to work except in IE, via its own method.
        //forceFallback: !(window.ClipboardEvent || window.clipboardData),
        forceFallback: !window.clipboardData,
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

    Copy.toClipboard = function (text)
    {
        var callback;

        if (!Copy.forceFallback && window.ClipboardEvent)
        {
            // http://lists.w3.org/Archives/Public/public-webapps/2014AprJun/0513.html
            // presents another method, but calling execCommand for "copy" in Firefox
            // throws an error NS_ERROR_FAILURE at worst and at best the error thrown
            // is "SecurityError: The operation is insecure." Both the following and
            // the aforementioned method fail silently in Chrome.
            event = new ClipboardEvent("copy", {
                dataType: Copy.mimeType,
                data: text
            });
            document.dispatchEvent(event);
        }
        else if (!Copy.forceFallback && window.clipboardData)
        {
            clipboardData.setData(map[Copy.mimeType] || "Text", text);
        }
        else
        {
            input.value = text;
            document.body.appendChild(overlay);

            input.setSelectionRange(0, text.length);
            input.focus();
        }
    };

    Copy.createMenu = function (id, label, callback)
    {
        var item, menu;

        item = document.createElement("menuitem");
        item.label = label + (Copy.forceFallback ? "..." : "");
        item.addEventListener("click", callback);

        menu = document.createElement("menu");
        menu.id = id;
        menu.type = "context";
        menu.appendChild(item);

        // A spec difference. "context" is not a valid type, but if the type is
        // set to "popup" like the spec says then Firefox doesn't show the menu.
        if (menu.type !== "context")
        {
            menu.type = "popup";
        }

        return menu;
    };
}());
