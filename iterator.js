// Object common to patterns
var PatternCommon = {

    // siteswap alphabet
    "ALPHABET": "0123456789abcdefghijklmnopqrstuvwxyz",

    // convert string to integer
    "toInt": function(text, radix) {
        // check the arguments
        if (isNaN(radix) || radix < 2 || PatternCommon.ALPHABET.length < radix) {
            radix = 10;
        }

        // get a valid part from the beginning
        var exp = new RegExp("^(\\+|\\-)?[" + PatternCommon.ALPHABET.substring(0, radix) + "]+");
        var match = exp.exec(text);
        if (match) {
            return new bigInt(match[0], radix);
        } else {
            return new bigInt();
        }
    },

    // whether it is an integer
    "isInt": function(text) {
        return text instanceof bigInt;
    },

    // convert to lowercase letters
    "toSmall": function(text) {
        var half = text.replace(/[\uFF01-\uFF5E]/g, PatternCommon._toHankaku);
        var quote = half.replace(/[\u201C\u201D]/g, "\"").replace("\u2018", "`").replace("\u2019", "'");
        var other = quote.replace("\u3000", " ").replace("\u301C", "~").replace("\uFFE5", "\u00A5");
        return other.toLowerCase();
    },

    // convert to half-width characters
    "_toHankaku": function(text) {
        return String.fromCharCode(text.charCodeAt(0) - 0xFEE0);
    },

}

// Selection iterator class
var SelectionIterator = function(iterators) {
    // fields
    this._originals = iterators;
    this._infinites = [];
    for (var i = 0; i < iterators.length; i++) {
        if (iterators[i].endless) {
            this._infinites.push(iterators[i]);
        }
    }
    this._iterators = this._originals;
    this._position = 0;

    // properties
    this.endless = (0 < this._infinites.length);
}

// Selection iterator prototype
SelectionIterator.prototype = {

    // reset fields
    "reset": function(cycle) {
        if (cycle == 0) {
            this._iterators = this._originals;
        } else {
            this._iterators = this._infinites;
        }
        this._position = 0;

        // initialization for each iterator
        for (var i = 0; i < this._iterators.length; i++) {
            this._iterators[i].reset(cycle);
        }
    },

    // create next pattern
    "createNext": function() {
        // whether it is finished
        if (this.finished()) {
            return;
        }
        if (this._iterators.length <= this._position) {
            return;
        }

        // next pattern
        if (this._iterators[this._position].finished()) {
            this._position++;
        } else {
            this._iterators[this._position].createNext();
        }
    },

    // get current pattern
    "getCurrent": function() {
        if (this._iterators.length <= this._position) {
            return "";
        } else {
            return this._iterators[this._position].getCurrent();
        }
    },

    // get current pattern list
    "getPatterns": function() {
        if (this._iterators.length <= this._position) {
            return [];
        }

        // get patterns from all iterators
        var iterator = this._iterators[this._position];
        var patterns = [ iterator.getCurrent() ];
        Array.prototype.push.apply(patterns, iterator.getPatterns());
        return patterns;
    },

    // whether it is finished
    "finished": function() {
        // check the fields
        if (this._position < this._iterators.length - 1) {
            return false;
        }
        if (this._iterators.length <= this._position) {
            return true;
        }

        // whether the last iterator is finished
        return this._iterators[this._position].finished();
    },

    // copy this instance
    "copy": function() {
        // copy the original iterators
        var iterators = [];
        for (var i = 0; i < this._originals.length; i++) {
            iterators.push(this._originals[i].copy());
        }

        // create a new instance
        return new SelectionIterator(iterators);
    },

}

// Sequence iterator class
var SequenceIterator = function(iterators) {
    // fields
    this._originals = iterators;
    this._infinites = [];
    this._finites = [];
    for (var i = 0; i < iterators.length; i++) {
        if (iterators[i].endless) {
            this._infinites.push(iterators[i]);
        } else {
            this._finites.push(iterators[i]);
        }
    }
    this._divisors = [];
    this._index = 0;

    // properties
    this.endless = (0 < this._infinites.length);
}

// Sequence iterator prototype
SequenceIterator.prototype = {

    // reset fields
    "reset": function(cycle) {
        // finite pattern
        for (var i = 0; i < this._finites.length; i++) {
            this._finites[i].reset(0);
        }

        // infinite pattern
        var length = this._infinites.length;
        this._divisors = this._getDivisors(length, cycle);
        this._index = 0;
        var cycles = this._divisors[this._index];
        for (var i = 0; i < length; i++) {
            this._infinites[i].reset(cycles[i]);
        }
    },

    // create next pattern
    "createNext": function() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        if (!this._createFinite()) {
            this._createInfinite();
        }
    },

    // get current pattern
    "getCurrent": function() {
        var current = "";
        for (var i = 0; i < this._originals.length; i++) {
            current += this._originals[i].getCurrent();
        }
        return current;
    },

    // get current pattern list
    "getPatterns": function() {
        var patterns = [];
        for (var i = 0; i < this._originals.length; i++) {
            Array.prototype.push.apply(patterns, this._originals[i].getPatterns());
        }
        return patterns;
    },

    // whether it is finished
    "finished": function() {
        // check the fields
        if (this._index < this._divisors.length - 1) {
            return false;
        }

        // whether all iterators are finished
        var pos = 0;
        while (pos < this._originals.length) {
            if (!this._originals[pos].finished()) {
                return false;
            }
            pos++;
        }
        return true;
    },

    // copy this instance
    "copy": function() {
        // copy the original iterators
        var iterators = [];
        for (var i = 0; i < this._originals.length; i++) {
            iterators.push(this._originals[i].copy());
        }

        // create a new instance
        return new SequenceIterator(iterators);
    },

    // get divisor list
    "_getDivisors": function(division, total) {
        // check the arguments
        var divisors = [];
        if (division < 1 || total < 0) {
            return divisors;
        }

        // number of divisions is 1
        if (division == 1) {
            divisors.push([ total ]);
            return divisors;
        }

        // number of divisions is 2 or more
        for (var i = total; 0 <= i; i--) {
            var parts = this._getDivisors(division - 1, total - i);
            for (var j = 0; j < parts.length; j++) {
                parts[j].unshift(i);
                divisors.push(parts[j]);
            }
        }
        return divisors;
    },

    // create next finite pattern
    "_createFinite": function() {
        // search for finite pattern that has not yet finished
        var length = this._finites.length;
        var pos = 0;
        while (pos < length && this._finites[pos].finished()) {
            pos++;
        }
        if (pos == length) {
            // not found
            return false;
        }

        // found
        for (var i = 0; i < pos; i++) {
            this._finites[i].reset(0);
        }
        this._finites[pos].createNext();
        return true;
    },

    // create next infinite pattern
    "_createInfinite": function() {
        // search for infinite pattern that has not yet finished
        var length = this._infinites.length;
        var pos = 0;
        while (pos < length && this._infinites[pos].finished()) {
            pos++;
        }
        if (pos == length) {
            // not found
            this._index++;
            if (this._divisors.length <= this._index) {
                return false;
            }

            // next cycle
            var cycles = this._divisors[this._index];
            for (var i = 0; i < length; i++) {
                this._infinites[i].reset(cycles[i]);
            }
        } else {
            // found
            var cycles = this._divisors[this._index];
            for (var i = 0; i < pos; i++) {
                this._infinites[i].reset(cycles[i]);
            }
            this._infinites[pos].createNext();
        }

        // initialize the finite patterns
        for (var i = 0; i < this._finites.length; i++) {
            this._finites[i].reset(0);
        }
        return true;
    },

}

// Factor iterator class
var FactorIterator = function(iterator, min, max) {
    // fields
    this._original = iterator;
    this._store = [];
    this._map = {};
    this._iterator = null;
    this._unlimited = (max < 0);
    this._min = parseInt(min, 10);
    if (this._min < 0) {
        this._min = 0;
    }
    this._max = parseInt(max, 10);
    if (this._max < this._min) {
        this._max = this._min;
    }
    this._divisors = [];
    this._index = 0;

    // properties
    this.endless = (this._unlimited || this._original.endless);
}

// Factor iterator prototype
FactorIterator.prototype = {

    // reset fields
    "reset": function(cycle) {
        this._divisors = [];
        if (this._original.endless) {
            if (this._unlimited) {
                // both pattern and repeat count are infinite
                for (var i = 0; i <= cycle; i++) {
                    this._divisors.push([ this._min + cycle - i, i ]);
                }
            } else {
                // only pattern is infinite
                for (var i = this._min; i <= this._max; i++) {
                    this._divisors.push([ i, cycle ]);
                }
            }
        } else {
            if (this._unlimited) {
                // only repeat count is infinite
                this._divisors.push([ this._min + cycle, 0 ]);
            } else {
                // both pattern and repeat count are finite
                for (var i = this._min; i <= this._max; i++) {
                    this._divisors.push([ i, 0 ]);
                }
            }
        }

        // create a iterator class
        this._index = 0;
        this._getIterator(0);
    },

    // create next pattern
    "createNext": function() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        if (this._iterator.finished()) {
            this._index++;
            this._getIterator(this._index);
        } else {
            this._iterator.createNext();
        }
    },

    // get current pattern
    "getCurrent": function() {
        return this._iterator.getCurrent();
    },

    // get current pattern list
    "getPatterns": function() {
        // the last pattern
        var cycles = this._divisors[this._index];
        var last = cycles[0] - 1;
        if (last < 0) {
            return [];
        }
        return this._store[last].getPatterns();
    },

    // whether it is finished
    "finished": function() {
        // check the fields
        if (this._index < this._divisors.length - 1) {
            return false;
        }

        // whether current iterator is finished
        return this._iterator.finished();
    },

    // copy this instance
    "copy": function() {
        // get the number of iterations
        var max = this._max;
        if (this._unlimited) {
            max = -1;
        }

        // create a new instance
        var iterator = this._original.copy();
        return new FactorIterator(iterator, this._min, max);
    },

    // get iterator classes
    "_getIterator": function(index) {
        // check existing patterns
        var cycles = this._divisors[index];
        var iter = cycles[0];
        if (!this._map[iter]) {
            // not found
            for (var i = this._store.length; i < iter; i++) {
                this._store.push(this._original.copy());
            }

            // create the missing pattern
            this._map[iter] = new SequenceIterator(this._store.slice(0, iter));
        }

        // initialization for the iterator
        this._iterator = this._map[iter];
        this._iterator.reset(cycles[1]);
    },

}

// Finite iterator class
var FiniteIterator = function(texts) {
    // fields
    this._texts = texts.concat();
    this._last = this._texts.length - 1;
    this._step = 0;

    // properties
    this.endless = false;
}

// Finite iterator prototype
FiniteIterator.prototype = {

    // reset fields
    "reset": function(cycle) {
        this._step = 0;
    },

    // create next pattern
    "createNext": function() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        this._step++;
    },

    // get current pattern
    "getCurrent": function() {
        if (this._step < 0 || this._last < this._step) {
            return "";
        } else {
            return this._texts[this._step];
        }
    },

    // get current pattern list
    "getPatterns": function() {
        return [];
    },

    // whether it is finished
    "finished": function() {
        return this._last <= this._step;
    },

    // copy this instance
    "copy": function() {
        return new FiniteIterator(this._texts);
    },

}

// Pattern creator class
var PatternCreator = function(iterator) {
    // fields
    this._iterator = iterator;
    this._interval = 1;
    this._block = 100;

    // events
    this.progressEvent = function(number, second) { };
    this.completeEvent = function(values, completed) { };
    this.cancelEvent = function() { return false; };
    this.acceptEvent = function(patterns) { };
}

// Pattern creator prototype
PatternCreator.prototype = {

    // start searching
    "start": function() {
        this._begin = Date.now();

        // reset fields
        this._number = 0;
        this._cycle = 0;
        this._iterator.reset(this._cycle);
        this.acceptEvent(this._iterator.getPatterns());

        // search
        setTimeout(this._execute.bind(this), this._interval);
    },

    // execute searching
    "_execute": function() {
        // set next end time
        var current = Date.now();
        var over = (current - this._begin) % this._block;
        var next = current - over + this._block;

        // run for a fixed amount of time
        var stopped = false;
        var num = 0;
        while (Date.now() < next) {
            num++;
            if (this._iterator.finished()) {
                // end the search
                if (!this._iterator.endless) {
                    stopped = true;
                    break;
                }
                this._cycle++;
                this._iterator.reset(this._cycle);
            } else {
                this._iterator.createNext();
            }

            // next time
            this.acceptEvent(this._iterator.getPatterns());
            if (this.cancelEvent()) {
                num++;
                stopped = true;
                break;
            }
        }

        // report of progress
        this._number += num;
        var second = (Date.now() - this._begin) / 1000;
        this.progressEvent(this._number, second);

        // whether it is stopped
        if (stopped) {
            var finished = !this._iterator.endless && this._iterator.finished();
            setTimeout(this.completeEvent, this._interval, finished);
            return;
        }

        // continue
        setTimeout(this._execute.bind(this), this._interval);
    },

}

// Pattern value class
var PatternValue = function(pattern) {
    // fields
    this._pattern = pattern.toString();
    this._properties = { "pattern": pattern };
    this._functions = {
        "length": this._getLength.bind(this),
        "reverse": this._getReverse.bind(this),
        "min": this._getMin.bind(this),
        "max": this._getMax.bind(this),
        "omission": this._getOmission.bind(this),
        "standard": this._getStandard.bind(this),
        "jugglable": this._isJugglable.bind(this),
        "valid": this._isValid.bind(this),
        "balls": this._getBalls.bind(this),
        "period": this._getPeriod.bind(this),
        "state": this._getState.bind(this),
        "int10": this._getInt10.bind(this),
        "int36": this._getInt36.bind(this),
    };
}

// Pattern value prototype
PatternValue.prototype = {

    // get the property
    "getProperty": function(name) {
        if (this._properties[name] == null) {
            var method = this._functions[name];
            if (method == null) {
                this._properties[name] = "";
            } else {
                this._properties[name] = method();
            }
        }
        return this._properties[name];
    },

    // get pattern length
    "_getLength": function() {
        return this._pattern.length;
    },

    // get reverse pattern
    "_getReverse": function() {
        return this._pattern.split("").reverse().join("");
    },

    // get minimum pattern
    "_getMin": function() {
        var target = this._pattern;
        if (target.length <= 1) {
            return target;
        }

        // get minimum character
        var min = target.charCodeAt(0);
        var index = 0;
        for (var i = 1; i < target.length; i++) {
            var code = target.charCodeAt(i);
            if (code < min) {
                min = code;
                index = i;
            }
        }

        // create a candidate string
        var candidates = this._getCandidates(target, index);
        return candidates[0];
    },

    // get maximum pattern
    "_getMax": function() {
        var target = this._pattern;
        if (target.length <= 1) {
            return target;
        }

        // get maximum character
        var max = target.charCodeAt(0);
        var index = 0;
        for (var i = 1; i < target.length; i++) {
            var code = target.charCodeAt(i);
            if (max < code) {
                max = code;
                index = i;
            }
        }

        // create a candidate string
        var candidates = this._getCandidates(target, index);
        return candidates[candidates.length - 1];
    },

    // get omission pattern
    "_getOmission": function() {
        return this._getOmissionText(this._pattern);
    },

    // get standard format
    "_getStandard": function() {
        return this._getOmissionText(this.getProperty("max"));
    },

    // get whether jugglable
    "_isJugglable": function() {
        var numbers = this._getNumbers();
        var jugglable = (0 < numbers.length);
        var drops = {};
        for (var i = 0; i < numbers.length; i++) {
            var index = numbers[i] + i;
            if (drops[index]) {
                jugglable = false;
                break;
            }
            drops[index] = true;
        }

        // convert to the number
        if (jugglable) {
            return 1;
        } else {
            return 0;
        }
    },

    // whether it is valid siteswap
    "_isValid": function() {
        var numbers = this._getNumbers();
        var valid = (0 < numbers.length);
        var drops = {};
        for (var i = 0; i < numbers.length; i++) {
            var index = (numbers[i] + i) % numbers.length;
            if (drops[index]) {
                valid = false;
                break;
            }
            drops[index] = true;
        }

        // convert to the number
        if (valid) {
            return 1;
        } else {
            return 0;
        }
    },

    // get the number of balls
    "_getBalls": function() {
        if (!this.getProperty("valid")) {
            return -1;
        }
        var numbers = this._getNumbers();
        var sum = function(acc, cur) { return acc + cur; };
        return numbers.reduce(sum, 0) / numbers.length;
    },

    // get period of the pattern
    "_getPeriod": function() {
        if (!this.getProperty("valid")) {
            return -1;
        }
        var numbers = this._getNumbers();
        return numbers.length;
    },

    // get the state number
    "_getState": function() {
        if (!this.getProperty("valid")) {
            return -1;
        }

        // calculate maximum reach
        var numbers = this._getNumbers();
        var max = 0;
        for (var i = 0; i < numbers.length; i++) {
            var index = numbers[i] + i;
            if (max < index) {
                max = index;
            }
        }
        if (max == 0) {
            return 0;
        }

        // expand a numeric array
        var count = Math.ceil(max / numbers.length);
        var expand = [];
        for (var i = 0; i < count; i++) {
            expand = expand.concat(numbers);
        }

        // calculate the drop points
        var drops = new Array(max);
        for (var i = 0; i < max; i++) {
            drops[i] = 0;
        }
        var length = expand.length;
        for (var i = 0; i < length; i++) {
            var index = expand[i] + i;
            if (length <= index) {
                drops[index - length] = 1;
            }
        }

        // get the state
        var value = parseInt(drops.reverse().join(""), 2);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    },

    // get base 10 value
    "_getInt10": function() {
        var value = PatternCommon.toInt(this._pattern, 10);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    },

    // get base 36 value
    "_getInt36": function() {
        var value = PatternCommon.toInt(this._pattern, 36);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    },

    // get candidate string
    "_getCandidates": function(text, index) {
        // first candidate
        var first = text.substring(index) + text.substring(0, index);
        var candidates = [ first ];
        var head = first.substring(0, 1);
        var parts = first.split(head);
        if (parts.length <= 2) {
            return candidates;
        }

        // second and subsequent candidates
        for (var i = 2; i < parts.length; i++) {
            parts.push(parts.splice(1, 1));
            candidates.push(parts.join(head));
        }
        candidates.sort();
        return candidates;
    },

    // get string abbreviation
    "_getOmissionText": function(text) {
        var length = text.length;
        var max = Math.floor(length / 2);
        var pos = 1;
        while (pos <= max) {
            // check from the first character to half the length
            if (length % pos == 0) {
                var sub = text.substring(0, pos);
                if ((new Array(length / pos + 1)).join(sub) == text) {
                    return sub;
                }
            }
            pos++;
        }
        return text;
    },

    // convert string to numeric array
    "_getNumbers": function() {
        if (this._numbers != null) {
            return this._numbers;
        }

        // create only when undefined
        this._numbers = [];
        var target = this.getProperty("omission");
        for (var i = 0; i < target.length; i++) {
            var number = PatternCommon.ALPHABET.indexOf(target[i]);
            if (0 <= number) {
                this._numbers.push(number);
            }
        }
        return this._numbers;
    },

}

