// Column number constants
var ColNum = {
    "NUMBER": 0,
    "TARGET": 1,
    "EXPECT": 2,
    "RESULT": 3,
}

// Controller class
var Controller = function() {
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
        var standard = document.getElementById("standard");
        var professional = document.getElementById("professional");
        this._function = new Map();
        this._function.set(standard, this._searchStandard.bind(this));
        this._function.set(professional, this._searchProfessional.bind(this));
        this._function.forEach(function(value, key) { key.addEventListener("click", this._start.bind(this), false); }, this);

        // associate buttons with table rows
        var patterns = document.getElementById("patterns");
        var queries = document.getElementById("queries");
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
        var search = this._function.get(this._button);
        var rows = this._rows.get(this._button);

        // execute the first test
        this._resetTable(rows);
        this._index = 1;
        search(rows[this._index]);
    },

    // set the table row numbers
    "_setRowNumbers": function(rows) {
        for (var i = 1; i < rows.length; i++) {
            var number = rows[i].cells[ColNum.NUMBER];
            number.innerText = i;
            number.className = "symbol";
        }
    },

    // reset table rows
    "_resetTable": function(rows) {
        for (var i = 1; i < rows.length; i++) {
            var result = rows[i].cells[ColNum.RESULT];
            result.innerText = "";
            result.className = "";
        }
    },

    // search in standard version
    "_searchStandard": function(row) {
        // preparation
        var pattern = row.cells[ColNum.TARGET].innerText;
        if (!row.cells[ColNum.EXPECT].innerText) {
            this._count = 0;
        } else {
            var expect = row.cells[ColNum.EXPECT].innerText.split(" ");
            this._count = expect.length;
        }
        this._actual = [];

        // pattern analysis
        var result = this._parser.tokenize(PatternCommon.toSmall(pattern));
        if (result.tokens == null) {
            this._setError(result.valid, result.invalid);
            return;
        }
        result = this._parser.parse(result.tokens);
        if (result.tree == null) {
            this._setError(result.valid, result.invalid);
            return;
        }

        // preparation for execution
        var creator = new PatternCreator(result.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showStandard.bind(this);
        creator.cancelEvent = this._cancelStandard.bind(this);
        creator.acceptEvent = this._acceptStandard.bind(this);

        // execution
        this._endless = result.tree.iterator.endless;
        this._stopTime = Date.now() + 3000;
        creator.start();
    },

    // search in professional version
    "_searchProfessional": function(row) {
        // preparation
        var query = row.cells[ColNum.TARGET].innerText;
        this._actual = [];

        // query analysis
        var result = this._ssql.tokenize(PatternCommon.toSmall(query));
        if (result.tokens == null) {
            this._setError(result.valid, result.invalid);
            return;
        }
        result = this._ssql.parse(result.tokens);
        if (result.tree == null) {
            this._setError(result.valid, result.invalid);
            return;
        }
        this._syntax = result.tree.value;

        // pattern analysis
        result = this._parser.tokenize(this._syntax.from);
        if (result.tokens == null) {
            this._setError(result.valid, result.invalid);
            return;
        }
        result = this._parser.parse(result.tokens);
        if (result.tree == null) {
            this._setError(result.valid, result.invalid);
            return;
        }

        // preparation for execution
        var creator = new PatternCreator(result.tree.iterator);
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
        var value = Math.floor(second * 10) / 10;
        var rows = this._rows.get(this._button);
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
        var method = function(acc, cur) { return acc + " " + cur.text; };
        var text = this._actual.reduce(method, "").substring(1);
        this._showResult(text);
    },

    // show the result string
    "_showResult": function(text) {
        // get the result string
        var rows = this._rows.get(this._button);
        var row = rows[this._index];
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
        var search = this._function.get(this._button);
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
        var value = new PatternValue(patterns[0]);
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
            var text = this._syntax.select.getText(patterns);
            var value = { "text": text, "patterns": patterns };
            if (this._syntax.select.distinct) {
                // excluding duplication
                var find = function(element) { return element.text == text; };
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
        var rows = this._rows.get(this._button);
        var result = rows[this._index].cells[ColNum.RESULT];
        result.innerText = "parsing failure: " + invalid;
        result.className = "error";
    },

}

// start the controller
new Controller();

