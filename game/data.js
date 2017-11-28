(function(exports) {
    //https://en.wikipedia.org/wiki/Scrabble_letter_distributions

    exports.letter_distributions = {
        'en': {
            '0': [0, 2],
            'E': [1, 12],
            'A': [1, 9],
            'I': [1, 9],
            'O': [1, 8],
            'N': [1, 6],
            'R': [1, 6],
            'T': [1, 6],
            'L': [1, 4],
            'S': [1, 4],
            'U': [1, 4],
            'D': [2, 4],
            'G': [2, 3],
            'B': [3, 2],
            'C': [3, 2],
            'M': [3, 2],
            'P': [3, 2],
            'F': [4, 2],
            'H': [4, 2],
            'V': [4, 2],
            'W': [4, 2],
            'Y': [4, 2],
            'K': [5, 1],
            'J': [8, 1],
            'X': [8, 1],
            'Q': [10, 1],
            'Z': [10, 1]
        },
        'nl': {
            ' ': [0, 2],
            'E': [1, 18],
            'N': [1, 10],
            'A': [1, 6],
            'O': [1, 6],
            'I': [1, 4],
            'D': [2, 5],
            'R': [2, 5],
            'S': [2, 5],
            'T': [2, 5],
            'G': [3, 3],
            'K': [3, 3],
            'L': [3, 3],
            'M': [3, 3],
            'B': [3, 2],
            'P': [3, 2],
            'U': [4, 3],
            'F': [4, 2],
            'H': [4, 2],
            'J': [4, 2],
            'V': [4, 2],
            'Z': [4, 2],
            'C': [5, 2],
            'W': [5, 2],
            'X': [8, 1],
            'Y': [8, 1],
            'Q': [10,1]
        }
    }
    exports.board_layout =  "T  d   T   d  T;"+
                            " D   t   t   D ;"+
                            "  D   d d   D  ;"+
                            "d  D   d   D  d;"+
                            "    D     D    ;"+
                            " t   t   t   t ;"+
                            "  d   d d   d  ;"+
                            "T  d   D   d  T;"+
                            "  d   d d   d  ;"+
                            " t   t   t   t ;"+
                            "    D     D    ;"+
                            "d  D   d   D  d;"+
                            "  D   d d   D  ;"+
                            " D   t   t   D ;"+
                            "T  d   T   d  T";
})(typeof exports === 'undefined' ? this['data']={} : exports);