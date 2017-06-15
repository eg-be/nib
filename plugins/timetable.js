﻿var Command = require('../lib/commands').Command

const http = require('http');
const querystring = require('querystring');

const hostname = 'transport.opendata.ch';
const stationPath = '/v1/stationboard';
const journeyPath = '/v1/connections';

module.exports = Command.extend({
    name: 'departure'
  , info: 'Timetable departures'
  , description: 'Shows the next departures from a public transport station. Syntax:\n'
                + 'departures <stationName> [limit]\n'
                + '  Prints the next departures from passed stationName.\n'
                + '  limit can be a positive integer, to limit number of timestamps\n'
                + '  (not departures) to return. Defaults to 4, max value is 10.\n'
                + '  Departures will be printed with a private messages to prevent channel flooding'
  , handler:  function(from, to, args) {
    var bot = this._bot;
    
    if(!args) {
      bot.reply(from, from, 'stationName is mandatory!');
      return;
    }
    var stationName = args.split(' ')[0];
    var limit = args.slice(stationName.length + 1);
    
    if (parseInt(limit) <= 0 || isNaN(parseInt(limit)))
      limit = 4;
    if(limit > 10)
      limit = 10;
    
    getDepartures(stationName, limit, function(timetable, err) {
      if(err)
      {
        bot.reply(from, from, 'Ooops: ' + err);
        return;
      }
        
      printArray(bot, from, from, timetable, 0, 500);
    });
  }
})

printArray = function (bot, from, to, arr, start, delay) {
    if (start < arr.length)
        bot.reply(from, to, arr[start]);
    start++;
    if (start < arr.length)
        setTimeout(function () { printArray(bot, from, to, arr, start, delay) }, delay);
}

query = function (host, path, argsObject, callback) {
    if (!host) callback(null, 'host must be set!');
    if (!path) callback(null, 'path must be set!');
    if (!argsObject) callback(null, 'argsObject must be set!');

    var url = path;
    if (argsObject) {
        url += ('?' + querystring.stringify(argsObject));
    }

    console.log('Query: ' + url);
    var data = '';
    var req = http.request({ hostname: host, path: url, method: 'GET', port: 80 }, function (resp) {
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function () {
            var o = JSON.parse(data);
            if (callback) callback(o);             
        });
    });
    req.on('error', function(err) {
      if(callback) callback(null, err);
    });
    req.end();
}

getDepartures = function (stationName, limit, callback) {
    if (!stationName) callback(null, 'stationName must be set!');

    var args = { station: stationName };
    if (limit)
        args.limit = limit;

    query(hostname, stationPath, args, function (data, err) {
      
        if(err) {
          if(callback) callback(null, err);
          return;
        }
          
        if (!data.station)
        {
          timetable.push('No matching station for \'' + stationName + '\' found')
          if(callback)  callback(timetable);
          return;
        }

        var timetable = [];
        
        var exactStationName = data.station.name;
        if (!data.stationboard || data.stationboard.length == 0) {
          timetable.push('No departures found for station \'' + exactStationName + '\'');
        }
        else {  
          timetable.push('Next ' + data.stationboard.length + ' departures from ' + exactStationName + ':');
          for (var i = 0; i < data.stationboard.length; i++) {
              var journey = data.stationboard[i];
              var dep = new Date(journey.stop.departure);
              var msg = journey.name + ' to ' + journey.to + ' at ' + dep.toLocaleTimeString();
              if (journey.stop.platform)
                  msg += ' from platform ' + journey.stop.platform;
              timetable.push(msg);
          }
        }
        if(callback) callback(timetable);
    });
}


getJourney = function (stationFromName, stationToName, limit) {

}


