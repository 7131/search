// Controller class
const Controller = function() {
    // fields
    this._parser = new Parser(PatternGrammar, PatternConverter);

    // events
    window.addEventListener("load", this._initialize.bind(this));
}

// Controller prototype
Controller.prototype = {

    // initialize the private fields
    "_initialize": function(e) {
        // input elements
        this._pattern = document.getElementById("pattern");
        this._searchButton = document.getElementById("search");
        this._messageArea = document.getElementById("message_area");

        // result elements
        this._resultTotal = document.getElementById("result_total");
        this._resultCount = document.getElementById("result_count");
        this._resultTime = document.getElementById("result_time");
        this._resultArea = document.getElementById("result_area");

        // stop condition elements
        this._limitCount = document.getElementById("limit_count");
        this._limitTime = document.getElementById("limit_time");

        // range of stop conditions
        this._minCount = this._getInt(document.getElementById("min_count").textContent);
        this._maxCount = this._getInt(document.getElementById("max_count").textContent);
        this._minTime = this._getInt(document.getElementById("min_time").textContent);
        this._maxTime = this._getInt(document.getElementById("max_time").textContent);

        // display condition elements
        this._settingBalls = document.getElementById("setting_balls");
        this._settingSort = document.getElementById("setting_sort");
        this._settingIteration = document.getElementById("setting_repetition");
        this._settingAll = document.getElementById("setting_all");
        this._settingNumbers = document.getElementById("setting_numbers");
        this._valueNumbers = document.getElementById("value_numbers");
        this._settingSingle = document.getElementById("setting_single");
        this._settingRotation = document.getElementById("setting_rotation");
        this._groupSort = [
            document.getElementById("sort_length"),
            document.getElementById("sort_balls"),
            document.getElementById("sort_dictionary"),
        ];
        this._groupNumbers = [ this._valueNumbers ];
        this._groupSingle = [ this._settingRotation ];
        this._groupAll = [
            document.getElementById("area_numbers"),
            document.getElementById("area_single"),
        ];

        // range of display conditions
        this._minNumbers = this._getInt(document.getElementById("min_numbers").textContent);
        this._maxNumbers = this._getInt(document.getElementById("max_numbers").textContent);

        // events
        this._searchButton.addEventListener("click", this._start.bind(this));
        this._limitCount.addEventListener("input", this._inputCount.bind(this));
        this._limitTime.addEventListener("input", this._inputTime.bind(this));
        this._settingSort.addEventListener("change", this._changeSort.bind(this));
        this._settingAll.addEventListener("change", this._changeAll.bind(this));
        this._settingNumbers.addEventListener("change", this._changeNumbers.bind(this));
        this._valueNumbers.addEventListener("input", this._inputNumbers.bind(this));
        this._settingSingle.addEventListener("change", this._changeSingle.bind(this));

        // initialize the page
        this._changeSort(null);
        this._changeNumbers(null);
        this._changeSingle(null);
        this._changeAll(null);
    },

    // "Search" button process
    "_start": function(e) {
        // clear display
        this._values = [];
        this._messageArea.textContent = "";
        this._resultArea.textContent = "";
        this._resultCount.classList.remove("error");
        this._resultTime.classList.remove("error");
        this._showProgress(0, 0);

        // pattern analysis
        const lex = this._parser.tokenize(PatternCommon.toSmall(this._pattern.value));
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
        creator.completeEvent = this._showResult.bind(this);
        creator.acceptEvent = this._accept.bind(this);

        // get the stop conditions
        this._stopCount = this._getValidInt(this._limitCount.value, this._minCount, this._maxCount, 100);
        this._stopTime = Date.now() + 1000 * this._getValidInt(this._limitTime.value, this._minTime, this._maxTime, 3);
        this._acceptNumbers = this._getValidInt(this._valueNumbers.value, this._minNumbers, this._maxNumbers, 3);

        // execution
        this._searchButton.disabled = true;
        creator.start();
    },

    // input the maximum number
    "_inputCount": function(e) {
        this._setStatus(this._limitCount, this._minCount, this._maxCount);
    },

    // input the time limit
    "_inputTime": function(e) {
        this._setStatus(this._limitTime, this._minTime, this._maxTime);
    },

    // change whether to sort
    "_changeSort": function(e) {
        this._setEnabled(this._groupSort, this._settingSort.checked);
    },

    // change whether to show all items
    "_changeAll": function(e) {
        if (this._settingAll.checked) {
            this._groupAll.forEach(elem => elem.classList.add("hidden"));
        } else {
            this._groupAll.forEach(elem => elem.classList.remove("hidden"));
        }
    },

    // change whether to specify the number of balls
    "_changeNumbers": function(e) {
        this._setEnabled(this._groupNumbers, this._settingNumbers.checked);
    },

    // input the number of balls
    "_inputNumbers": function(e) {
        this._setStatus(this._valueNumbers, this._minNumbers, this._maxNumbers);
    },

    // change whether to exclude same value
    "_changeSingle": function(e) {
        this._setEnabled(this._groupSingle, this._settingSingle.checked);
    },

    // set textbox status
    "_setStatus": function(input, min, max) {
        const number = parseInt(input.value, 10);
        if (isNaN(number) || number < min || max < number) {
            // invalid
            input.classList.add("invalid");
        } else {
            // valid
            input.classList.remove("invalid");
        }
    },

    // switch enable/disable of input item
    "_setEnabled": function(group, enabled) {
        group.forEach(elem => elem.disabled = !enabled);
    },

    // get an integer value
    "_getInt": function(text) {
        const after = text.replace(/,/g, "");
        let number = parseInt(after, 10);
        if (isNaN(number)) {
            number = 0;
        }
        return number;
    },

    // get a valid integer value
    "_getValidInt": function(text, min, max, init) {
        let number = this._getInt(text);
        if (number < min || max < number) {
            number = init;
        }
        return number;
    },

    // show the progress
    "_showProgress": function(number, second) {
        this._resultTotal.textContent = number.toLocaleString();
        this._resultCount.textContent = this._values.length.toLocaleString();
        this._resultTime.textContent = Math.floor(second * 10 + 0.5) / 10;
    },

    // show the result
    "_showResult": function(completed) {
        // check if it is completed
        if (!completed) {
            if (parseFloat(this._limitCount.value) <= parseFloat(this._resultCount.textContent)) {
                this._resultCount.classList.add("error");
            }
            if (parseFloat(this._limitTime.value) <= parseFloat(this._resultTime.textContent)) {
                this._resultTime.classList.add("error");
            }
        }

        // title
        const h2 = document.createElement("h2");
        h2.textContent = "Result";
        this._resultArea.appendChild(h2);
        if (!Array.isArray(this._values)) {
            this._searchButton.disabled = false;
            return;
        }

        // sort
        if (this._settingSort.checked) {
            if (this._groupSort[0].checked) {
                this._values.sort((a, b) => a.getProperty("length") - b.getProperty("length"));
            } else if (this._groupSort[1].checked) {
                this._values.sort((a, b) => a.getProperty("balls") - b.getProperty("balls"));
            } else {
                this._values.sort(this._comparePatterns);
            }
        }

        // list
        const ul = document.createElement("ul");
        for (const value of this._values) {
            const li = document.createElement("li");
            let text = value.getProperty("pattern");

            // show the number of balls
            if (this._settingBalls.checked) {
                text += `(${value.getProperty("balls")})`;
            }
            li.textContent = text;
            ul.appendChild(li);
        }
        this._resultArea.appendChild(ul);
        this._searchButton.disabled = false;
    },

    // accept pattern
    "_accept": function(patterns) {
        // check time limit
        if (this._stopTime <= Date.now()) {
            return false;
        }

        // create pattern value
        let value = new PatternValue(patterns[0]);
        if (this._settingIteration.checked) {
            value = new PatternValue(value.getProperty("omission"));
        }

        // display settings
        if (!this._settingAll.checked) {
            if (!value.getProperty("valid")) {
                return true;
            }

            // number of balls
            if (this._settingNumbers.checked) {
                if (value.getProperty("balls") != this._acceptNumbers) {
                    return true;
                }
            }

            // equivalence exclusion
            if (this._settingSingle.checked) {
                let name = "pattern";
                if (this._settingRotation.checked) {
                    // circular equivalence
                    name = "standard";
                }
                const text = value.getProperty(name);
                if (0 < this._values.filter(elem => elem.getProperty(name) == text).length) {
                    return true;
                }
            }
        }
        this._values.push(value);
        return this._values.length < this._stopCount;
    },

    // set an error
    "_setError": function(valid, invalid) {
        // check the arguments
        if (0 < valid.length && 0 < invalid.length) {
            valid = `OK: ${valid}`;
            invalid = `NG: ${invalid}`;
        }

        // display items
        const head = document.createElement("div");
        const ok = document.createElement("div");
        const ng = document.createElement("div");
        head.textContent = "Error";
        head.classList.add("error");
        ok.textContent = valid;
        ng.textContent = invalid;
        ng.classList.add("error");
        this._messageArea.textContent = "";
        this._messageArea.appendChild(head);
        this._messageArea.appendChild(ok);
        this._messageArea.appendChild(ng);
    },

    // compare patterns
    "_comparePatterns": function(a, b) {
        const x = a.getProperty("pattern");
        const y = b.getProperty("pattern");
        if (x < y) {
            return -1;
        }
        if (x > y) {
            return 1;
        }
        return 0;
    },

}

// start the controller
new Controller();

