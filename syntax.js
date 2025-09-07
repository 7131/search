// WHERE syntax class
const SyntaxWhere = function() {
    // properties
    this.condition = null;
}

// WHERE syntax prototype
SyntaxWhere.prototype = {

    // whether the conditions are met
    "isValid": function(symbols) {
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
    },

}

// SELECT syntax class
const SyntaxSelect = function() {
    // properties
    this.distinct = false;
    this.list = [];
}

// SELECT syntax prototype
SyntaxSelect.prototype = {

    // get result text
    "getText": function(symbols) {
        if (this.list.length == 0) {
            return symbols.getText(0);
        }
        return this.list.map(elem => elem.getText(symbols)).join("");
    },

}

// ORDER BY syntax class
const SyntaxOrder = function() {
    // properties
    this.list = [];
}

// ORDER BY syntax prototype
SyntaxOrder.prototype = {

    // compare the magnitude of two values
    "compare": function(a, b) {
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
    },

}

// Search condition class
const SyntaxCondition = function() {
    // properties
    this.list = [];
}

// Search condition prototype
SyntaxCondition.prototype = {

    // get result text
    "getText": function(symbols) {
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
    },

}

// Condition part class
const SyntaxPart = function() {
    // properties
    this.list = [];
}

// Condition part prototype
SyntaxPart.prototype = {

    // get result text
    "getText": function(symbols) {
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
    },

}

// Condition unit class
const SyntaxUnit = function() {
    // properties
    this.not = false;
    this.expression = null;
}

// Condition unit prototype
SyntaxUnit.prototype = {

    // get result text
    "getText": function(symbols) {
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
    },

}

// Condition expression class
const SyntaxExpression = function(first) {
    // properties
    this.first = first;
    this.compare = "";
    this.second = null;
    this.clause = null;
}

// Condition expression prototype
SyntaxExpression.prototype = {

    // get result text
    "getText": function(symbols) {
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
    },

}

// Operator term class
const SyntaxTerm = function(first) {
    // properties
    this.first = first;
    this.operators = [];
    this.follows = [];
}

// Operator term prototype
SyntaxTerm.prototype = {

    // add an operator
    "add": function(operator, follow) {
        this.operators.push(operator);
        this.follows.push(follow);
    },

    // get result text
    "getText": function(symbols) {
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
    },

}

// Operator factor class
const SyntaxFactor = function(first) {
    // properties
    this.first = first;
    this.operators = [];
    this.follows = [];

}

// Operator factor prototype
SyntaxFactor.prototype = {

    // add an operator
    "add": function(operator, follow) {
        this.operators.push(operator);
        this.follows.push(follow);
    },

    // get result text
    "getText": function(symbols) {
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
    },

}

// Operator value class
const SyntaxValue = function(element) {
    // properties
    this.element = element;
    this.follows = [];
}

// Operator value prototype
SyntaxValue.prototype = {

    // get result text
    "getText": function(symbols) {
        // convert to pattern value
        let text = this.element.getText(symbols);
        for (const follow of this.follows) {
            follow.setValue(text);
            text = follow.getText(symbols);
        }
        return text;
    },

}

// Property class
const SyntaxProperty = function(name) {
    // properties
    this.name = name;
    this.value = null;
}

// Property prototype
SyntaxProperty.prototype = {

    // set pattern value
    "setValue": function(pattern) {
        this.value = new PatternValue(pattern);
    },

    // get result text
    "getText": function(symbols) {
        return this.value.getProperty(this.name);
    },

}

// Method class
const SyntaxMethod = function(name, param) {
    // fields
    this._name = name;
    this._param = param;
    this._value = null;
    this._functions = {
        "at": this._getAt.bind(this),
        "rotate": this._getRotate.bind(this),
        "skip": this._getSkip.bind(this),
        "take": this._getTake.bind(this),
    };
}

// Method prototype
SyntaxMethod.prototype = {

    // set pattern value
    "setValue": function(pattern) {
        this._value = `${pattern}`;
    },

    // get result text
    "getText": function(symbols) {
        // get method
        const method = this._functions[this._name];
        if (method == null) {
            return this._value;
        }

        // execute the method
        const number = parseInt(this._param.getText(symbols), 10);
        return method(number, this._value.length);
    },

    // get the value at the specified position
    "_getAt": function(number, length) {
        if (length <= number || length < -number) {
            return "";
        }
        if (number < 0) {
            return this._value[number + length];
        } else {
            return this._value[number];
        }
    },

    // get the rotated value
    "_getRotate": function(number, length) {
        let rotate = number % length;
        if (rotate < 0) {
            rotate += length;
        }
        return this._value.substring(rotate) + this._value.substring(0, rotate);
    },

    // get the skipped value
    "_getSkip": function(number, length) {
        if (length <= number || length < -number) {
            return "";
        }
        if (number < 0) {
            return this._value.substring(0, number + length);
        } else {
            return this._value.substring(number);
        }
    },

    // get the value from the beginning
    "_getTake": function(number, length) {
        if (length <= number || length < -number) {
            return this._value;
        }
        if (number < 0) {
            return this._value.substring(number + length);
        } else {
            return this._value.substring(0, number);
        }
    },

}

// Method parameter class
const SyntaxParameter = function() {
    // properties
    this.term = null;
    this.value = null;
}

// Method parameter prototype
SyntaxParameter.prototype = {

    // get result text
    "getText": function(symbols) {
        if (this.term != null) {
            return this.term.getText(symbols);
        }
        if (this.value != null) {
            return `-${this.value.getText(symbols)}`;
        }
        return "";
    },

}

// Iterator class
const SyntaxIterator = function(name, lambda) {
    // fields
    this._name = name;
    this._lambda = lambda;
    this._value = null;
    this._functions = {
        "every": this._testsEvery.bind(this),
        "some": this._testsSome.bind(this),
    };
}

// Iterator prototype
SyntaxIterator.prototype = {

    // set pattern value
    "setValue": function(pattern) {
        this._value = `${pattern}`;
    },

    // get result text
    "getText": function(symbols) {
        // set user-defined variables
        if (this._lambda.whole != null) {
            symbols.setText(this._lambda.whole, this._value);
        }

        // execution of iterator
        let result = "";
        const method = this._functions[this._name];
        if (method != null) {
            result = method(symbols);
        }

        // delete user-defined variables
        symbols.setText(this._lambda.index, null);
        if (this._lambda.whole != null) {
            symbols.setText(this._lambda.whole, null);
        }
        return result;
    },

    // test for all indexes
    "_testsEvery": function(symbols) {
        for (let i = 0; i < this._value.length; i++) {
            symbols.setText(this._lambda.index, i);
            const text = this._lambda.getText(symbols);
            if (!text || text === "0") {
                return 0;
            }
        }
        return 1;
    },

    // test for any index
    "_testsSome": function(symbols) {
        for (let i = 0; i < this._value.length; i++) {
            symbols.setText(this._lambda.index, i);
            const text = this._lambda.getText(symbols);
            if (text && text !== "0") {
                return 1;
            }
        }
        return 0;
    },

}

// Lambda expression class
const SyntaxLambda = function(index) {
    // properties
    this.index = index;
    this.whole = null;
    this.condition = null;
}

// Lambda expression prototype
SyntaxLambda.prototype = {

    // get result text
    "getText": function(symbols) {
        return this.condition.getText(symbols);
    },

}

// Auto-defined variable class
const SyntaxAuto = function(number) {
    // fields
    if (isNaN(number)) {
        this._number = 0;
    } else {
        this._number = number;
    }
}

// Auto-defined variable prototype
SyntaxAuto.prototype = {

    // get result text
    "getText": function(symbols) {
        return symbols.getText(this._number);
    },

}

// User-defined variable class
const SyntaxUser = function(name) {
    // fields
    this._name = name;
}

// User-defined variable prototype
SyntaxUser.prototype = {

    // get result text
    "getText": function(symbols) {
        return symbols.getText(this._name);
    },

}

// Literal value class
const SyntaxLiteral = function(text) {
    // fields
    this._text = text;
}

// Literal value prototype
SyntaxLiteral.prototype = {

    // get result text
    "getText": function(symbols) {
        return this._text;
    },

}

// Symbol table class
const SymbolTable = function(patterns) {
    // fields
    this._auto = patterns;
    this._user = {};
    this._term = {};
}

// Symbol table prototype
SymbolTable.prototype = {

    // set the text of a variable
    "setText": function(name, text) {
        if (!isNaN(name)) {
            return;
        }
        if (text == null) {
            delete this._user[name];
        } else {
            this._user[name] = text;
        }
    },

    // set the operator term
    "setTerm": function(pair) {
        this._term[pair.name] = pair.term;
    },

    // get the text of a variable
    "getText": function(name) {
        if (isNaN(name)) {
            // user-defined variable
            if (name == null) {
                return "";
            }
            if (this._term[name] == null) {
                return this._user[name];
            } else {
                return this._term[name].getText(this);
            }
        }

        // auto-defined variable
        if (name < 0 || this._auto.length <= name) {
            return "";
        }
        return this._auto[name];
    },

}

