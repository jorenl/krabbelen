(function(exports) {
    var gameid = window.location.href.match(/\/game\/([a-z0-9]+)\/play/)[1];

    var socket = io({'query':{'gameid':gameid}});
    var gamelib = require('game');

    function Realtime(game, myPlayerNr) {

        socket.on('addPlayer', function(player) {
            game.addPlayer();
        });
        game.on('move', function(move) {
            if (move[0]==myPlayerNr) {
                socket.emit('move', [move[0], move[1].tiles]);
            }
        });
        socket.on('move', function(move) {
            game.makeMove(move[0], new game.Move(move[1]));
        });

        socket.emit('addPlayer', game.players[game.players.length-1].pack());
    }

    exports.Realtime = Realtime;
})(typeof exports==='undefined' ? this['realtime']={} : exports);