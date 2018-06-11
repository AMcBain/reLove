"use strict";

function ChatView (parent, channel, offset)
{
    var container, table, tbody, types = {}, init, fix, styles;

    container = document.createElement("div");
    container.className = "chatview";
    parent.appendChild(container);

    // Defeat Firefox, which insists on restoring the last known scroll position.
    setTimeout(function ()
    {
        container.scrollTop = 0;
    }, 1);

    table = document.createElement("table");
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
    container.appendChild(table);

    function timefmt (timestamp)
    {
        var time, date = new Date((timestamp + offset) * 1000);

        time = document.createElement("time");
        time.setAttribute("datetime", date.toISOString());
        time.setAttribute("title", date.toISOString().replace("T", " ").replace(/\..+$/, ""));
        time.textContent = "[" + Time.instant(date) + "]";

        return time;
    }

    function column (value)
    {
        var column = document.createElement("td");
        column.textContent = value;
        return column;
    }

    function row (type, timestamp, user, message)
    {
        var time, row;

        time = document.createElement("td");
        time.appendChild(timefmt(timestamp));

        row = document.createElement("tr");
        row.className = "chattype" + type;
        row.appendChild(time);
        row.appendChild(column(user));
        row.appendChild(column(message));

        return row;
    }

    // Like rowstar, except it singles out the username in the message part to allow styling.
    function rowspc (type, timestamp, user, message)
    {
        var time, nick, row;

        time = document.createElement("td");
        time.appendChild(timefmt(timestamp));

        nick = document.createElement("span");
        nick.textContent = user;

        row = document.createElement("tr");
        row.className = "chattype" + type;
        row.appendChild(time);
        row.appendChild(column("*"));
        row.appendChild(column(" " + message));
        row.lastChild.insertBefore(nick, row.lastChild.firstChild);

        return row;
    }

    function rowstar (line, message)
    {
        return row(line.messageType, line.time, "*", message);
    }

    // Best guess as to what to do with these.
    types.Unknown = function (line)
    {
        if (line.strings.length > 1)
        {
            return row(line.messageType, line.time, line.strings[0], line.strings[1]);
        }
        return rowstar(line, line.strings[0]);
    };

    types.Message = function (line)
    {
        return row(line.messageType, line.time, line.strings[0], line.strings[1]);
    };

    types.Me = function (line)
    {
        return rowspc(line.messageType, line.time, line.strings[0], line.strings[1]);
    };

    types.Join = function (line)
    {
        return rowstar(line, line.strings[0] + " has joined " + channel);
    };

    types.Leave = function (line)
    {
        var msg = line.strings[0] + " has left " + channel;

        if (line.strings.length > 1)
        {
            return rowstar(line, msg + " (" + line.strings[1] + ")");
        }
        return rowstar(line, msg);
    };

    types.Quit = function (line)
    {
        var msg = line.strings[0] + " has quit";

        if (line.strings.length > 1)
        {
            return rowstar(line, msg + " (" + line.strings[1] + ")");
        }
        return rowstar(line, msg);
    };

    types.Nick = function (line)
    {
        return rowstar(line, line.strings[0] + " is now known as " + line.strings[1]);
    };

    types.Topic = function (line)
    {
        return rowstar(line, line.strings[0] + " has set the topic to: " + line.strings[1]);
    };

    // TODO Find an example of channel mode changing and update code to accommodate, if needed.
    types.Mode = function (line)
    {
        if (line.strings.length > 2)
        {
            return rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + line.strings[2]);
        }
        // Hope this is a channel mode change. If it's not the added or removed mode then the
        // message format should probably be: "Channel " + channel + " modes: " + line.strings[1]
        return rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + channel);
    };

    types.Kick = function (line)
    {
        var msg = line.strings[0] + " has kicked " + line.strings[1] + " from " + channel;

        if (line.strings.length > 2)
        {
            return rowstar(line, msg + " (" + line.strings[2] + ")");
        }
        return rowstar(line, msg);
    };

    function autoscroll ()
    {
        return !tbody.children.length || container.scrollHeight - container.clientHeight - container.scrollTop <= 34;
    }

    function scrollToBottom ()
    {
        container.scrollTop = container.scrollHeight - container.clientHeight;
    }

    this.addLine = function (line)
    {
        var scroll = autoscroll();

        tbody.appendChild((types[line.messageType] || types.Unknown)(line));

        clearTimeout(fix);
        fix = setTimeout(this.resize, 1);

        if (scroll)
        {
            scrollToBottom();
        }
    };

    this.renderLine = function (line)
    {
        return (types[line.messageType] || types.Unknown)(line).outerHTML;
    };

    this.appendLines = function (lines)
    {
        var scroll = autoscroll();

        tbody.insertAdjacentHTML("beforeend", lines);

        clearTimeout(fix);
        fix = setTimeout(this.resize, 1);

        if (scroll)
        {
            scrollToBottom();
        }
    };

    this.removeLine = function (index)
    {
        tbody.removeChild(tbody.children[index]);
    };

    this.resize = function ()
    {
        var scroll = autoscroll();

        // Only bother if someone pasted a wonky line worth fixing.
        if (styles || container.scrollWidth !== container.clientWidth)
        {
            if (!styles)
            {
                styles = document.querySelector("chatview-styles");

                if (!styles)
                {
                    styles = document.createElement("style");
                    styles.id = "chatview-styles";
                    document.head.appendChild(styles);
                }

                styles.sheet.insertRule(".chatview td:last-child { word-wrap:break-word }", 0);
                styles = styles.sheet.cssRules[styles.sheet.cssRules.length - 1];
            }

            // 10 is a magic number. It's how much it was off by and it seems to work in Firefox and IE.
            styles.style.maxWidth = container.clientWidth - tbody.firstChild.children[0].offsetWidth
                    - tbody.firstChild.children[1].offsetWidth - 10 + "px";
        }

        if (scroll)
        {
            scrollToBottom();
        }
    };
}
