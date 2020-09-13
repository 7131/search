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

    // initialize the private fields
    "_initialize": function() {
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
        this._startButton.addEventListener("click", this._start.bind(this), false);
        this._stopButton.addEventListener("click", this._stop.bind(this), false);
    },

    // "Start" button process
    "_start": function(e) {
        // clear display
        this._values = [];
        this._messageArea.innerHTML = "";
        this._resultArea.innerHTML = "";
        this._showProgress(0, 0);

        // query analysis
        var result = this._ssql.tokenize(PatternCommon.toSmall(this._query.value));
        if (result.tokens == null) {
            this._setError(result.valid, result.invalid, "SsQL error");
            return;
        }
        result = this._ssql.parse(result.tokens);
        if (result.tree == null) {
            this._setError(result.valid, result.invalid, "SsQL error");
            return;
        }
        this._syntax = result.tree.value;

        // pattern analysis
        result = this._parser.tokenize(this._syntax.from);
        if (result.tokens == null) {
            this._setError(result.valid, result.invalid, "pattern error");
            return;
        }
        result = this._parser.parse(result.tokens);
        if (result.tree == null) {
            this._setError(result.valid, result.invalid, "pattern error");
            return;
        }

        // preparation for execution
        var creator = new PatternCreator(result.tree.iterator);
        creator.progressEvent = this._showProgress.bind(this);
        creator.completeEvent = this._showResult.bind(this);
        creator.cancelEvent = this._canceled.bind(this);
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
        var h2 = document.createElement("h2");
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
        var ul = document.createElement("ul");
        for (var i = 0; i < this._values.length; i++) {
            var li = document.createElement("li");
            li.innerText = this._values[i].text;
            ul.appendChild(li);
        }
        this._resultArea.appendChild(ul);
        this._startButton.disabled = false;
        this._stopButton.disabled = true;
    },

    // whether it was canceled
    "_canceled": function() {
        if (this._stopButton.disabled) {
            return true;
        }
        if (0 < this._syntax.limit && this._syntax.limit <= this._values.length) {
            return true;
        }
        return false;
    },

    // accept pattern
    "_accept": function(patterns) {
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
                if (0 < this._values.filter(find).length) {
                    return;
                }
            }
            this._values.push(value);
        } catch (e) {
            // error handling
            this._setError("", e.message, "execution error");
            this._stopButton.disabled = true;
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
        var head = document.createElement("div");
        var ok = document.createElement("div");
        var ng = document.createElement("div");
        head.innerHTML = title;
        head.className = "error";
        ok.innerHTML = valid;
        ng.innerHTML = invalid;
        ng.className = "error";
        this._messageArea.innerHTML = "";
        this._messageArea.appendChild(head);
        this._messageArea.appendChild(ok);
        this._messageArea.appendChild(ng);
    },

}

// start the controller
new Controller();

