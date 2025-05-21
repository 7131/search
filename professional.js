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

    // initialize the private fields
    "_initialize": function(e) {
        // input elements
        this._query = document.getElementById("query");
        this._startButton = document.getElementById("start");
        this._stopButton = document.getElementById("stop");
        this._stopButton.disabled = true;
        this._messageArea = document.getElementById("message_area");

        // result elements
        this._resultTotal = document.getElementById("result_total");
        this._resultCount = document.getElementById("result_count");
        this._resultTime = document.getElementById("result_time");
        this._resultArea = document.getElementById("result_area");

        // events
        this._startButton.addEventListener("click", this._start.bind(this));
        this._stopButton.addEventListener("click", this._stop.bind(this));
    },

    // "Start" button process
    "_start": function(e) {
        // clear display
        this._values = [];
        this._messageArea.innerHTML = "";
        this._resultArea.innerHTML = "";
        this._showProgress(0, 0);

        // query analysis
        const ssql = this._ssql.tokenize(PatternCommon.toSmall(this._query.value));
        if (ssql.tokens == null) {
            this._setError(ssql.valid, ssql.invalid, "SsQL error");
            return;
        }
        const pattern = this._ssql.parse(ssql.tokens);
        if (pattern.tree == null) {
            this._setError(pattern.valid, pattern.invalid, "SsQL error");
            return;
        }

        // semantic analysis
        const semantic = new SemanticAnalyzer();
        const result = semantic.validate(pattern.tree);
        if (result.message != "") {
            this._setError(result.valid, result.invalid, result.message);
            return;
        }
        this._syntax = pattern.tree.value;

        // pattern analysis
        const lex = this._parser.tokenize(this._syntax.from);
        if (lex.tokens == null) {
            this._setError(lex.valid, lex.invalid, "pattern error");
            return;
        }
        const syntax = this._parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this._setError(syntax.valid, syntax.invalid, "pattern error");
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showResult.bind(this);
        creator.acceptEvent = this._accept.bind(this);

        // execution
        this._startButton.disabled = true;
        this._stopButton.disabled = false;
        creator.start();
    },

    // "Stop" button process
    "_stop": function(e) {
        this._stopButton.disabled = true;
    },

    // show the progress
    "_showProgress": function(number, second) {
        this._resultTotal.innerText = number.toLocaleString();
        this._resultCount.innerText = this._values.length.toLocaleString();
        this._resultTime.innerText = Math.floor(second * 10 + 0.5) / 10;
    },

    // show the result
    "_showResult": function(completed) {
        // title
        const h2 = document.createElement("h2");
        h2.innerText = "Result";
        this._resultArea.appendChild(h2);
        if (!Array.isArray(this._values)) {
            this._startButton.disabled = false;
            this._stopButton.disabled = true;
            return;
        }

        // sort
        this._values.sort(this._syntax.order.compare.bind(this._syntax.order));

        // list
        const ul = document.createElement("ul");
        for (const value of this._values) {
            const li = document.createElement("li");
            li.innerText = value.text;
            ul.appendChild(li);
        }
        this._resultArea.appendChild(ul);
        this._startButton.disabled = false;
        this._stopButton.disabled = true;
    },

    // accept pattern
    "_accept": function(patterns) {
        // whether it was canceled
        if (this._stopButton.disabled) {
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
                if (0 < this._values.filter(elem => elem.text == text).length) {
                    return true;
                }
            }
            this._values.push(value);
            const limit = parseInt(this._syntax.limit.getText(symbols), 10);
            return limit <= 0 || this._values.length < limit;
        } catch (e) {
            // error handling
            this._setError("", e.message, "execution error");
            this._stopButton.disabled = true;
            return false;
        }
    },

    // set an error
    "_setError": function(valid, invalid, title) {
        // check the arguments
        if (0 < valid.length && 0 < invalid.length) {
            valid = "OK : " + valid;
            invalid = "NG : " + invalid;
        }

        // display items
        const head = document.createElement("div");
        const ok = document.createElement("div");
        const ng = document.createElement("div");
        head.innerHTML = title;
        head.classList.add("error");
        ok.innerHTML = valid;
        ng.innerHTML = invalid;
        ng.classList.add("error");
        this._messageArea.innerHTML = "";
        this._messageArea.appendChild(head);
        this._messageArea.appendChild(ok);
        this._messageArea.appendChild(ng);
    },

}

// start the controller
new Controller();

