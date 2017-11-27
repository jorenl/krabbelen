(function(exports){
    var utils = require('./utils.js');
    var game =  require('./game.js');
    
    function BoardView(board) {
        this.board = board;
        this.el = this.createElement();

        board.on('change', this.update.bind(this));
    }
    var score_classes = {
        't': 'tripleletterscore',
        'd': 'doubleletterscore',
        'T': 'triplewordscore',
        'D': 'doublewordscore',
    }
    var score_labels = {
        't': 'TRIPLE LETTER SCORE',
        'd': 'DOUBLE LETTER SCORE',
        'T': 'TRIPLE WORD SCORE',
        'D': 'DOUBLE WORD SCORE',
    }
    BoardView.prototype.createElement = function() {
        var tbl = document.createElement('table');
        for (var i=0;i<this.board.size;i++) {
            var tr = tbl.insertRow();
            for (var j=0; j<this.board.size; j++) {
                var td = tr.insertCell();
                var scoreMultiplierCode = this.board.getScoreMultiplierCodeAt(i,j);
                if (score_classes[scoreMultiplierCode]) {
                    td.classList.add(score_classes[scoreMultiplierCode]);
                    td.appendChild(document.createTextNode(score_labels[scoreMultiplierCode]));
                }
            }
        }
        return tbl;
    }
    BoardView.prototype.update = function() {
        for (var r=0;r<this.board.size;r++) {
            for (var c=0; c<this.board.size; c++) {
                var td = this.el.rows[r].cells[c];
                var letter = this.board.letter(r, c);
                if (letter!='' && !td.firstElementChild) {
                    utils.clearChildNodes(td);
                    td.appendChild(createLetterElement(letter));
                }
            }
        }
    }

    PlayerView = function(game, el, playernr) {
        var _this = this;

        this.game = game;
        this.playernr = playernr;
        this.player = game.players[playernr];
        this.letterPositions = [];

        this.boardView = new BoardView(this.game.board)
        this.el = el;
        this.el_board   = el.getElementsByClassName('board')[0];
        this.el_tray    = el.getElementsByClassName('tray')[0];
        this.el_btnplay = el.getElementsByClassName('playmove')[0];
        this.el_status  = el.getElementsByClassName('status')[0];

        this.el_btnplay.addEventListener('click', this.playMove.bind(this));

        this.el_board.appendChild(this.boardView.el);

        this.player.on('trayChanged', this.updateTray.bind(this));
        this.game.on('turnChanged', this.turnChanged.bind(this));
        this.game.on('addPlayer', this.playerAdded.bind(this));

        this.updateTray();
        this.turnChanged();
    }

    PlayerView.prototype.turnChanged = function() {
        utils.show(this.el_btnplay, (this.game.whoseTurn == this.playernr));
        this.showStatus("Waiting for "+this.game.players[this.game.whoseTurn].name+"'s move");
    }
    PlayerView.prototype.playerAdded = function() {
        this.showStatus(this.game.players[this.game.players.length-1].name+" joined the game");
    }
    PlayerView.prototype.updateTray = function() {
        var _this = this;
        this.letterPositions = [];

        var tray_grid_offset = [3, 16];

        utils.clearChildNodes(this.el_tray);

        this.player.tray.forEach((letter, index) => {
            _this.letterPositions.push( [tray_grid_offset[0]+index+1, tray_grid_offset[1]] );
            var el = createLetterElement(letter);
            // make the letter draggable
            el.addEventListener('mousedown', function(e1) {
                var startPos = utils.pos(el);
                var mouseMoveListener = function(e2) {
                    utils.pos(el, startPos[0]+e2.clientX-e1.clientX,
                                startPos[1]+e2.clientY-e1.clientY);
                }
                var mouseUpListener = function(e3) {
                    if (!el) return;
                    document.body.removeEventListener('mousemove', mouseMoveListener);
                    document.body.removeEventListener('mouseup', mouseUpListener);
                    var pos = utils.pos(el);
                    var grid_pos = [Math.round(pos[0]/40)+tray_grid_offset[0], Math.round(pos[1]/40)+tray_grid_offset[1]];
                    if ((grid_pos[0] >= tray_grid_offset[0] && grid_pos[0] < tray_grid_offset[0]+9 &&
                        grid_pos[1] == tray_grid_offset[1]) ||
                        (_this.game.whoseTurn == _this.playernr &&
                        grid_pos[0] >= 0 && grid_pos[0] < _this.game.board.size &&
                        grid_pos[1] >= 0 && grid_pos[1] < _this.game.board.size)) {
                            _this.letterPositions[index] = grid_pos;
                    }
                    utils.pos(el, (_this.letterPositions[index][0]-tray_grid_offset[0])*40,
                                (_this.letterPositions[index][1]-tray_grid_offset[1])*40);
                    _this.showTentativeScore();
                };
                document.body.addEventListener('mousemove', mouseMoveListener);
                document.body.addEventListener('mouseup', mouseUpListener);
            });
            utils.pos(el, (_this.letterPositions[index][0]-tray_grid_offset[0])*40,
                        (_this.letterPositions[index][1]-tray_grid_offset[1])*40);
            _this.el_tray.appendChild(el);
        });
    }
    PlayerView.prototype.getMove = function() {
        var _this = this;
        var tiles = [];
        this.player.tray.forEach((letter, index) => {
            var pos = _this.letterPositions[index];
            if (pos[0] >= 0 && pos[0] < _this.game.board.size &&
                pos[1] >= 0 && pos[1] < _this.game.board.size) {
                    tiles.push([pos[1], pos[0], letter]);
            }
        });
        return (tiles.length > 0) ? new game.Move(_this.game, tiles) : false;
    }
    PlayerView.prototype.playMove = function() {
        var move = this.getMove();
        var moved = this.game.makeMove(this.playernr, move);
        if (!moved) this.updateTray();
    }
    PlayerView.prototype.showTentativeScore = function() {
        var move = this.getMove();
        if (move && move.isValid()) {
            var words = move.getWords().map(w => w[3]);
            this.showStatus("Play "+words.join(', ')+" for "+move.score()+" points");
        } else {
            this.showStatus("That's not a valid move");
        }
    }

    PlayerView.prototype.showStatus = function(msg) {
        utils.setText(this.el_status, msg);
    }

    function createLetterElement(letter) {
        var el = document.createElement('div');
        el.classList.add('letter');
        el.appendChild(document.createTextNode(letter));
        var el_score = document.createElement('div');
        el_score.classList.add('score');
        el_score.appendChild(document.createTextNode(g.letterDist[letter][0])); // Uses the "g" game global, bad.
        el.appendChild(el_score);
        return el;
    }

    exports.BoardView = BoardView;
    exports.PlayerView = PlayerView;
})(typeof exports==='undefined' ? this['views']={} : exports);