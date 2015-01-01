"use strict";

function ChatView (parent, channel, offset)
{
    var container, table, types = {}, init;

    container = document.createElement("div");
    container.className = "chatview";
    parent.appendChild(container);

    // Defeat Firefox, which insists on restoring the last known scroll position.
    setTimeout(function ()
    {
        container.scrollTop = 0;
    }, 1);

    table = document.createElement("table");
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
        table.appendChild(row);
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
        table.appendChild(row);
    }

    function rowstar (line, message)
    {
        row(line.type, line.timestamp, "*", message);
    }

    // Best guess as to what to do with these.
    types[Relive.CHATTYPE_UNKNOWN] = function (line)
    {
        if (line.strings.length > 1)
        {
            row(line.type, line.timestamp, line.strings[0], line.strings[1]);
        }
        else
        {
            rowstar(line, line.strings[0]);
        }
    };

    types[Relive.CHATTYPE_MESSAGE] = function (line)
    {
        row(line.type, line.timestamp, line.strings[0], line.strings[1]);
    };

    types[Relive.CHATTYPE_ME] = function (line)
    {
        rowspc(line.type, line.timestamp, line.strings[0], line.strings[1]);
    };

    types[Relive.CHATTYPE_JOIN] = function (line)
    {
        rowstar(line, line.strings[0] + " has joined " + channel);
    };

    types[Relive.CHATTYPE_LEAVE] = function (line)
    {
        var msg = line.strings[0] + " has left " + channel;

        if (line.strings.length > 1)
        {
            rowstar(line, msg + " (" + line.strings[1] + ")");
        }
        else
        {
            rowstar(line, msg);
        }
    };

    types[Relive.CHATTYPE_QUIT] = function (line)
    {
        var msg = line.strings[0] + " has quit";

        if (line.strings.length > 1)
        {
            rowstar(line, msg + " (" + line.strings[1] + ")");
        }
        else
        {
            rowstar(line, msg);
        }
    };

    types[Relive.CHATTYPE_NICK] = function (line)
    {
        rowstar(line, line.strings[0] + " is now known as " + line.strings[1]);
    };

    types[Relive.CHATTYPE_TOPIC] = function (line)
    {
        rowstar(line, line.strings[0] + " has set the topic to: " + line.strings[1]);
    };

    // TODO Find an example of channel mode changing and update code to accommodate, if needed.
    types[Relive.CHATTYPE_MODE] = function (line)
    {
        if (line.strings.length > 2)
        {
            rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + line.strings[2]);
        }
        else
        {
            // Hope this is a channel mode change. If it's not the added or removed mode then the
            // message format should probably be: "Channel " + channel + " modes: " + line.strings[1]
            rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + channel);
        }
    };

    types[Relive.CHATTYPE_KICK] = function (line)
    {
        var msg = line.strings[0] + " has kicked " + line.strings[1] + " from " + channel;

        if (line.strings.length > 2)
        {
            rowstar(line, msg + " (" + line.strings[2] + ")");
        }
        else
        {
            rowstar(line, msg);
        }
    };

    this.addLine = function (line)
    {
        var scroll = table.children.length && container.scrollHeight - container.clientHeight - container.scrollTop <= 34;

        // Just in case, map unknown type numbers to CHATTYPE_UNKNOWN?
        types[line.type](line);

        if (scroll)
        {
            container.scrollTop = container.scrollHeight - container.clientHeight;
        }
    };

    this.removeLine = function (index)
    {
        table.removeChild(table.children[index]);
    };
}
