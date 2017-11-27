var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var application_root = process.env.application_root || process.cwd();
var port = process.env.port || 3000;

// game logic
var game = require('./game/game.js');


var games = {};

app.use('/res', express.static(path.resolve('./game')));
app.get('/', function(req, res){res.sendFile(path.resolve('./splash.htm'));});

app.get('/game/new/:lang', function(req, res){
    var gameid = Math.random().toString(36).substr(2,6);
    games[gameid] = new game.Game(req.params.lang);
    res.redirect('/game/'+gameid+'/play');
});
app.all('/game/:gameid', function(req,res,next) {
    if (req.params.gameid in games) {
        next();
    } else {
        res.status(404).send('Game '+req.params.gameid+' not found');
    }
});
app.get('/game/:gameid/play', function(req, res) {
    res.sendFile(path.resolve('./game/game.htm'));
});
app.get('/game/:gameid/game', function(req, res) {
    res.send(games[req.params.gameid].pack());
});

io.on('connection', function(socket){
    var gameid = socket.handshake.query.gameid;
    console.log('a user connected to game '+gameid);
    socket.join(gameid);
    socket.on('move', function(move) {
        console.log(gameid, move[0]);
        games[gameid].makeMove(move[0], new game.Move(games[gameid], move[1]));
        console.log(games[gameid].board.toString());
        socket.in(gameid).emit('move', move);
    });
    socket.on('addPlayer', function(player) {
        console.log('addPlayer '+player.name);
        games[gameid].addPlayer();
        socket.in(gameid).emit('addPlayer', player);
    });
});

http.listen(port, function(){
  console.log('listening on *:'+port);
});
