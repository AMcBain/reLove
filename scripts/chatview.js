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
        var time, format = "[##:##]";

        // TODO Actually generate time format: HH:MM in 24-hour time. 00:00, 13:00, etc.
        timestamp += offset;

        time = document.createElement("time");
        time.setAttribute("datetime", new Date(timestamp * 1000).toISOString());
        time.setAttribute("title", time.getAttribute("datetime").replace("T", " ").replace(/\..+$/, ""));
        time.textContent = format;

        return time;
    }

    function column (value)
    {
        var column = document.createElement("td");
        column.textContent = value;
        return column;
    }

    // TODO Check if scrollbar is within a certain distance of the bottom and force it to be
    // the bottom after adding a new line if the browser doesn't do this already. (This way
    // if someone scrolled up to read stuff their place isn't lost.)
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

    // {"timestamp":39,"type":1,"stringCount":2,"strings":["the_Ye-Ti","huhwat"]},
    // {"timestamp":57,"type":1,"stringCount":2,"strings":["MrT","yi8ha"]},
    // {"timestamp":63,"type":1,"stringCount":2,"strings":["phobium","hepp hepp!"]},
    // {"timestamp":66,"type":1,"stringCount":2,"strings":["MrT","so is it live or a recoring ?"]},
    types[Relive.CHATTYPE_MESSAGE] = function (line)
    {
        row(line.type, line.timestamp, line.strings[0], line.strings[1]);
    };

    // {"timestamp":6418,"type":2,"stringCount":2,"strings":["SceneSat","spots that SceneCAT simply loooooves Waldemar Doppelzimmer - Bier und Demos! Ah, l'amour!"]}
    types[Relive.CHATTYPE_ME] = function (line)
    {
        rowspc(line.type, line.timestamp, line.strings[0], line.strings[1]);
    };

    // {"timestamp":1908,"type":3,"stringCount":1,"strings":["ZaphodB_"]}
    types[Relive.CHATTYPE_JOIN] = function (line)
    {
        rowstar(line, line.strings[0] + " has joined " + channel);
    };

    // {"timestamp":8547,"type":4,"stringCount":2,"strings":["Dumper","Time for a dump."]},
    // {"timestamp":11487,"type":4,"stringCount":1,"strings":["[EviL]"]}
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

    // {"timestamp":9461,"type":5,"stringCount":2,"strings":["SaphirJD","Read error: Connection reset by peer"]}
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

    // {"timestamp":11112,"type":6,"stringCount":2,"strings":["crazzter","ZiGGi"]}
    types[Relive.CHATTYPE_NICK] = function (line)
    {
        rowstar(line, line.strings[0] + " is now known as " + line.strings[1]);
    };

    // {"timestamp":23659,"type":7,"stringCount":2,"strings":["SceneSat","Next show: Soothing Sounds with Steph with Steph - Mon, November 17th, 20:00 CET | Previous shows: http://scenesat.com/archive or http://scenesat.com/relive"]}
    types[Relive.CHATTYPE_TOPIC] = function (line)
    {
        rowstar(line, line.strings[0] + " has set the topic to: " + line.strings[1]);
    };

    // TODO Find an example of channel mode changing and update code to accommodate, if needed.
    types[Relive.CHATTYPE_MODE] = function (line)
    {
        if (line.strings.length > 2)
        {
            rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + line.strings[1]);
        }
        else
        {
            // Hope this is a channel mode change. If it's not the added or removed mode then the
            // message format should probably be: "Channel " + channel + " modes: " + line.strings[1]
            rowstar(line, line.strings[0] + " sets mode " + line.strings[1] + " on " + channel);
        }
    };

    // first is kicker, second is person being kicked.
    // {"timestamp":13639,"type":9,"stringCount":3,"strings":["dotwaffle","Sofa9176","no reason"]}
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
        // Just in case, map unknown type numbers to CHATTYPE_UNKNOWN?
        types[line.type](line);
    };
}
