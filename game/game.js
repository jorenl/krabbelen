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
    Game.prototype.makeMove = function(playernr, move) {
        var _this = this;
        if (!move.isValid()) return;
        move.tiles.forEach((letter) => {
            _this.board.letter(letter[0], letter[1], letter[2]);
            _this.players[playernr].removeLetterFromTray(letter[2]);
        });
        _this.players[playernr].addLettersToTray(_this.drawLetters(move.tiles.length));
        this.trigger('move', [playernr, move]);
        this.nextTurn();
        return true;
    }
    Game.prototype.nextTurn = function() {
        this.whoseTurn = (this.whoseTurn + 1) % this.players.length;
        this.trigger('turnChanged');
    }
    Game.prototype.isValidMove = function(tiles) {
        return new Move(tiles).isValid();
    }
    Game.prototype.getMoveLetterFn = function(move) {
        var newtiles = {};
        move.forEach((tile) => newtiles[tile[0]+','+tile[1]] = tile[2]);
        return (r,c) => (newtiles[r+','+c] || '')
    }
    Game.prototype.getLetterScore = function(letter) {
        return this.letterDist[letter][0]
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

    function Move(game, tiles) {
        this.game = game;
        this.tiles = tiles;
        this.tilemap = {};
        this.tiles.sort((a,b)=>( (a[0]+a[1]) - (b[0]+b[1]))); //sort in increasing sum of coords
        tiles.forEach(t => this.tilemap[t[0]+','+t[1]] = t[2]);
    }
    Move.prototype.isValid = function() {
        var _this = this;
        var allHorizontal = this.tiles.reduce((sofar, tile) => (sofar && (tile[0] == _this.tiles[0][0])), true);
        var allVertical   = this.tiles.reduce((sofar, tile) => (sofar && (tile[1] == _this.tiles[0][1])), true);
        var allEmptyTiles = this.tiles.reduce((sofar, tile) => (sofar && !_this.game.board.letter(tile[0], tile[1])), true);

        var first = this.tiles[0];
        var last  = this.tiles[this.tiles.length-1];
        var d = allVertical ? 0 : 1; //index of the varying coordinate

        var continuous = true;
        for (var i=0; i<last[d]-first[d]; i++) {
            var r = first[0] + i*(1-d);
            var c = first[1] + i*d;
            continuous = continuous && this.letter(r,c);
        }

        return this.tiles.length <= 7 && (allVertical || allHorizontal) && allEmptyTiles && continuous;
    }
    Move.prototype.letter = function(r, c) {
        // like Board.letter, but for the virtual board with this Move applied
        return this.tilemap[r+','+c] || this.game.board.letter(r,c);
    }
    Move.prototype.isNewTile = function(r,c) {
        return (r+','+c) in this.tilemap;
    }
    Move.prototype.getWords = function() {
        var _this = this;
        var words = [];

        var discovered = new Set();
        function discovering(r,c) {
            var isnew = !discovered.has(r+','+c);
            if (isnew) discovered.add(r+','+c);
            return isnew;
        }

        this.tiles.forEach((tile) => {
            var [r,c,l] = tile;
            var l0,l1;

            discovering(r,c);

            //horizontal
            var c0=c, c1=c, hword = l;
            while (discovering(r,c0-1) && (l0 = _this.letter(r,c0-1))) {hword = l0+hword; c0--};
            while (discovering(r,c1+1) && (l1 = _this.letter(r,c1+1))) {hword = hword+l1; c1++};

            //vertical
            var r0=r, r1=r, vword = l;
            while (discovering(r0-1,c) && (l0 = _this.letter(r0-1,c))) {vword = l0+vword; r0--};
            while (discovering(r1+1,c) && (l1 = _this.letter(r1+1,c))) {vword = vword+l1; r1++};

            if (hword.length>1) words.push([r,c0,1,hword]);
            if (vword.length>1) words.push([r0,c,0,vword]);
        });

        return words;
    }
    Move.prototype.score = function() {
        var _this = this;
        var score = 0;
        this.getWords().forEach((wordplay) => {
            var [r0, c0, dim, word] = wordplay;
            var wordscore = 0, wordMultiplier = 1;
            word.split('').forEach((letter, i) => {
                var [r,c] = [r0 + i*(1-dim), c0 + i*dim];
                var letterMultiplier = (_this.isNewTile(r,c)) ? _this.game.board.getLetterScoreMultiplierAt(r,c) : 1;
                wordMultiplier *= (_this.isNewTile(r,c)) ? _this.game.board.getWordScoreMultiplierAt(r,c) : 1;
                wordscore += _this.game.getLetterScore(letter) * letterMultiplier;
            });
            score += wordscore*wordMultiplier;
        });
        if (this.tiles.length == 7) score += 50;
        return score;
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
            case 'd': return 2;
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
    exports.Move = Move;
    exports.Player = Player;
    exports.Board = Board;
})(typeof exports==='undefined' ? this['game']={} : exports);