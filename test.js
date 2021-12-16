// Column number constants
const ColNum = {
    "NUMBER": 0,
    "TARGET": 1,
    "EXPECT": 2,
    "RESULT": 3,
}

// Controller class
const Controller = function() {
    // fields
    this._parser = new Parser(PatternGrammar, PatternConverter);
    this._ssql = new Parser(QueryGrammar, QueryConverter);

    // events
    window.addEventListener("load", this._initialize.bind(this), false);
}

// Controller prototype
Controller.prototype = {

    // initialize the page
    "_initialize": function() {
        // associate buttons with search functions
        const standard = document.getElementById("standard");
        const professional = document.getElementById("professional");
        this._function = new Map();
        this._function.set(standard, this._searchStandard.bind(this));
        this._function.set(professional, this._searchProfessional.bind(this));
        this._function.forEach(function(value, key) { key.addEventListener("click", this._start.bind(this), false); }, this);

        // associate buttons with table rows
        const patterns = document.getElementById("patterns");
        const queries = document.getElementById("queries");
        this._rows = new Map();
        this._rows.set(standard, patterns.rows);
        this._rows.set(professional, queries.rows);
        this._rows.forEach(this._setRowNumbers);
    },

    // start the selected tests
    "_start": function(e) {
        // initialize fields
        this._button = e.currentTarget;
        this._button.disabled = true;
        const search = this._function.get(this._button);
        const rows = this._rows.get(this._button);

        // execute the first test
        this._resetTable(rows);
        this._index = 1;
        search(rows[this._index]);
    },

    // set the table row numbers
    "_setRowNumbers": function(rows) {
        for (let i = 1; i < rows.length; i++) {
            const number = rows[i].cells[ColNum.NUMBER];
            number.innerText = i;
            number.className = "symbol";
        }
    },

    // reset table rows
    "_resetTable": function(rows) {
        for (let i = 1; i < rows.length; i++) {
            const result = rows[i].cells[ColNum.RESULT];
            result.innerText = "";
            result.className = "";
        }
    },

    // search in standard version
    "_searchStandard": function(row) {
        // preparation
        const pattern = row.cells[ColNum.TARGET].innerText;
        if (!row.cells[ColNum.EXPECT].innerText) {
            this._count = 0;
        } else {
            const expect = row.cells[ColNum.EXPECT].innerText.split(" ");
            this._count = expect.length;
        }
        this._actual = [];

        // pattern analysis
        const lex = this._parser.tokenize(PatternCommon.toSmall(pattern));
        if (lex.tokens == null) {
            this._setError(lex.valid, lex.invalid);
            return;
        }
        const syntax = this._parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this._setError(syntax.valid, syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showStandard.bind(this);
        creator.cancelEvent = this._cancelStandard.bind(this);
        creator.acceptEvent = this._acceptStandard.bind(this);

        // execution
        this._endless = syntax.tree.iterator.endless;
        this._stopTime = Date.now() + 3000;
        creator.start();
    },

    // search in professional version
    "_searchProfessional": function(row) {
        // preparation
        const query = row.cells[ColNum.TARGET].innerText;
        this._actual = [];

        // query analysis
        const ssql = this._ssql.tokenize(PatternCommon.toSmall(query));
        if (ssql.tokens == null) {
            this._setError(ssql.valid, ssql.invalid);
            return;
        }
        const pattern = this._ssql.parse(ssql.tokens);
        if (pattern.tree == null) {
            this._setError(pattern.valid, pattern.invalid);
            return;
        }
        this._syntax = pattern.tree.value;

        // pattern analysis
        const lex = this._parser.tokenize(this._syntax.from);
        if (lex.tokens == null) {
            this._setError(lex.valid, lex.invalid);
            return;
        }
        const syntax = this._parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this._setError(syntax.valid, syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showProfessional.bind(this);
        creator.cancelEvent = this._cancelProfessional.bind(this);
        creator.acceptEvent = this._acceptProfessional.bind(this);

        // execution
        this._stopTime = Date.now() + 3000;
        creator.start();
    },

    // show the progress
    "_showProgress": function(number, second) {
        const value = Math.floor(second * 10) / 10;
        const rows = this._rows.get(this._button);
        rows[this._index].cells[ColNum.RESULT].innerText = value;
    },

    // show the result of standard version
    "_showStandard": function(completed) {
        this._showResult(this._actual.slice(0, this._count).join(" "));
    },

    // show the result of professional version
    "_showProfessional": function(completed) {
        // sort
        this._actual.sort(this._syntax.order.compare.bind(this._syntax.order));

        // display
        const method = function(acc, cur) { return acc + " " + cur.text; };
        const text = this._actual.reduce(method, "").substring(1);
        this._showResult(text);
    },

    // show the result string
    "_showResult": function(text) {
        // get the result string
        const rows = this._rows.get(this._button);
        const row = rows[this._index];
        if (text == row.cells[ColNum.EXPECT].innerText) {
            row.cells[ColNum.RESULT].innerText = "OK";
        } else {
            row.cells[ColNum.RESULT].innerText = text;
            row.cells[ColNum.RESULT].className = "error";
        }

        // execute the next test
        do {
            this._index++;
        } while (this._index < rows.length && !rows[this._index].cells[ColNum.TARGET].innerText);
        if (rows.length <= this._index) {
            // finished
            this._button.disabled = false;
            return;
        }
        const search = this._function.get(this._button);
        search(rows[this._index]);
    },

    // cancellation process in standard version
    "_cancelStandard": function() {
        if (this._endless && 100 <= this._actual.length) {
            return true;
        }
        if (this._stopTime <= Date.now()) {
            return true;
        }
        return false;
    },

    // cancellation process in professional version
    "_cancelProfessional": function() {
        if (0 < this._syntax.limit && this._syntax.limit <= this._actual.length) {
            return true;
        }
        if (this._stopTime <= Date.now()) {
            return true;
        }
        return false;
    },

    // acceptance process in standard version
    "_acceptStandard": function(patterns) {
        const value = new PatternValue(patterns[0]);
        if (value.getProperty("valid")) {
            this._actual.push(value.getProperty("pattern"));
        }
    },

    // acceptance process in professional version
    "_acceptProfessional": function(patterns) {
        try {
            // acquisition condition
            if (!this._syntax.where.isValid(patterns)) {
                return;
            }

            // display items
            const text = this._syntax.select.getText(patterns);
            const value = { "text": text, "patterns": patterns };
            if (this._syntax.select.distinct) {
                // excluding duplication
                const find = function(element) { return element.text == text; };
                if (0 < this._actual.filter(find).length) {
                    return;
                }
            }
            this._actual.push(value);
        } catch (e) {
            // error handling
            this._setError("", e.message);
        }
    },

    // set an error
    "_setError": function(valid, invalid) {
        const rows = this._rows.get(this._button);
        const result = rows[this._index].cells[ColNum.RESULT];
        result.innerText = "parsing failure: " + invalid;
        result.className = "error";
    },

}

// start the controller
new Controller();

