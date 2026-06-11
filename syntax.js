// WHERE syntax class
class SyntaxWhere {

    // constructor
    constructor() {
        // properties
        this.condition = null;
    }

    // whether the conditions are met
    isValid(symbols) {
        // check the properties
        if (this.condition == null) {
            return true;
        }

        // judgment
        if (this.condition.getText(symbols)) {
            return true;
        } else {
            return false;
        }
    }

}

// SELECT syntax class
class SyntaxSelect {

    // constructor
    constructor() {
        // properties
        this.distinct = false;
        this.list = [];
    }

    // get result text
    getText(symbols) {
        if (this.list.length == 0) {
            return symbols.getText(0);
        }
        return this.list.map(elem => elem.getText(symbols)).join("");
    }

}

// ORDER BY syntax class
class SyntaxOrder {

    // constructor
    constructor() {
        // properties
        this.list = [];
    }

    // compare the magnitude of two values
    compare(a, b) {
        for (const single of this.list) {
            // compare in order
            const x = single.value.getText(a.symbols);
            const y = single.value.getText(b.symbols);
            if (x != y) {
                let result = 1;
                if (x < y) {
                    result = -1;
                }
                if (single.desc) {
                    // descending order
                    result = -result;
                }
                return result;
            }
        }
        return 0;
    }

}

// Search condition class
class SyntaxCondition {

    // constructor
    constructor() {
        // properties
        this.list = [];
    }

    // get result text
    getText(symbols) {
        // first text
        let text = this.list[0].getText(symbols);
        if (this.list.length == 1) {
            return text;
        }
        if (text && text !== "0") {
            return 1;
        }

        // second and subsequent text
        for (let i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(symbols);
            if (text && text !== "0") {
                return 1;
            }
        }
        return 0;
    }

}

// Condition part class
class SyntaxPart {

    // constructor
    constructor() {
        // properties
        this.list = [];
    }

    // get result text
    getText(symbols) {
        // first text
        let text = this.list[0].getText(symbols);
        if (this.list.length == 1) {
            return text;
        }
        if (!text || text === "0") {
            return 0;
        }

        // second and subsequent text
        for (let i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(symbols);
            if (!text || text === "0") {
                return 0;
            }
        }
        return 1;
    }

}

// Condition unit class
class SyntaxUnit {

    // constructor
    constructor() {
        // properties
        this.not = false;
        this.expression = null;
    }

    // get result text
    getText(symbols) {
        // text
        const text = this.expression.getText(symbols);
        if (!this.not) {
            return text;
        }

        // deal the NOT
        if (text && text !== "0") {
            return 0;
        }
        return 1;
    }

}

// Condition expression class
class SyntaxExpression {

    // constructor
    constructor(first) {
        // properties
        this.first = first;
        this.compare = "";
        this.second = null;
        this.clause = null;
    }

    // get result text
    getText(symbols) {
        let result = false;
        let text = this.first.getText(symbols);
        if (this.clause == null) {
            // no comparison target
            if (!this.compare) {
                return text;
            }

            // get the comparison target
            let second = this.second.getText(symbols);
            if (typeof text == "bigint") {
                if (typeof second != "bigint") {
                    second = PatternCommon.toBigInt(second);
                }
            } else {
                if (typeof second == "bigint") {
                    text = PatternCommon.toBigInt(text);
                }
            }

            // compare
            switch (this.compare) {
                case "==":
                    result = (text == second);
                    break;

                case "!=":
                case "<>":
                    result = (text != second);
                    break;

                case "<":
                    result = (text < second);
                    break;

                case "<=":
                    result = (text <= second);
                    break;

                case ">":
                    result = (text > second);
                    break;

                case ">=":
                    result = (text >= second);
                    break;
            }
        } else {
            // IN clause
            let i = 0;
            while (!result && i < this.clause.list.length) {
                if (this.clause.list[i] == text) {
                    result = true;
                }
                i++;
            }
            if (this.clause.not) {
                result = !result;
            }
        }

        // convert to number
        if (result) {
            return 1;
        } else {
            return 0;
        }
    }

}

// Operator term class
class SyntaxTerm {

    // constructor
    constructor(first) {
        // properties
        this.first = first;
        this.operators = [];
        this.follows = [];
    }

    // add an operator
    add(operator, follow) {
        this.operators.push(operator);
        this.follows.push(follow);
    }

    // get result text
    getText(symbols) {
        // check the properties
        let text = this.first.getText(symbols);
        if (this.operators.length == 0) {
            return text;
        }

        // addition and subtraction
        for (let i = 0; i < this.operators.length; i++) {
            const follow = this.follows[i].getText(symbols);
            switch (this.operators[i]) {
                case "+":
                    text = PatternCommon.toBigInt(text) + PatternCommon.toBigInt(follow);
                    break;

                case "-":
                    text = PatternCommon.toBigInt(text) - PatternCommon.toBigInt(follow);
                    break;

                default:
                    text += `${follow}`;
                    break;
            }
        }
        return text;
    }

}

// Operator factor class
class SyntaxFactor {

    // constructor
    constructor(first) {
        // properties
        this.first = first;
        this.operators = [];
        this.follows = [];

    }

    // add an operator
    add(operator, follow) {
        this.operators.push(operator);
        this.follows.push(follow);
    }

    // get result text
    getText(symbols) {
        // check the properties
        const text = this.first.getText(symbols);
        if (this.operators.length == 0) {
            return text;
        }

        // multiplication and division
        let value = PatternCommon.toBigInt(text);
        for (let i = 0; i < this.operators.length; i++) {
            const follow = PatternCommon.toBigInt(this.follows[i].getText(symbols));
            switch (this.operators[i]) {
                case "*":
                    value *= follow;
                    break;

                case "/":
                    value /= follow;
                    break;

                default:
                    value %= follow;
                    break;
            }
        }
        return value;
    }

}

// Operator value class
class SyntaxValue {

    // constructor
    constructor(element) {
        // properties
        this.element = element;
        this.follows = [];
    }

    // get result text
    getText(symbols) {
        // convert to pattern value
        let text = this.element.getText(symbols);
        for (const follow of this.follows) {
            follow.setValue(text);
            text = follow.getText(symbols);
        }
        return text;
    }

}

// Property class
class SyntaxProperty {

    // constructor
    constructor(name) {
        // properties
        this.name = name;
        this.value = null;
    }

    // set pattern value
    setValue(pattern) {
        this.value = new PatternValue(pattern);
    }

    // get result text
    getText(symbols) {
        return this.value.getProperty(this.name);
    }

}

// Method class
class SyntaxMethod {
    #name;
    #param;
    #value;
    #functions;

    // constructor
    constructor(name, param) {
        // fields
        this.#name = name;
        this.#param = param;
        this.#functions = {
            "at": this.#getAt.bind(this),
            "rotate": this.#getRotate.bind(this),
            "skip": this.#getSkip.bind(this),
            "take": this.#getTake.bind(this),
        };
    }

    // set pattern value
    setValue(pattern) {
        this.#value = `${pattern}`;
    }

    // get result text
    getText(symbols) {
        // get method
        const method = this.#functions[this.#name];
        if (method == null) {
            return this.#value;
        }

        // execute the method
        const number = parseInt(this.#param.getText(symbols), 10);
        return method(number, this.#value.length);
    }

    // get the value at the specified position
    #getAt(number, length) {
        if (length <= number || length < -number) {
            return "";
        }
        if (number < 0) {
            return this.#value[number + length];
        } else {
            return this.#value[number];
        }
    }

    // get the rotated value
    #getRotate(number, length) {
        let rotate = number % length;
        if (rotate < 0) {
            rotate += length;
        }
        return this.#value.substring(rotate) + this.#value.substring(0, rotate);
    }

    // get the skipped value
    #getSkip(number, length) {
        if (length <= number || length < -number) {
            return "";
        }
        if (number < 0) {
            return this.#value.substring(0, number + length);
        } else {
            return this.#value.substring(number);
        }
    }

    // get the value from the beginning
    #getTake(number, length) {
        if (length <= number || length < -number) {
            return this.#value;
        }
        if (number < 0) {
            return this.#value.substring(number + length);
        } else {
            return this.#value.substring(0, number);
        }
    }

}

// Method parameter class
class SyntaxParameter {

    // constructor
    constructor() {
        // properties
        this.term = null;
        this.value = null;
    }

    // get result text
    getText(symbols) {
        if (this.term != null) {
            return this.term.getText(symbols);
        }
        if (this.value != null) {
            return `-${this.value.getText(symbols)}`;
        }
        return "";
    }

}

// Iterator class
class SyntaxIterator {
    #name;
    #lambda;
    #value;
    #functions;

    // constructor
    constructor(name, lambda) {
        // fields
        this.#name = name;
        this.#lambda = lambda;
        this.#functions = {
            "every": this.#testsEvery.bind(this),
            "some": this.#testsSome.bind(this),
        };
    }

    // set pattern value
    setValue(pattern) {
        this.#value = `${pattern}`;
    }

    // get result text
    getText(symbols) {
        // set user-defined variables
        if (this.#lambda.whole != null) {
            symbols.setText(this.#lambda.whole, this.#value);
        }

        // execution of iterator
        let result = "";
        const method = this.#functions[this.#name];
        if (method != null) {
            result = method(symbols);
        }

        // delete user-defined variables
        symbols.setText(this.#lambda.index, null);
        if (this.#lambda.whole != null) {
            symbols.setText(this.#lambda.whole, null);
        }
        return result;
    }

    // test for all indexes
    #testsEvery(symbols) {
        for (let i = 0; i < this.#value.length; i++) {
            symbols.setText(this.#lambda.index, i);
            const text = this.#lambda.getText(symbols);
            if (!text || text === "0") {
                return 0;
            }
        }
        return 1;
    }

    // test for any index
    #testsSome(symbols) {
        for (let i = 0; i < this.#value.length; i++) {
            symbols.setText(this.#lambda.index, i);
            const text = this.#lambda.getText(symbols);
            if (text && text !== "0") {
                return 1;
            }
        }
        return 0;
    }

}

// Lambda expression class
class SyntaxLambda {

    // constructor
    constructor(index) {
        // properties
        this.index = index;
        this.whole = null;
        this.condition = null;
    }

    // get result text
    getText(symbols) {
        return this.condition.getText(symbols);
    }

}

// Auto-defined variable class
class SyntaxAuto {
    #number = 0;

    // constructor
    constructor(number) {
        if (!isNaN(number)) {
            this.#number = number;
        }
    }

    // get result text
    getText(symbols) {
        return symbols.getText(this.#number);
    }

}

// User-defined variable class
class SyntaxUser {
    #name;

    // constructor
    constructor(name) {
        this.#name = name;
    }

    // get result text
    getText(symbols) {
        return symbols.getText(this.#name);
    }

}

// Literal value class
class SyntaxLiteral {
    #text;

    // constructor
    constructor(text) {
        this.#text = text;
    }

    // get result text
    getText(symbols) {
        return this.#text;
    }

}

// Symbol table class
class SymbolTable {
    #auto;
    #user = {};
    #term = {};

    // constructor
    constructor(patterns) {
        this.#auto = patterns;
    }

    // set the text of a variable
    setText(name, text) {
        if (!isNaN(name)) {
            return;
        }
        if (text == null) {
            delete this.#user[name];
        } else {
            this.#user[name] = text;
        }
    }

    // set the operator term
    setTerm(pair) {
        this.#term[pair.name] = pair.term;
    }

    // get the text of a variable
    getText(name) {
        if (isNaN(name)) {
            // user-defined variable
            if (name == null) {
                return "";
            }
            if (this.#term[name] == null) {
                return this.#user[name];
            } else {
                return this.#term[name].getText(this);
            }
        }

        // auto-defined variable
        if (name < 0 || this.#auto.length <= name) {
            return "";
        }
        return this.#auto[name];
    }

}

