// Object common to patterns
class PatternCommon {

    // convert string to big integer
    static toBigInt(text, radix) {
        // check the arguments
        if (isNaN(radix) || radix < 2 || 36 < radix) {
            radix = 10;
        }

        // get a valid part from the beginning
        const numbers = "0123456789abcdefghijklmnopqrstuvwxyz".substring(0, radix);
        const match = new RegExp(`^(\\+|\\-)?([${numbers}]+)`).exec(text);
        if (!match) {
            return 0n;
        }

        // convert to integer
        let value;
        if (radix == 10) {
            value = BigInt(match[2]);
        } else {
            const multi = BigInt(radix);
            value = match[2].split("").reduce((acc, cur) => acc * multi + BigInt(parseInt(cur, radix)), 0n);
        }
        if (match[1] == "-") {
            value = -value;
        }
        return value;
    }

    // convert to lowercase letters
    static toSmall(text) {
        const half = text.replace(/[\uFF01-\uFF5E]/g, PatternCommon.#toHankaku);
        const quote = half.replace(/[\u201C\u201D]/g, "\"").replace("\u2018", "`").replace("\u2019", "'");
        const other = quote.replace("\u3000", " ").replace("\u301C", "~").replace("\uFFE5", "\u00A5");
        return other.toLowerCase();
    }

    // convert to half-width characters
    static #toHankaku(text) {
        return String.fromCharCode(text.charCodeAt(0) - 0xFEE0);
    }

}

// Selection iterator class
class SelectionIterator {
    #originals;
    #infinites;
    #iterators;
    #position = 0;

    // constructor
    constructor(iterators) {
        // fields
        this.#originals = iterators;
        this.#infinites = iterators.filter(elem => elem.endless);
        this.#iterators = this.#originals;

        // properties
        this.endless = (0 < this.#infinites.length);
    }

    // reset fields
    reset(cycle) {
        if (cycle == 0) {
            this.#iterators = this.#originals;
        } else {
            this.#iterators = this.#infinites;
        }
        this.#position = 0;

        // initialization for each iterator
        this.#iterators.forEach(elem => elem.reset(cycle));
    }

    // create next pattern
    createNext() {
        // whether it is finished
        if (this.finished()) {
            return;
        }
        if (this.#iterators.length <= this.#position) {
            return;
        }

        // next pattern
        if (this.#iterators[this.#position].finished()) {
            this.#position++;
        } else {
            this.#iterators[this.#position].createNext();
        }
    }

    // get current pattern
    getCurrent() {
        if (this.#iterators.length <= this.#position) {
            return "";
        } else {
            return this.#iterators[this.#position].getCurrent();
        }
    }

    // get current pattern list
    getPatterns() {
        if (this.#iterators.length <= this.#position) {
            return [];
        }
        const iterator = this.#iterators[this.#position];
        return [ iterator.getCurrent() ].concat(iterator.getPatterns());
    }

    // whether it is finished
    finished() {
        // check the fields
        if (this.#position < this.#iterators.length - 1) {
            return false;
        }
        if (this.#iterators.length <= this.#position) {
            return true;
        }

        // whether the last iterator is finished
        return this.#iterators[this.#position].finished();
    }

    // copy this instance
    copy() {
        return new SelectionIterator(this.#originals.map(elem => elem.copy()));
    }

}

// Sequence iterator class
class SequenceIterator {
    #originals;
    #infinites;
    #finites;
    #divisors = [];
    #index = 0;

    // constructor
    constructor(iterators) {
        // fields
        this.#originals = iterators;
        this.#infinites = iterators.filter(elem => elem.endless);
        this.#finites = iterators.filter(elem => !elem.endless);

        // properties
        this.endless = (0 < this.#infinites.length);
    }

    // reset fields
    reset(cycle) {
        // finite pattern
        this.#finites.forEach(elem => elem.reset(0));

        // infinite pattern
        this.#divisors = this.#getDivisors(this.#infinites.length, cycle);
        this.#index = 0;
        const cycles = this.#divisors[this.#index];
        this.#infinites.forEach((val, idx) => val.reset(cycles[idx]));
    }

    // create next pattern
    createNext() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        if (!this.#createFinite()) {
            this.#createInfinite();
        }
    }

    // get current pattern
    getCurrent() {
        return this.#originals.map(elem => elem.getCurrent()).join("");
    }

    // get current pattern list
    getPatterns() {
        return this.#originals.map(elem => elem.getPatterns()).flat();
    }

    // whether it is finished
    finished() {
        // check the fields
        if (this.#index < this.#divisors.length - 1) {
            return false;
        }

        // whether all iterators are finished
        let pos = 0;
        while (pos < this.#originals.length) {
            if (!this.#originals[pos].finished()) {
                return false;
            }
            pos++;
        }
        return true;
    }

    // copy this instance
    copy() {
        return new SequenceIterator(this.#originals.map(elem => elem.copy()));
    }

    // get divisor list
    #getDivisors(division, total) {
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
            for (const part of this.#getDivisors(division - 1, total - i)) {
                part.unshift(i);
                divisors.push(part);
            }
        }
        return divisors;
    }

    // create next finite pattern
    #createFinite() {
        // search for finite pattern that has not yet finished
        const length = this.#finites.length;
        let pos = 0;
        while (pos < length && this.#finites[pos].finished()) {
            pos++;
        }
        if (pos == length) {
            // not found
            return false;
        }

        // found
        this.#finites.slice(0, pos).forEach(elem => elem.reset(0));
        this.#finites[pos].createNext();
        return true;
    }

    // create next infinite pattern
    #createInfinite() {
        // search for infinite pattern that has not yet finished
        const length = this.#infinites.length;
        let pos = 0;
        while (pos < length && this.#infinites[pos].finished()) {
            pos++;
        }
        if (pos == length) {
            // not found
            this.#index++;
            if (this.#divisors.length <= this.#index) {
                return false;
            }

            // next cycle
            const cycles = this.#divisors[this.#index];
            this.#infinites.forEach((val, idx) => val.reset(cycles[idx]));
        } else {
            // found
            const cycles = this.#divisors[this.#index];
            this.#infinites.slice(0, pos).forEach((val, idx) => val.reset(cycles[idx]));
            this.#infinites[pos].createNext();
        }

        // initialize the finite patterns
        this.#finites.forEach(elem => elem.reset(0));
        return true;
    }

}

// Factor iterator class
class FactorIterator {
    #original;
    #unlimited;
    #min;
    #max;
    #store = [];
    #map = {};
    #iterator = null;
    #divisors = [];
    #index = 0;

    // constructor
    constructor(iterator, min, max) {
        // fields
        this.#original = iterator;
        this.#unlimited = (max < 0);
        this.#min = parseInt(min, 10);
        if (this.#min < 0) {
            this.#min = 0;
        }
        this.#max = parseInt(max, 10);
        if (this.#max < this.#min) {
            this.#max = this.#min;
        }

        // properties
        this.endless = (this.#unlimited || this.#original.endless);
    }

    // reset fields
    reset(cycle) {
        this.#divisors = [];
        if (this.#original.endless) {
            if (this.#unlimited) {
                // both pattern and repeat count are infinite
                for (let i = 0; i <= cycle; i++) {
                    this.#divisors.push([ this.#min + cycle - i, i ]);
                }
            } else {
                // only pattern is infinite
                for (let i = this.#min; i <= this.#max; i++) {
                    this.#divisors.push([ i, cycle ]);
                }
            }
        } else {
            if (this.#unlimited) {
                // only repeat count is infinite
                this.#divisors.push([ this.#min + cycle, 0 ]);
            } else {
                // both pattern and repeat count are finite
                for (let i = this.#min; i <= this.#max; i++) {
                    this.#divisors.push([ i, 0 ]);
                }
            }
        }

        // create a iterator class
        this.#index = 0;
        this.#getIterator(0);
    }

    // create next pattern
    createNext() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        if (this.#iterator.finished()) {
            this.#index++;
            this.#getIterator(this.#index);
        } else {
            this.#iterator.createNext();
        }
    }

    // get current pattern
    getCurrent() {
        return this.#iterator.getCurrent();
    }

    // get current pattern list
    getPatterns() {
        // the last pattern
        const cycles = this.#divisors[this.#index];
        const last = cycles[0] - 1;
        if (last < 0) {
            return [];
        }
        return this.#store[last].getPatterns();
    }

    // whether it is finished
    finished() {
        // check the fields
        if (this.#index < this.#divisors.length - 1) {
            return false;
        }

        // whether current iterator is finished
        return this.#iterator.finished();
    }

    // copy this instance
    copy() {
        // get the number of iterations
        let max = this.#max;
        if (this.#unlimited) {
            max = -1;
        }

        // create a new instance
        const iterator = this.#original.copy();
        return new FactorIterator(iterator, this.#min, max);
    }

    // get iterator classes
    #getIterator(index) {
        // check existing patterns
        const cycles = this.#divisors[index];
        const iter = cycles[0];
        if (!this.#map[iter]) {
            // not found
            for (let i = this.#store.length; i < iter; i++) {
                this.#store.push(this.#original.copy());
            }

            // create the missing pattern
            this.#map[iter] = new SequenceIterator(this.#store.slice(0, iter));
        }

        // initialization for the iterator
        this.#iterator = this.#map[iter];
        this.#iterator.reset(cycles[1]);
    }

}

// Finite iterator class
class FiniteIterator {
    #texts;
    #last;
    #step = 0;

    // constructor
    constructor(texts) {
        // fields
        this.#texts = texts.concat();
        this.#last = this.#texts.length - 1;

        // properties
        this.endless = false;
    }

    // reset fields
    reset(cycle) {
        this.#step = 0;
    }

    // create next pattern
    createNext() {
        // whether it is finished
        if (this.finished()) {
            return;
        }

        // next pattern
        this.#step++;
    }

    // get current pattern
    getCurrent() {
        if (this.#step < 0 || this.#last < this.#step) {
            return "";
        } else {
            return this.#texts[this.#step];
        }
    }

    // get current pattern list
    getPatterns() {
        return [];
    }

    // whether it is finished
    finished() {
        return this.#last <= this.#step;
    }

    // copy this instance
    copy() {
        return new FiniteIterator(this.#texts);
    }

}

// Pattern creator class
class PatternCreator {
    #iterator;
    #begin;
    #number = 0;
    #cycle = 0;
    #interval = 1;
    #block = 100;

    // constructor
    constructor(iterator) {
        // fields
        this.#iterator = iterator;

        // events
        this.progressEvent = function (number, second) { };
        this.completeEvent = function (completed) { };
        this.acceptEvent = function (patterns) { return true; };
    }

    // start searching
    start() {
        this.#begin = Date.now();

        // reset fields
        this.#number = 0;
        this.#cycle = 0;
        this.#iterator.reset(this.#cycle);
        if (!this.acceptEvent(this.#iterator.getPatterns())) {
            this.progressEvent(1, 0);
            this.completeEvent(!this.#iterator.endless && this.#iterator.finished());
            return;
        }

        // search
        setTimeout(this.#execute.bind(this), this.#interval);
    }

    // execute searching
    #execute() {
        // set next end time
        const current = Date.now();
        const over = (current - this.#begin) % this.#block;
        const next = current - over + this.#block;

        // run for a fixed amount of time
        let stopped = false;
        let num = 0;
        while (Date.now() < next) {
            num++;
            if (this.#iterator.finished()) {
                // end the search
                if (!this.#iterator.endless) {
                    stopped = true;
                    break;
                }
                this.#cycle++;
                this.#iterator.reset(this.#cycle);
            } else {
                this.#iterator.createNext();
            }

            // next time
            if (!this.acceptEvent(this.#iterator.getPatterns())) {
                num++;
                stopped = true;
                break;
            }
        }

        // report of progress
        this.#number += num;
        const second = (Date.now() - this.#begin) / 1000;
        this.progressEvent(this.#number, second);

        // whether it is stopped
        if (stopped) {
            const finished = !this.#iterator.endless && this.#iterator.finished();
            setTimeout(this.completeEvent, this.#interval, finished);
            return;
        }

        // continue
        setTimeout(this.#execute.bind(this), this.#interval);
    }

}

// Pattern value class
class PatternValue {
    #pattern;
    #properties;
    #functions;
    #numbers;

    // constructor
    constructor(pattern) {
        // fields
        this.#pattern = pattern.toString();
        this.#properties = { "pattern": pattern };
        this.#functions = {
            "length": this.#getLength.bind(this),
            "sum": this.#getSum.bind(this),
            "reverse": this.#getReverse.bind(this),
            "min": this.#getMin.bind(this),
            "max": this.#getMax.bind(this),
            "omission": this.#getOmission.bind(this),
            "standard": this.#getStandard.bind(this),
            "jugglable": this.#isJugglable.bind(this),
            "valid": this.#isValid.bind(this),
            "balls": this.#getBalls.bind(this),
            "period": this.#getPeriod.bind(this),
            "state": this.#getState.bind(this),
            "int10": this.#getInt10.bind(this),
            "int36": this.#getInt36.bind(this),
        };
    }

    // get the property
    getProperty(name) {
        if (this.#properties[name] == null) {
            const method = this.#functions[name];
            if (method == null) {
                this.#properties[name] = "";
            } else {
                this.#properties[name] = method();
            }
        }
        return this.#properties[name];
    }

    // get pattern length
    #getLength() {
        return this.#pattern.length;
    }

    // get the sum of heights
    #getSum() {
        const letters = this.#pattern.split("");
        const numbers = letters.map(elem => parseInt(elem, 36)).filter(elem => !isNaN(elem));
        return numbers.reduce((acc, cur) => acc + cur);
    }

    // get reverse pattern
    #getReverse() {
        return this.#pattern.split("").reverse().join("");
    }

    // get minimum pattern
    #getMin() {
        const target = this.#pattern;
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
        const candidates = this.#getCandidates(target, index);
        return candidates[0];
    }

    // get maximum pattern
    #getMax() {
        const target = this.#pattern;
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
        const candidates = this.#getCandidates(target, index);
        return candidates[candidates.length - 1];
    }

    // get omission pattern
    #getOmission() {
        return this.#getOmissionText(this.#pattern);
    }

    // get standard format
    #getStandard() {
        return this.#getOmissionText(this.getProperty("max"));
    }

    // get whether jugglable
    #isJugglable() {
        const numbers = this.#getNumbers();
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
    }

    // whether it is valid siteswap
    #isValid() {
        const numbers = this.#getNumbers();
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
    }

    // get the number of balls
    #getBalls() {
        if (!this.getProperty("jugglable")) {
            return -1;
        }
        const numbers = this.#getNumbers();
        if (this.getProperty("valid")) {
            // siteswap
            return numbers.reduce((acc, cur) => acc + cur) / numbers.length;
        } else {
            // not siteswap
            return numbers.filter((value, key) => numbers.length <= value + key).length;
        }
    }

    // get period of the pattern
    #getPeriod() {
        if (!this.getProperty("valid")) {
            return -1;
        }
        const numbers = this.#getNumbers();
        return numbers.length;
    }

    // get the state number
    #getState() {
        if (!this.getProperty("jugglable")) {
            return -1;
        }

        // calculate maximum reach
        const numbers = this.#getNumbers();
        const max = numbers.reduce((acc, cur, idx) => Math.max(acc, cur + idx), 0);
        if (max == 0) {
            return 0;
        }

        // expand a numeric array
        let expand = numbers;
        if (this.getProperty("valid")) {
            expand = new Array(Math.ceil(max / numbers.length)).fill(numbers).flat();
        }
        const drops = new Array(expand.length + max).fill(0);
        expand.forEach((val, idx) => drops[val + idx] = 1);

        // get the state
        const value = parseInt(drops.slice(expand.length).reverse().join(""), 2);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

    // get base 10 value
    #getInt10() {
        return PatternCommon.toBigInt(this.#pattern, 10);
    }

    // get base 36 value
    #getInt36() {
        return PatternCommon.toBigInt(this.#pattern, 36);
    }

    // get candidate string
    #getCandidates(text, index) {
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
    }

    // get string abbreviation
    #getOmissionText(text) {
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
    }

    // convert string to numeric array
    #getNumbers() {
        if (this.#numbers != null) {
            return this.#numbers;
        }

        // create only when undefined
        const letters = this.getProperty("omission").split("");
        this.#numbers = letters.map(elem => parseInt(elem, 36)).filter(elem => !isNaN(elem));
        return this.#numbers;
    }

}

