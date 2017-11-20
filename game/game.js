(function(exports){
    var data = require('./data.js');
    var utils = require('./utils.js');

    function Game(lang) {
        this.lang = lang;
        this.letterDist = data.letter_distributions[this.lang];

        this.bag = [];
        this.board = new Board();
        this.whoseTurn = 0;
        this.players = [];
        
        this.createBag();

        new utils.EventHost(this);
    }
    Game.prototype.createBag = function() {
        var bag = [];
        for (letter in this.letterDist) {
            for (var i=0; i<this.letterDist[letter][1]; i++) {
                bag.push(letter)
            }
        }
        utils.shuffle(bag);
        this.bag = bag;
    }
    Game.prototype.drawLetters = function(howMany) {
        return this.bag.splice(0, howMany);
    }
    Game.prototype.addPlayer = function(player) {
        if (!player) {
            var player = new Player("Player "+(this.players.length+1));
            player.addLettersToTray(this.drawLetters(7));
        }
        this.players.push(player);
        this.trigger('addPlayer');
    }
    Game.prototype.playWordAt = function(playernr, word, row, col, vertical) {
        var move = word.split('').map((letter, index) => (vertical ? [row+index,col,letter] : [row,col+index,letter]));
        this.makeMove(playernr, move);
    }
    Game.prototype.makeMove = function(playernr, move) {
        var _this = this;
        if (!this.isValidMove(move)) return;
        // move is a list of [row, col, letter] tiles
        move.forEach((letter) => {
            _this.board.letter(letter[0], letter[1], letter[2]);
            _this.players[playernr].removeLetterFromTray(letter[2]);
        });
        _this.players[playernr].addLettersToTray(_this.drawLetters(move.length));
        this.trigger('move', [playernr, move]);
        this.nextTurn();
    }
    Game.prototype.nextTurn = function() {
        this.whoseTurn = (this.whoseTurn + 1) % this.players.length;
        this.trigger('turnChanged');
    }
    Game.prototype.isValidMove = function(move) {
        var _this = this;
        var allHorizontal = move.reduce((sofar, letter) => (sofar && (letter[0] == move[0][0])), true);
        var allVertical   = move.reduce((sofar, letter) => (sofar && (letter[1] == move[0][1])), true);
        var allEmptyTiles = move.reduce((sofar, letter) => (sofar && (_this.board.letter(letter[0], letter[1]) == "")), true);

        return move.length <= 7 && (allVertical || allHorizontal) && allEmptyTiles
    }
    Game.prototype.pack = function() {
        return {
            'lang': this.lang,
            'bag': this.bag,
            'board': this.board.pack(),
            'whoseTurn': this.whoseTurn,
            'players': this.players.map(p => p.pack())
        }
    }
    Game.unpack = function(packed) {
        var g = new Game(packed.lang);
        g.bag = packed.bag;
        g.board = Board.unpack(packed.board);
        g.whoseTurn = packed.whoseTurn;
        g.players = packed.players.map(p => Player.unpack(p));     
        return g;   
    }

    function Player(name) {
        this.name = name;
        this.score = 0;
        this.tray = [];
        new utils.EventHost(this);
    }
    Player.prototype.addLettersToTray = function(letters) {
        this.tray = this.tray.concat(letters);
        this.trigger('trayChanged');
    }
    Player.prototype.removeLetterFromTray = function(letter) {
        this.tray.splice(this.tray.indexOf(letter), 1);
    }
    Player.prototype.pack = function() {
        return {
            'name': this.name,
            'score': this.score,
            'tray': this.tray
        }
    }
    Player.unpack = function(packed) {
        var p = new Player(packed.name);
        p.score = packed.score;
        p.tray = packed.tray;
        return p;
    }

    function Board() {
        this.size = 15;
        this.cells = [];
        new utils.EventHost(this);
        this.clear();
    }
    Board.prototype.clear = function() {
        this.cells = new Array(this.size);
        for (var i=0; i<this.size; i++) {
            this.cells[i] = new Array(this.size);
            for (var j=0; j<this.size; j++) {
                this.cells[i][j] = ""
            }
        }
        this.trigger('change');
    }
    Board.prototype.letter = function(row, col, letter) {
        if (letter) {
            this.cells[row][col] = letter;
            this.trigger('change');
        }
        return this.cells[row][col];
    }
    Board.prototype.getScoreMultiplierCodeAt = function(row, col) {
        return data.board_layout.split(';')[row].split('')[col];
    }
    Board.prototype.getLetterScoreMultiplierAt = function(row,col) {
        var multiplierCode = this.getScoreMultiplierCodeAt(row, col);
        switch (multiplierCode){
            case 't': return 3;
            case 'D': return 2;
            default:  return 1;
        }
    }
    Board.prototype.getWordScoreMultiplierAt = function(row, col) {
        var multiplierCode = this.getScoreMultiplierCodeAt(row, col);
        switch (multiplierCode) {
            case 'T': return 3;
            case 'D': return 2;
            default:  return 1;
        }
    }
    Board.prototype.toString = function() {
        return this.cells.map((row)=>(row.map((cell)=>((cell=='')?'_':cell)).join(' '))).join("\n");
    }
    Board.prototype.pack = function() {
        return this.cells;
    }
    Board.unpack = function(packed) {
        var b = new Board();
        b.cells = packed;
        return b;
    }

    exports.Game = Game;
    exports.Player = Player;
    exports.Board = Board;
})(typeof exports==='undefined' ? this['game']={} : exports);