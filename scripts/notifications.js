(function ()
{
    var post, tag = "notifications" + (Math.random() * 42);

    // TODO use real reLive icon.
    window.Notifications = {
        icon: "",
        inactiveOnly: false,
        supported: true
    };

    // Firefox (at least) doesn't return true for hidden if the tab is
    // selected but Firefox is not the application with the focus. The
    // application must be minimized or another tab selected.
    function sendNotifications ()
    {
        if (!Notifications.inactiveOnly)
        {
            return true;
        }
        else if ("hidden" in document)
        {
            return document.hidden;
        }
        else if ("webkitHidden" in document)
        {
            return document.webkitHidden;
        }
        else if ("mozHidden" in document)
        {
          return document.mozHidden;
        }
        else if ("msHidden" in document)
        {
            return document.msHidden;
        }

        // If we can't tell, then don't bother.
        return false;
    }

    if ("Notification" in window)
    {
        post = function (title, text)
        {
            var msg;

            if (sendNotifications())
            {
                msg = new Notification(title, {
                    tag: tag,
                    body: text,
                    icon: Notifications.icon
                });

                // Currently Firefox auto-closes messages after a very short period of time, but
                // this isn't specified as default in the spec and Chrome leaves them open until
                // a user closes them. 10s should be long enough to find and read?
                setTimeout(function ()
                {
                    msg.close();
                }, 10000);
            }
        };

        Notifications.post = function (title, text)
        {
            if (Notification.permission === "granted")
            {
                post(title, text);
            }
            else
            {
                Notification.requestPermission(function (permission)
                {
                    if (permission === "granted")
                    {
                        post(title, text);
                    }
                });
            }
        };
    }
    else if ("mozNotification" in navigator)
    {
        // Don't know how this requests permission from the user. Online
        // documentation doesn't say except in the context of Firefox OS.
        Notifications.post = function (title, text)
        {
            if (sendNotifications())
            {
                navigator.mozNotification.createNotification(title, text, Notifications.icon).show();
            }
        };
    }
    else
    {
        Notifications.post = function (title, text)
        {
            // Noop.
        };
        Notifications.supported = false;
    }
}());
