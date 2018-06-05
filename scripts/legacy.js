// Exists partly as a transition API between how the old API (v6) was accessed, and the
// new one (v11) based around JSON is accessed.
var Relive = (function ()
{
    var api = 11,
        ua = "reLive/11 (browser; " + navigator.platform + ") reLove/" + APP_VERSION,
        protocol = "?v=" + encodeURIComponent(api) + "&ua=" + encodeURIComponent(ua),
        b62digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    return {
        version: api,
        loadStations: function (finished, error)
        {
            App.requestJSON({
                url: location.protocol + "//api.relive.nu/getstations/" + protocol,
                success: function (data)
                {
                    data.stations.forEach(function (station)
                    {
                        station.servers.map(function (server)
                        {
                            var server = server.replace(/^[^:]+:/, location.protocol);
                            if (!server.endsWith("/"))
                            {
                                server += "/";
                            }
                            return server;
                        });
                    });

                    if (finished)
                    {
                        finished(data.stations);
                    }
                },
                error: error
            });
        },
        loadStationInfo: function (station, finished, error)
        {
            App.requestJSON({
                url: station.servers[0] + "getstationinfo/" + protocol,
                success: finished,
                error: error
            });
        },
        loadStreamInfo: function (station, stream, finished, error)
        {
            App.requestJSON({
                url: station.servers[0] + "getstreaminfo/" + protocol + "&streamid=" + encodeURIComponent(stream.id),
                success: function (data)
                {
                    if (finished)
                    {
                        finished(data.tracks);
                    }
                },
                error: error
            });
        },
        loadStreamChat: function (station, stream, finished, error)
        {
            App.requestJSON({
                url: station.servers[0] + "getstreamchat/" + protocol + "&streamid=" + encodeURIComponent(stream.id),
                success: finished,
                error: error
            });
        },
        getStreamURL: function (station, stream)
        {
            return stream.mediaDirectUrls[0];
        },
        getStreamMimeType: function (station, stream)
        {
          switch(stream.mediaDataFormat)
          {
            case "Mp3":
                return "audio/mpeg";
            case "Ogg":
                return "audio/ogg";
            case "Aac":
                return "audio/aac";
            default:
                return "application/octet-stream";
          }
          return null;
        },
        toBase62: function (value)
        {
            var v = value, s = "";
            do
            {
                s = b62digits[v % 62] + s;
                v = Math.floor(v / 62);
            } while (v > 0);
            return s;
        },
        fromBase62: function (str)
        {
            var i, v = 0;
            for (i = 0; i < str.length; i++) 
            {
                v *= 62;
                v += b62digits.indexOf(str[i]);
            }
            return v;
        },
    };
}());
