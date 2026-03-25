// Test base class
class TestBase extends TestTable {
    #errors = [];

    // constructor
    constructor(id, body, data) {
        super(id, body);
        super.create(data);
        this.parser = new Parser(PatternGrammar, PatternConverter);
        this.index = 0;
        this.stopTime = 0;
        this.actual = [];
    }

    // test start
    start(method) {
        super.clearCol("result");
        this.#errors = [];
        this.index = 0;
        this.search(super.getText(this.index, "params"));
    }

    // execute search (template)
    search(pattern) {
    }

    // show the progress
    progress(number, second) {
        const value = Math.floor(second * 10) / 10;
        super.setText(this.index, "result", value);
    }

    // acceptance process (template)
    accept(patterns) {
        return false;
    }

    // completion process (template)
    complete(completed) {
    }

    // show the result string
    showResult(text) {
        if (text == super.getText(this.index, "expect")) {
            super.setText(this.index, "result", "OK");
        } else {
            super.setText(this.index, "result", text, "error");
            this.#errors.push(this.index + 1);
        }

        // execute the next test
        this.index++;
        if (this.index < this.dataCount) {
            this.search(super.getText(this.index, "params"));
            return;
        }

        // finished
        if (this.#errors.length == 0) {
            super.setFoot("result", "All OK");
        } else {
            super.setFoot("result", `NG: ${this.#errors.join()}`, "error");
        }
        if (typeof this.completeEvent == "function") {
            this.completeEvent();
        }
    }

    // set an error
    setError(message) {
        this.#errors.push(this.index + 1);
        super.setText(this.index, "result", `parsing failure: ${message}`, "error");
        super.setFoot("result", `NG: ${this.#errors.join()}`, "error");
    }

}

// Standard version test class
class StandardTest extends TestBase {
    #endless = false;
    #count = 0;

    // constructor
    constructor(id, body) {
        super(id, body, StandardData);
    }

    // search
    search(pattern) {
        const expect = super.getText(this.index, "expect");
        this.#count = expect.split(" ").length;
        this.actual = [];

        // pattern analysis
        const lex = this.parser.tokenize(PatternCommon.toSmall(pattern));
        if (lex.tokens == null) {
            super.setError(lex.invalid);
            return;
        }
        const syntax = this.parser.parse(lex.tokens);
        if (syntax.tree == null) {
            super.setError(syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = super.progress.bind(this);
        creator.acceptEvent = this.accept.bind(this);
        creator.completeEvent = this.complete.bind(this);

        // execution
        this.#endless = syntax.tree.iterator.endless;
        this.stopTime = Date.now() + 3000;
        creator.start();
    }

    // acceptance process
    accept(patterns) {
        if (this.stopTime <= Date.now()) {
            return false;
        }

        // create pattern value
        const value = new PatternValue(patterns[0]);
        if (value.getProperty("valid")) {
            this.actual.push(value.getProperty("pattern"));
        }
        return !this.#endless || this.actual.length < 100;
    }

    // completion process
    complete(completed) {
        if (this.#endless) {
            this.actual = this.actual.slice(0, this.#count);
        }
        super.showResult(this.actual.join(" "));
    }

}

// Professional version test class
class ProfessionalTest extends TestBase {
    #syntax;
    #ssql = new Parser(QueryGrammar, QueryConverter);

    // constructor
    constructor(id, body) {
        super(id, body, ProfessionalData);
    }

    // search
    search(pattern) {
        this.actual = [];

        // query analysis
        const ssql = this.#ssql.tokenize(PatternCommon.toSmall(pattern));
        if (ssql.tokens == null) {
            super.setError(ssql.invalid);
            return;
        }
        const query = this.#ssql.parse(ssql.tokens);
        if (query.tree == null) {
            super.setError(query.invalid);
            return;
        }

        // semantic analysis
        const semantic = new SemanticAnalyzer();
        const result = semantic.validate(query.tree);
        if (result.message != "") {
            super.setError(result.message);
            return;
        }
        this.#syntax = query.tree.value;

        // pattern analysis
        const lex = this.parser.tokenize(this.#syntax.from);
        if (lex.tokens == null) {
            super.setError(lex.invalid);
            return;
        }
        const syntax = this.parser.parse(lex.tokens);
        if (syntax.tree == null) {
            super.setError(syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = super.progress.bind(this);
        creator.acceptEvent = this.accept.bind(this);
        creator.completeEvent = this.complete.bind(this);

        // execution
        this.stopTime = Date.now() + 3000;
        creator.start();
    }

    // acceptance process
    accept(patterns) {
        if (this.stopTime <= Date.now()) {
            return false;
        }
        try {
            // symbol table
            const symbols = new SymbolTable(patterns);
            this.#syntax.lets.forEach(symbols.setTerm, symbols);
            if (!this.#syntax.where.isValid(symbols)) {
                return true;
            }

            // display items
            const text = this.#syntax.select.getText(symbols);
            const value = { "text": text, "symbols": symbols };
            if (this.#syntax.select.distinct) {
                // excluding duplication
                if (0 < this.actual.filter(elem => elem.text == text).length) {
                    return true;
                }
            }
            this.actual.push(value);
            const limit = parseInt(this.#syntax.limit.getText(symbols), 10);
            return limit <= 0 || this.actual.length < limit;
        } catch (e) {
            super.setError(e.message);
            return false;
        }
    }

    // completion process
    complete(completed) {
        this.actual.sort(this.#syntax.order.compare.bind(this.#syntax.order));
        const text = this.actual.map(elem => elem.text).join(" ");
        super.showResult(text);
    }

}

// Controller class
class Controller {
    #all;
    #tests = { "standard": StandardTest, "professional": ProfessionalTest };
    #buttons = new Map();

    // constructor
    constructor() {
        window.addEventListener("load", this.#initialize.bind(this));
    }

    // initialize the page
    #initialize(e) {
        for (const id in this.#tests) {
            const section = document.getElementById(id);

            // get table
            const table = section.querySelector("table");
            if (table == null || table.tBodies.length == 0) {
                continue;
            }
            const test = this.#tests[id];
            const instance = new test(id, table.tBodies[0]);
            instance.completeEvent = this.#showButtons.bind(this);

            // get button
            const button = section.querySelector("button");
            button.addEventListener("click", this.#executeTest.bind(this));
            this.#buttons.set(button, instance);
        }

        // run all
        this.#all = document.getElementById("all");
        this.#all.addEventListener("click", this.#executeAll.bind(this));
    }

    // execute all tests
    #executeAll(e) {
        this.#all.disabled = true;
        this.#buttons.keys().forEach(elem => elem.disabled = true);
        for (const instance of this.#buttons.values()) {
            instance.start();
        }
    }

    // execute a test
    #executeTest(e) {
        const button = e.currentTarget;
        button.disabled = true;
        const instance = this.#buttons.get(button);
        instance.start();
    }

    // show the buttons
    #showButtons() {
        this.#buttons.keys().forEach(elem => elem.disabled = false);
        this.#all.disabled = false;
    }

}

// start the controller
new Controller();

