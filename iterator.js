// Object common to patterns
const PatternCommon = {

    // convert string to big integer
    "toBigInt": function(text, radix) {
        // check the arguments
        if (isNaN(radix) || radix < 2 || 36 < radix) {
            radix = 10;
        }

        // get a valid part from the beginning
        const numbers = "0123456789abcdefghijklmnopqrstuvwxyz".substring(0, radix);
        const match = new RegExp("^(\\+|\\-)?([" + numbers + "]+)").exec(text);
        if (!match) {
            return 0n;
        }

        // convert to integer
        let value = 0n;
        if (radix == 10) {
            value = BigInt(match[2]);
        } else {
            const multi = BigInt(radix);
            match[2].split("").forEach(elem => value = value * multi + BigInt(parseInt(elem, radix)));
        }
        if (match[1] == "-") {
            value = -value;
        }
        return value;
    },

    // convert to lowercase letters
    "toSmall": function(text) {
        const half = text.replace(/[\uFF01-\uFF5E]/g, PatternCommon._toHankaku);
        const quote = half.replace(/[\u201C\u201D]/g, "\"").replace("\u2018", "`").replace("\u2019", "'");
        const other = quote.replace("\u3000", " ").replace("\u301C", "~").replace("\uFFE5", "\u00A5");
        return other.toLowerCase();
    },

    // convert to half-width characters
    "_toHankaku": function(text) {
        return String.fromCharCode(text.charCodeAt(0) - 0xFEE0);
    },

}

// Selection iterator class
const SelectionIterator = function(iterators) {
    // fields
    this._originals = iterators;
    this._infinites = [];
    iterators.filter(elem => elem.endless).forEach(elem => this._infinites.push(elem));
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
        this._iterators.forEach(elem => elem.reset(cycle));
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
        const iterator = this._iterators[this._position];
        return [ iterator.getCurrent() ].concat(iterator.getPatterns());
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
        const iterators = [];
        this._originals.forEach(elem => iterators.push(elem.copy()));

        // create a new instance
        return new SelectionIterator(iterators);
    },

}

// Sequence iterator class
const SequenceIterator = function(iterators) {
    // fields
    this._originals = iterators;
    this._infinites = [];
    this._finites = [];
    iterators.filter(elem => elem.endless).forEach(elem => this._infinites.push(elem));
    iterators.filter(elem => !elem.endless).forEach(elem => this._finites.push(elem));
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
        this._finites.forEach(elem => elem.reset(0));

        // infinite pattern
        const length = this._infinites.length;
        this._divisors = this._getDivisors(length, cycle);
        this._index = 0;
        const cycles = this._divisors[this._index];
        for (let i = 0; i < length; i++) {
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
        let current = "";
        this._originals.forEach(elem => current += elem.getCurrent());
        return current;
    },

    // get current pattern list
    "getPatterns": function() {
        return this._originals.reduce((acc, cur) => acc.concat(cur.getPatterns()), []);
    },

    // whether it is finished
    "finished": function() {
        // check the fields
        if (this._index < this._divisors.length - 1) {
            return false;
        }

        // whether all iterators are finished
        let pos = 0;
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
        const iterators = [];
        this._originals.forEach(elem => iterators.push(elem.copy()));

        // create a new instance
        return new SequenceIterator(iterators);
    },

    // get divisor list
    "_getDivisors": function(division, total) {
        // check the arguments
        const divisors = [];
        if (division < 1 || total < 0) {
            return divisors;
        }

        // number of divisions is 1
        if (division == 1) {
            divisors.push([ total ]);
            return divisors;
        }

        // number of divisions is 2 or more
        for (let i = total; 0 <= i; i--) {
            for (const part of this._getDivisors(division - 1, total - i)) {
                part.unshift(i);
                divisors.push(part);
            }
        }
        return divisors;
    },

    // create next finite pattern
    "_createFinite": function() {
        // search for finite pattern that has not yet finished
        const length = this._finites.length;
        let pos = 0;
        while (pos < length && this._finites[pos].finished()) {
            pos++;
        }
        if (pos == length) {
            // not found
            return false;
        }

        // found
        for (let i = 0; i < pos; i++) {
            this._finites[i].reset(0);
        }
        this._finites[pos].createNext();
        return true;
    },

    // create next infinite pattern
    "_createInfinite": function() {
        // search for infinite pattern that has not yet finished
        const length = this._infinites.length;
        let pos = 0;
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
            const cycles = this._divisors[this._index];
            for (let i = 0; i < length; i++) {
                this._infinites[i].reset(cycles[i]);
            }
        } else {
            // found
            const cycles = this._divisors[this._index];
            for (let i = 0; i < pos; i++) {
                this._infinites[i].reset(cycles[i]);
            }
            this._infinites[pos].createNext();
        }

        // initialize the finite patterns
        this._finites.forEach(elem => elem.reset(0));
        return true;
    },

}

// Factor iterator class
const FactorIterator = function(iterator, min, max) {
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
                for (let i = 0; i <= cycle; i++) {
                    this._divisors.push([ this._min + cycle - i, i ]);
                }
            } else {
                // only pattern is infinite
                for (let i = this._min; i <= this._max; i++) {
                    this._divisors.push([ i, cycle ]);
                }
            }
        } else {
            if (this._unlimited) {
                // only repeat count is infinite
                this._divisors.push([ this._min + cycle, 0 ]);
            } else {
                // both pattern and repeat count are finite
                for (let i = this._min; i <= this._max; i++) {
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
        const cycles = this._divisors[this._index];
        const last = cycles[0] - 1;
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
        let max = this._max;
        if (this._unlimited) {
            max = -1;
        }

        // create a new instance
        const iterator = this._original.copy();
        return new FactorIterator(iterator, this._min, max);
    },

    // get iterator classes
    "_getIterator": function(index) {
        // check existing patterns
        const cycles = this._divisors[index];
        const iter = cycles[0];
        if (!this._map[iter]) {
            // not found
            for (let i = this._store.length; i < iter; i++) {
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
const FiniteIterator = function(texts) {
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
const PatternCreator = function(iterator) {
    // fields
    this._iterator = iterator;
    this._interval = 1;
    this._block = 100;

    // events
    this.progressEvent = function(number, second) { };
    this.completeEvent = function(completed) { };
    this.acceptEvent = function(patterns) { return true; };
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
        if (!this.acceptEvent(this._iterator.getPatterns())) {
            this.progressEvent(1, 0);
            this.completeEvent(!this._iterator.endless && this._iterator.finished());
            return;
        }

        // search
        setTimeout(this._execute.bind(this), this._interval);
    },

    // execute searching
    "_execute": function() {
        // set next end time
        const current = Date.now();
        const over = (current - this._begin) % this._block;
        const next = current - over + this._block;

        // run for a fixed amount of time
        let stopped = false;
        let num = 0;
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
            if (!this.acceptEvent(this._iterator.getPatterns())) {
                num++;
                stopped = true;
                break;
            }
        }

        // report of progress
        this._number += num;
        const second = (Date.now() - this._begin) / 1000;
        this.progressEvent(this._number, second);

        // whether it is stopped
        if (stopped) {
            const finished = !this._iterator.endless && this._iterator.finished();
            setTimeout(this.completeEvent, this._interval, finished);
            return;
        }

        // continue
        setTimeout(this._execute.bind(this), this._interval);
    },

}

// Pattern value class
const PatternValue = function(pattern) {
    // fields
    this._pattern = pattern.toString();
    this._properties = { "pattern": pattern };
    this._functions = {
        "length": this._getLength.bind(this),
        "sum": this._getSum.bind(this),
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
            const method = this._functions[name];
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

    // get the sum of heights
    "_getSum": function() {
        const letters = this._pattern.split("");
        const numbers = letters.map(elem => parseInt(elem, 36)).filter(elem => !isNaN(elem));
        return numbers.reduce((acc, cur) => acc + cur);
    },

    // get reverse pattern
    "_getReverse": function() {
        return this._pattern.split("").reverse().join("");
    },

    // get minimum pattern
    "_getMin": function() {
        const target = this._pattern;
        if (target.length <= 1) {
            return target;
        }

        // get minimum character
        let min = target.charCodeAt(0);
        let index = 0;
        for (let i = 1; i < target.length; i++) {
            const code = target.charCodeAt(i);
            if (code < min) {
                min = code;
                index = i;
            }
        }

        // create a candidate string
        const candidates = this._getCandidates(target, index);
        return candidates[0];
    },

    // get maximum pattern
    "_getMax": function() {
        const target = this._pattern;
        if (target.length <= 1) {
            return target;
        }

        // get maximum character
        let max = target.charCodeAt(0);
        let index = 0;
        for (let i = 1; i < target.length; i++) {
            const code = target.charCodeAt(i);
            if (max < code) {
                max = code;
                index = i;
            }
        }

        // create a candidate string
        const candidates = this._getCandidates(target, index);
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
        const numbers = this._getNumbers();
        const drops = {};
        let jugglable = (0 < numbers.length);
        for (let i = 0; i < numbers.length; i++) {
            const index = numbers[i] + i;
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
        const numbers = this._getNumbers();
        const drops = {};
        let valid = (0 < numbers.length);
        for (let i = 0; i < numbers.length; i++) {
            const index = (numbers[i] + i) % numbers.length;
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
        if (!this.getProperty("jugglable")) {
            return -1;
        }
        const numbers = this._getNumbers();
        if (this.getProperty("valid")) {
            // siteswap
            return numbers.reduce((acc, cur) => acc + cur) / numbers.length;
        } else {
            // not siteswap
            return numbers.filter((value, key) => numbers.length <= value + key).length;
        }
    },

    // get period of the pattern
    "_getPeriod": function() {
        if (!this.getProperty("valid")) {
            return -1;
        }
        const numbers = this._getNumbers();
        return numbers.length;
    },

    // get the state number
    "_getState": function() {
        if (!this.getProperty("jugglable")) {
            return -1;
        }

        // calculate maximum reach
        const numbers = this._getNumbers();
        let max = 0;
        for (let i = 0; i < numbers.length; i++) {
            const index = numbers[i] + i;
            if (max < index) {
                max = index;
            }
        }
        if (max == 0) {
            return 0;
        }

        // expand a numeric array
        let expand = numbers;
        if (this.getProperty("valid")) {
            expand = new Array(Math.ceil(max / numbers.length)).fill(numbers).flat();
        }

        // calculate the drop points
        const drops = new Array(max).fill(0);
        const length = expand.length;
        for (let i = 0; i < length; i++) {
            const index = expand[i] + i;
            if (length <= index) {
                drops[index - length] = 1;
            }
        }

        // get the state
        const value = parseInt(drops.reverse().join(""), 2);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    },

    // get base 10 value
    "_getInt10": function() {
        return PatternCommon.toBigInt(this._pattern, 10);
    },

    // get base 36 value
    "_getInt36": function() {
        return PatternCommon.toBigInt(this._pattern, 36);
    },

    // get candidate string
    "_getCandidates": function(text, index) {
        // first candidate
        const first = text.substring(index) + text.substring(0, index);
        const candidates = [ first ];
        const head = first.substring(0, 1);
        const parts = first.split(head);
        if (parts.length <= 2) {
            return candidates;
        }

        // second and subsequent candidates
        for (let i = 2; i < parts.length; i++) {
            parts.push(parts.splice(1, 1));
            candidates.push(parts.join(head));
        }
        candidates.sort();
        return candidates;
    },

    // get string abbreviation
    "_getOmissionText": function(text) {
        const length = text.length;
        const max = Math.floor(length / 2);
        let pos = 1;
        while (pos <= max) {
            // check from the first character to half the length
            if (length % pos == 0) {
                const sub = text.substring(0, pos);
                if (sub.repeat(length / pos) == text) {
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
        const letters = this.getProperty("omission").split("");
        this._numbers = letters.map(elem => parseInt(elem, 36)).filter(elem => !isNaN(elem));
        return this._numbers;
    },

}

