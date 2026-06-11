// Controller class
class Controller {
    #pattern;
    #searchButton;
    #messageArea;
    #resultTotal;
    #resultCount;
    #resultTime;
    #resultArea;
    #limitCount;
    #limitTime;
    #minCount;
    #maxCount;
    #minTime;
    #maxTime;
    #settingBalls;
    #settingSort;
    #settingIteration;
    #settingAll;
    #settingNumbers;
    #valueNumbers;
    #settingSingle;
    #settingRotation;
    #groupSort;
    #groupNumbers;
    #groupSingle;
    #groupAll;
    #minNumbers;
    #maxNumbers;
    #stopCount;
    #stopTime;
    #acceptNumbers;
    #parser = new Parser(PatternGrammar, PatternConverter);
    #values = [];

    // constructor
    constructor() {
        window.addEventListener("load", this.#initialize.bind(this));
    }

    // initialize the private fields
    #initialize(e) {
        // input elements
        this.#pattern = document.getElementById("pattern");
        this.#searchButton = document.getElementById("search");
        this.#messageArea = document.getElementById("message_area");

        // result elements
        this.#resultTotal = document.getElementById("result_total");
        this.#resultCount = document.getElementById("result_count");
        this.#resultTime = document.getElementById("result_time");
        this.#resultArea = document.getElementById("result_area");

        // stop condition elements
        this.#limitCount = document.getElementById("limit_count");
        this.#limitTime = document.getElementById("limit_time");

        // range of stop conditions
        this.#minCount = this.#getInt(document.getElementById("min_count").textContent);
        this.#maxCount = this.#getInt(document.getElementById("max_count").textContent);
        this.#minTime = this.#getInt(document.getElementById("min_time").textContent);
        this.#maxTime = this.#getInt(document.getElementById("max_time").textContent);

        // display condition elements
        this.#settingBalls = document.getElementById("setting_balls");
        this.#settingSort = document.getElementById("setting_sort");
        this.#settingIteration = document.getElementById("setting_repetition");
        this.#settingAll = document.getElementById("setting_all");
        this.#settingNumbers = document.getElementById("setting_numbers");
        this.#valueNumbers = document.getElementById("value_numbers");
        this.#settingSingle = document.getElementById("setting_single");
        this.#settingRotation = document.getElementById("setting_rotation");
        this.#groupSort = [
            document.getElementById("sort_length"),
            document.getElementById("sort_balls"),
            document.getElementById("sort_dictionary"),
        ];
        this.#groupNumbers = [ this.#valueNumbers ];
        this.#groupSingle = [ this.#settingRotation ];
        this.#groupAll = [
            document.getElementById("area_numbers"),
            document.getElementById("area_single"),
        ];

        // range of display conditions
        this.#minNumbers = this.#getInt(document.getElementById("min_numbers").textContent);
        this.#maxNumbers = this.#getInt(document.getElementById("max_numbers").textContent);

        // events
        this.#searchButton.addEventListener("click", this.#start.bind(this));
        this.#limitCount.addEventListener("input", this.#inputCount.bind(this));
        this.#limitTime.addEventListener("input", this.#inputTime.bind(this));
        this.#settingSort.addEventListener("change", this.#changeSort.bind(this));
        this.#settingAll.addEventListener("change", this.#changeAll.bind(this));
        this.#settingNumbers.addEventListener("change", this.#changeNumbers.bind(this));
        this.#valueNumbers.addEventListener("input", this.#inputNumbers.bind(this));
        this.#settingSingle.addEventListener("change", this.#changeSingle.bind(this));

        // initialize the page
        this.#changeSort(null);
        this.#changeNumbers(null);
        this.#changeSingle(null);
        this.#changeAll(null);
    }

    // "Search" button process
    #start(e) {
        // clear display
        this.#values = [];
        this.#messageArea.textContent = "";
        this.#resultArea.textContent = "";
        this.#resultCount.classList.remove("error");
        this.#resultTime.classList.remove("error");
        this.#showProgress(0, 0);

        // pattern analysis
        const lex = this.#parser.tokenize(PatternCommon.toSmall(this.#pattern.value));
        if (lex.tokens == null) {
            this.#setError(lex.valid, lex.invalid);
            return;
        }
        const syntax = this.#parser.parse(lex.tokens);
        if (syntax.tree == null) {
            this.#setError(syntax.valid, syntax.invalid);
            return;
        }

        // preparation for execution
        const creator = new PatternCreator(syntax.tree.iterator);
        creator.progressEvent = this.#showProgress.bind(this);
        creator.completeEvent = this.#showResult.bind(this);
        creator.acceptEvent = this.#accept.bind(this);

        // get the stop conditions
        this.#stopCount = this.#getValidInt(this.#limitCount.value, this.#minCount, this.#maxCount, 100);
        this.#stopTime = Date.now() + 1000 * this.#getValidInt(this.#limitTime.value, this.#minTime, this.#maxTime, 3);
        this.#acceptNumbers = this.#getValidInt(this.#valueNumbers.value, this.#minNumbers, this.#maxNumbers, 3);

        // execution
        this.#searchButton.disabled = true;
        creator.start();
    }

    // input the maximum number
    #inputCount(e) {
        this.#setStatus(this.#limitCount, this.#minCount, this.#maxCount);
    }

    // input the time limit
    #inputTime(e) {
        this.#setStatus(this.#limitTime, this.#minTime, this.#maxTime);
    }

    // change whether to sort
    #changeSort(e) {
        this.#setEnabled(this.#groupSort, this.#settingSort.checked);
    }

    // change whether to show all items
    #changeAll(e) {
        if (this.#settingAll.checked) {
            this.#groupAll.forEach(elem => elem.classList.add("hidden"));
        } else {
            this.#groupAll.forEach(elem => elem.classList.remove("hidden"));
        }
    }

    // change whether to specify the number of balls
    #changeNumbers(e) {
        this.#setEnabled(this.#groupNumbers, this.#settingNumbers.checked);
    }

    // input the number of balls
    #inputNumbers(e) {
        this.#setStatus(this.#valueNumbers, this.#minNumbers, this.#maxNumbers);
    }

    // change whether to exclude same value
    #changeSingle(e) {
        this.#setEnabled(this.#groupSingle, this.#settingSingle.checked);
    }

    // set textbox status
    #setStatus(input, min, max) {
        const number = parseInt(input.value, 10);
        if (isNaN(number) || number < min || max < number) {
            // invalid
            input.classList.add("invalid");
        } else {
            // valid
            input.classList.remove("invalid");
        }
    }

    // switch enable/disable of input item
    #setEnabled(group, enabled) {
        group.forEach(elem => elem.disabled = !enabled);
    }

    // get an integer value
    #getInt(text) {
        const after = text.replace(/,/g, "");
        let number = parseInt(after, 10);
        if (isNaN(number)) {
            number = 0;
        }
        return number;
    }

    // get a valid integer value
    #getValidInt(text, min, max, init) {
        let number = this.#getInt(text);
        if (number < min || max < number) {
            number = init;
        }
        return number;
    }

    // show the progress
    #showProgress(number, second) {
        this.#resultTotal.textContent = number.toLocaleString();
        this.#resultCount.textContent = this.#values.length.toLocaleString();
        this.#resultTime.textContent = Math.floor(second * 10 + 0.5) / 10;
    }

    // show the result
    #showResult(completed) {
        // check if it is completed
        if (!completed) {
            if (parseFloat(this.#limitCount.value) <= parseFloat(this.#resultCount.textContent)) {
                this.#resultCount.classList.add("error");
            }
            if (parseFloat(this.#limitTime.value) <= parseFloat(this.#resultTime.textContent)) {
                this.#resultTime.classList.add("error");
            }
        }

        // title
        const h2 = document.createElement("h2");
        h2.textContent = "Result";
        this.#resultArea.appendChild(h2);
        if (!Array.isArray(this.#values)) {
            this.#searchButton.disabled = false;
            return;
        }

        // sort
        if (this.#settingSort.checked) {
            if (this.#groupSort[0].checked) {
                this.#values.sort((a, b) => a.getProperty("length") - b.getProperty("length"));
            } else if (this.#groupSort[1].checked) {
                this.#values.sort((a, b) => a.getProperty("balls") - b.getProperty("balls"));
            } else {
                this.#values.sort(this.#comparePatterns);
            }
        }

        // list
        const ul = document.createElement("ul");
        for (const value of this.#values) {
            const li = document.createElement("li");
            let text = value.getProperty("pattern");

            // show the number of balls
            if (this.#settingBalls.checked) {
                text += `(${value.getProperty("balls")})`;
            }
            li.textContent = text;
            ul.appendChild(li);
        }
        this.#resultArea.appendChild(ul);
        this.#searchButton.disabled = false;
    }

    // accept pattern
    #accept(patterns) {
        // check time limit
        if (this.#stopTime <= Date.now()) {
            return false;
        }

        // create pattern value
        let value = new PatternValue(patterns[0]);
        if (this.#settingIteration.checked) {
            value = new PatternValue(value.getProperty("omission"));
        }

        // display settings
        if (!this.#settingAll.checked) {
            if (!value.getProperty("valid")) {
                return true;
            }

            // number of balls
            if (this.#settingNumbers.checked) {
                if (value.getProperty("balls") != this.#acceptNumbers) {
                    return true;
                }
            }

            // equivalence exclusion
            if (this.#settingSingle.checked) {
                let name = "pattern";
                if (this.#settingRotation.checked) {
                    // circular equivalence
                    name = "standard";
                }
                const text = value.getProperty(name);
                if (0 < this.#values.filter(elem => elem.getProperty(name) == text).length) {
                    return true;
                }
            }
        }
        this.#values.push(value);
        return this.#values.length < this.#stopCount;
    }

    // set an error
    #setError(valid, invalid) {
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
        this.#messageArea.textContent = "";
        this.#messageArea.appendChild(head);
        this.#messageArea.appendChild(ok);
        this.#messageArea.appendChild(ng);
    }

    // compare patterns
    #comparePatterns(a, b) {
        const x = a.getProperty("pattern");
        const y = b.getProperty("pattern");
        if (x < y) {
            return -1;
        }
        if (x > y) {
            return 1;
        }
        return 0;
    }

}

// start the controller
new Controller();

