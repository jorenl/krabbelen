(function(exports){

    function toggle(obj, property, one, two) {
        obj[property] = (obj[property]==one) ? two : one;
    }

    function clearChildNodes(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function setText(el, text) {
        clearChildNodes(el);
        el.appendChild(document.createTextNode(text));
    }

    function show(el, yes) {
        yes = (yes === false ? false : true);
        el.style.display = yes?'block':'none';
    }

    function hide(el) {
        el.style.display = show(el, false);
    }
    function removeAll(els) {
        for (var i=els.length-1; i>=0; i--) {
            els[i].remove();
        }
    }
    function numericalSort(a,b) {
        return a - b;
    }

    function getUrlHashVars() {
        var hash = top.location.hash.replace('#', '');
        var params = hash.split('&');
        var result = {};
        for(var i = 0; i < params.length; i++){
        var propval = params[i].split('=');
        result[propval[0]] = propval[1];
        }
        return result;
    }

    function getRandomHash(n) {
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var out = '';
        for (var i=0; i < n; i++ )
            out += possible.charAt(Math.floor(Math.random() * possible.length));
        return out;
    }

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function pos(el, x, y) {
        if (x !== null) el.style.left = x+'px';
        if (y !== null) el.style.top  = y+'px';
        return [parseInt(el.style.left)||0, parseInt(el.style.top)||0];
    }

    /*
    * For if we want to switch to listener model based updates...
    */

    // if you pass in an object, the EventHost will install
    // its methods onto it.
    function EventHost(o) {
        this.events = {};

        if (o) {
            o.on = this.on.bind(this);
            o.off = this.off.bind(this);
            o.trigger = this.trigger.bind(this);
        }
    }
    // tie a function f as listeren to events
    // e, a space separated list of events
    EventHost.prototype.on = function(e, f) {
        e = e.split(' ');
        for (var i=0; i<e.length; i++) {
            if (!this.events[e[i]]) this.events[e[i]]=[];
            this.events[e[i]].push(f);
        }
    }
    // turn off one or all events
    EventHost.prototype.off = function(event) {
        if (event) {
            this.events[event] = [];
        } else {
            this.events = {};
        }
    }
    // trigger events
    // e, a space separated list of events
    EventHost.prototype.trigger = function(e) {
        e = e.split(' ');
        for (var i=0; i<e.length; i++) {
            if (this.events[e[i]]) {
                for (var j=0; j<this.events[e[i]].length; j++) {
                    // pass all but the first argument (the event name)
                    // to the listener function
                    this.events[e[i]][j].apply(this,
                        Array.prototype.slice.call(arguments,1)
                    );
                }
            }
        }
    }

    exports.EventHost = EventHost;
    exports.toggle = toggle;
    exports.clearChildNodes = clearChildNodes;
    exports.setText = setText;
    exports.show = show;
    exports.hide = hide;
    exports.removeAll = removeAll;
    exports.numericalSort = numericalSort;
    exports.getUrlHashVars = getUrlHashVars;
    exports.getRandomHash = getRandomHash;
    exports.shuffle = shuffle;
    exports.pos = pos;

})(typeof exports==='undefined' ? this['utils']={} : exports);