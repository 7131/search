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
    window.addEventListener("load", this._initialize.bind(this));
}

// Controller prototype
Controller.prototype = {

    // initialize the page
    "_initialize": function(e) {
        // associate buttons with search functions
        const standard = document.getElementById("standard");
        const professional = document.getElementById("professional");
        this._function = new Map();
        this._function.set(standard, this._searchStandard.bind(this));
        this._function.set(professional, this._searchProfessional.bind(this));
        this._function.forEach((val, key) => key.addEventListener("click", this._start.bind(this)));

        // associate buttons with table rows
        const patterns = document.getElementById("patterns");
        const queries = document.getElementById("queries");
        this._rows = new Map();
        this._rows.set(standard, patterns.rows);
        this._rows.set(professional, queries.rows);
        this._rows.forEach(this._setRowNumbers, this);
    },

    // start the selected tests
    "_start": function(e) {
        // initialize fields
        this._button = e.currentTarget;
        this._function.forEach((val, key) => key.disabled = true);
        const search = this._function.get(this._button);
        const rows = this._rows.get(this._button);

        // execute the first test
        this._resetTable(rows);
        this._errors = [];
        this._index = 1;
        search(rows[this._index]);
    },

    // set the table row numbers
    "_setRowNumbers": function(rows) {
        for (let i = 1; i < rows.length; i++) {
            const number = rows[i].cells[ColNum.NUMBER];
            number.textContent = i;
            number.classList.add("symbol");
        }

        // get the last row
        let last = rows[rows.length - 1];
        if (last.cells[ColNum.TARGET].textContent != "") {
            last = last.parentNode.appendChild(last.cloneNode(true));
        }
        last.cells[ColNum.NUMBER].textContent = "total";
        last.cells[ColNum.TARGET].textContent = "";
        last.cells[ColNum.EXPECT].textContent = "";
        last.cells[ColNum.RESULT].textContent = "";
    },

    // reset table rows
    "_resetTable": function(rows) {
        for (let i = 1; i < rows.length; i++) {
            const result = rows[i].cells[ColNum.RESULT];
            result.textContent = "";
            result.classList.remove("error");
        }
    },

    // search in standard version
    "_searchStandard": function(row) {
        // preparation
        const pattern = row.cells[ColNum.TARGET].innerText;
        if (row.cells[ColNum.EXPECT].textContent == "") {
            this._count = 0;
        } else {
            const expect = row.cells[ColNum.EXPECT].textContent.split(" ");
            this._count = expect.length;
        }
        this._actual = [];

        // pattern analysis
        const lex = this._parser.tokenize(PatternCommon.toSmall(pattern));
        if (lex.tokens == null) {
            this._setError(lex.invalid);
            return;
        }
        const syntax = this._parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this._setError(syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showStandard.bind(this);
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
            this._setError(ssql.invalid);
            return;
        }
        const pattern = this._ssql.parse(ssql.tokens);
        if (pattern.tree == null) {
            this._setError(pattern.invalid);
            return;
        }

        // semantic analysis
        const semantic = new SemanticAnalyzer();
        const result = semantic.validate(pattern.tree);
        if (result.message != "") {
            this._setError(result.message);
            return;
        }
        this._syntax = pattern.tree.value;

        // pattern analysis
        const lex = this._parser.tokenize(this._syntax.from);
        if (lex.tokens == null) {
            this._setError(lex.invalid);
            return;
        }
        const syntax = this._parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this._setError(syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showProfessional.bind(this);
        creator.acceptEvent = this._acceptProfessional.bind(this);

        // execution
        this._stopTime = Date.now() + 3000;
        creator.start();
    },

    // show the progress
    "_showProgress": function(number, second) {
        const value = Math.floor(second * 10) / 10;
        const rows = this._rows.get(this._button);
        rows[this._index].cells[ColNum.RESULT].textContent = value;
    },

    // show the result of standard version
    "_showStandard": function(completed) {
        let actual = this._actual;
        if (this._endless) {
            actual = actual.slice(0, this._count);
        }
        this._showResult(actual.join(" "));
    },

    // show the result of professional version
    "_showProfessional": function(completed) {
        // sort
        this._actual.sort(this._syntax.order.compare.bind(this._syntax.order));

        // display
        const text = this._actual.map(elem => elem.text).join(" ");
        this._showResult(text);
    },

    // show the result string
    "_showResult": function(text) {
        // get the result string
        const rows = this._rows.get(this._button);
        const row = rows[this._index];
        if (text == row.cells[ColNum.EXPECT].textContent) {
            row.cells[ColNum.RESULT].textContent = "OK";
        } else {
            row.cells[ColNum.RESULT].textContent = text;
            row.cells[ColNum.RESULT].classList.add("error");
            this._errors.push(this._index);
        }

        // execute the next test
        do {
            this._index++;
        } while (this._index < rows.length && rows[this._index].cells[ColNum.TARGET].textContent == "");
        if (this._index < rows.length) {
            const search = this._function.get(this._button);
            search(rows[this._index]);
            return;
        }

        // finished
        const last = rows[rows.length - 1];
        if (this._errors.length == 0) {
            last.cells[ColNum.RESULT].textContent = "All OK";
        } else {
            last.cells[ColNum.RESULT].textContent = `NG: ${this._errors.join()}`;
            last.cells[ColNum.RESULT].classList.add("error");
        }
        this._function.forEach((val, key) => key.disabled = false);
    },

    // acceptance process in standard version
    "_acceptStandard": function(patterns) {
        // check time limit
        if (this._stopTime <= Date.now()) {
            return false;
        }

        // create pattern value
        const value = new PatternValue(patterns[0]);
        if (value.getProperty("valid")) {
            this._actual.push(value.getProperty("pattern"));
        }
        return !this._endless || this._actual.length < 100;
    },

    // acceptance process in professional version
    "_acceptProfessional": function(patterns) {
        // check time limit
        if (this._stopTime <= Date.now()) {
            return false;
        }
        try {
            // symbol table
            const symbols = new SymbolTable(patterns);
            this._syntax.lets.forEach(symbols.setTerm, symbols);

            // acquisition condition
            if (!this._syntax.where.isValid(symbols)) {
                return true;
            }

            // display items
            const text = this._syntax.select.getText(symbols);
            const value = { "text": text, "symbols": symbols };
            if (this._syntax.select.distinct) {
                // excluding duplication
                if (0 < this._actual.filter(elem => elem.text == text).length) {
                    return true;
                }
            }
            this._actual.push(value);
            const limit = parseInt(this._syntax.limit.getText(symbols), 10);
            return limit <= 0 || this._actual.length < limit;
        } catch (e) {
            // error handling
            this._setError(e.message);
            return false;
        }
    },

    // set an error
    "_setError": function(message) {
        const rows = this._rows.get(this._button);
        const result = rows[this._index].cells[ColNum.RESULT];
        result.textContent = `parsing failure: ${message}`;
        result.classList.add("error");
        this._errors.push(this._index);

        // finished
        const last = rows[rows.length - 1];
        last.cells[ColNum.RESULT].textContent = `NG: ${this._errors.join()}`;
        last.cells[ColNum.RESULT].classList.add("error");
    },

}

// start the controller
new Controller();

