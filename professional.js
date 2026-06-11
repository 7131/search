// Controller class
class Controller {
    #query;
    #startButton;
    #stopButton;
    #messageArea;
    #resultTotal;
    #resultCount;
    #resultTime;
    #resultArea;
    #syntax;
    #parser = new Parser(PatternGrammar, PatternConverter);
    #ssql = new Parser(QueryGrammar, QueryConverter);
    #values = [];

    // constructor
    constructor() {
        window.addEventListener("load", this.#initialize.bind(this));
    }

    // initialize the private fields
    #initialize(e) {
        // input elements
        this.#query = document.getElementById("query");
        this.#startButton = document.getElementById("start");
        this.#stopButton = document.getElementById("stop");
        this.#stopButton.disabled = true;
        this.#messageArea = document.getElementById("message_area");

        // result elements
        this.#resultTotal = document.getElementById("result_total");
        this.#resultCount = document.getElementById("result_count");
        this.#resultTime = document.getElementById("result_time");
        this.#resultArea = document.getElementById("result_area");

        // events
        this.#startButton.addEventListener("click", this.#start.bind(this));
        this.#stopButton.addEventListener("click", this.#stop.bind(this));
    }

    // "Start" button process
    #start(e) {
        // clear display
        this.#values = [];
        this.#messageArea.textContent = "";
        this.#resultArea.textContent = "";
        this.#showProgress(0, 0);

        // query analysis
        const ssql = this.#ssql.tokenize(PatternCommon.toSmall(this.#query.value));
        if (ssql.tokens == null) {
            this.#setError(ssql.valid, ssql.invalid, "SsQL error");
            return;
        }
        const pattern = this.#ssql.parse(ssql.tokens);
        if (pattern.tree == null) {
            this.#setError(pattern.valid, pattern.invalid, "SsQL error");
            return;
        }

        // semantic analysis
        const semantic = new SemanticAnalyzer();
        const result = semantic.validate(pattern.tree);
        if (result.message != "") {
            this.#setError(result.valid, result.invalid, result.message);
            return;
        }
        this.#syntax = pattern.tree.value;

        // pattern analysis
        const lex = this.#parser.tokenize(this.#syntax.from);
        if (lex.tokens == null) {
            this.#setError(lex.valid, lex.invalid, "pattern error");
            return;
        }
        const syntax = this.#parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this.#setError(syntax.valid, syntax.invalid, "pattern error");
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this.#showProgress.bind(this);
        creator.completeEvent = this.#showResult.bind(this);
        creator.acceptEvent = this.#accept.bind(this);

        // execution
        this.#startButton.disabled = true;
        this.#stopButton.disabled = false;
        creator.start();
    }

    // "Stop" button process
    #stop(e) {
        this.#stopButton.disabled = true;
    }

    // show the progress
    #showProgress(number, second) {
        this.#resultTotal.textContent = number.toLocaleString();
        this.#resultCount.textContent = this.#values.length.toLocaleString();
        this.#resultTime.textContent = Math.floor(second * 10 + 0.5) / 10;
    }

    // show the result
    #showResult(completed) {
        // title
        const h2 = document.createElement("h2");
        h2.textContent = "Result";
        this.#resultArea.appendChild(h2);
        if (!Array.isArray(this.#values)) {
            this.#startButton.disabled = false;
            this.#stopButton.disabled = true;
            return;
        }

        // sort
        this.#values.sort(this.#syntax.order.compare.bind(this.#syntax.order));

        // list
        const ul = document.createElement("ul");
        for (const value of this.#values) {
            const li = document.createElement("li");
            li.textContent = value.text;
            ul.appendChild(li);
        }
        this.#resultArea.appendChild(ul);
        this.#startButton.disabled = false;
        this.#stopButton.disabled = true;
    }

    // accept pattern
    #accept(patterns) {
        // whether it was canceled
        if (this.#stopButton.disabled) {
            return false;
        }
        try {
            // symbol table
            const symbols = new SymbolTable(patterns);
            this.#syntax.lets.forEach(symbols.setTerm, symbols);

            // acquisition condition
            if (!this.#syntax.where.isValid(symbols)) {
                return true;
            }

            // display items
            const text = this.#syntax.select.getText(symbols);
            const value = { "text": text, "symbols": symbols };
            if (this.#syntax.select.distinct) {
                // excluding duplication
                if (0 < this.#values.filter(elem => elem.text == text).length) {
                    return true;
                }
            }
            this.#values.push(value);
            const limit = parseInt(this.#syntax.limit.getText(symbols), 10);
            return limit <= 0 || this.#values.length < limit;
        } catch (e) {
            // error handling
            this.#setError("", e.message, "execution error");
            this.#stopButton.disabled = true;
            return false;
        }
    }

    // set an error
    #setError(valid, invalid, title) {
        // check the arguments
        if (0 < valid.length && 0 < invalid.length) {
            valid = `OK: ${valid}`;
            invalid = `NG: ${invalid}`;
        }

        // display items
        const head = document.createElement("div");
        const ok = document.createElement("div");
        const ng = document.createElement("div");
        head.textContent = title;
        head.classList.add("error");
        ok.textContent = valid;
        ng.textContent = invalid;
        ng.classList.add("error");
        this.#messageArea.textContent = "";
        this.#messageArea.appendChild(head);
        this.#messageArea.appendChild(ok);
        this.#messageArea.appendChild(ng);
    }

}

// start the controller
new Controller();

