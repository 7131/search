// WHERE syntax class
const SyntaxWhere = function() {
    // properties
    this.condition = null;
}

// WHERE syntax prototype
SyntaxWhere.prototype = {

    // whether the conditions are met
    "isValid": function(patterns) {
        // check the properties
        if (this.condition == null) {
            return true;
        }

        // judgment
        if (this.condition.getText(patterns)) {
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
    "getText": function(patterns) {
        // check the properties
        if (this.list.length == 0) {
            return patterns[0];
        }

        // get value
        let text = "";
        for (let i = 0; i < this.list.length; i++) {
            text += this.list[i].getText(patterns);
        }
        return text;
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
        for (let i = 0; i < this.list.length; i++) {
            // compare in order
            const single = this.list[i];
            const x = single.value.getText(a.patterns);
            const y = single.value.getText(b.patterns);
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
    "getText": function(patterns) {
        // first text
        let text = this.list[0].getText(patterns);
        if (this.list.length == 1) {
            return text;
        }
        if (text && text !== "0") {
            return 1;
        }

        // second and subsequent text
        for (let i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(patterns);
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
    "getText": function(patterns) {
        // first text
        let text = this.list[0].getText(patterns);
        if (this.list.length == 1) {
            return text;
        }
        if (!text || text === "0") {
            return 0;
        }

        // second and subsequent text
        for (let i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(patterns);
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
    "getText": function(patterns) {
        // text
        const text = this.expression.getText(patterns);
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
    "getText": function(patterns) {
        let result = false;
        let text = this.first.getText(patterns);
        if (this.clause == null) {
            // no comparison target
            if (!this.compare) {
                return text;
            }

            // get the comparison target
            let second = this.second.getText(patterns);
            if (PatternCommon.isInt(text) && !PatternCommon.isInt(second)) {
                second = PatternCommon.toInt(second);
            }
            if (!PatternCommon.isInt(text) && PatternCommon.isInt(second)) {
                text = PatternCommon.toInt(text);
            }

            // compare
            if (PatternCommon.isInt(text)) {
                // for BigInt
                switch (this.compare) {
                    case "==":
                        result = text.equals(second);
                        break;

                    case "!=":
                    case "<>":
                        result = text.notEquals(second);
                        break;

                    case "<":
                        result = text.lesser(second);
                        break;

                    case "<=":
                        result = text.lesserOrEquals(second);
                        break;

                    case ">":
                        result = text.greater(second);
                        break;

                    case ">=":
                        result = text.greaterOrEquals(second);
                        break;
                }
            } else {
                // otherwise
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
    "getText": function(patterns) {
        // check the properties
        let text = this.first.getText(patterns);
        if (this.operators.length == 0) {
            return text;
        }

        // addition and subtraction
        for (let i = 0; i < this.operators.length; i++) {
            const follow = this.follows[i].getText(patterns);
            switch (this.operators[i]) {
                case "+":
                    text = PatternCommon.toInt(text).add(PatternCommon.toInt(follow));
                    break;

                case "-":
                    text = PatternCommon.toInt(text).subtract(PatternCommon.toInt(follow));
                    break;

                default:
                    text += "" + follow;
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
    "getText": function(patterns) {
        // check the properties
        const text = this.first.getText(patterns);
        if (this.operators.length == 0) {
            return text;
        }

        // multiplication and division
        let value = PatternCommon.toInt(text);
        for (let i = 0; i < this.operators.length; i++) {
            const follow = PatternCommon.toInt(this.follows[i].getText(patterns));
            switch (this.operators[i]) {
                case "*":
                    value = value.multiply(follow);
                    break;

                case "/":
                    value = value.divide(follow);
                    break;

                default:
                    value = value.mod(follow);
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
    "getText": function(patterns) {
        // convert to pattern value
        let text = this.element.getText(patterns);
        for (let i = 0; i < this.follows.length; i++) {
            this.follows[i].setValue(text);
            text = this.follows[i].getText(patterns);
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
    "getText": function(patterns) {
        return this.value.getProperty(this.name);
    },

}

// Method class
const SyntaxMethod = function(name) {
    // fields
    this._name = name;
    this._sign = 1;
    this._term = null;
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

    // set the term
    "setTerm": function(term, sign) {
        this._term = term;
        this._sign = sign;
    },

    // set pattern value
    "setValue": function(pattern) {
        this._value = pattern;
    },

    // get result text
    "getText": function(patterns) {
        // get method
        const method = this._functions[this._name];
        if (method == null) {
            return this._value;
        }

        // execute the method
        const positive = PatternCommon.toInt(this._term.getText(patterns));
        const number = positive.multiply(this._sign);
        const length = this._value.length;
        return method(positive, number, length);
    },

    // get the value at the specified position
    "_getAt": function(positive, number, length) {
        if (positive.greater(length) || number.equals(length)) {
            return "";
        }
        if (number.isNegative()) {
            return this._value[number.add(length)];
        } else {
            return this._value[number];
        }
    },

    // get the rotated value
    "_getRotate": function(positive, number, length) {
        let rotate = number.mod(length);
        if (rotate.isNegative()) {
            rotate = rotate.add(length);
        }
        return this._value.substring(rotate) + this._value.substring(0, rotate);
    },

    // get the skipped value
    "_getSkip": function(positive, number, length) {
        if (positive.greater(length) || number.equals(length)) {
            return "";
        }
        if (number.isNegative()) {
            return this._value.substring(0, number.add(length));
        } else {
            return this._value.substring(number);
        }
    },

    // get the value from the beginning
    "_getTake": function(positive, number, length) {
        if (positive.greater(length) || number.equals(length)) {
            return this._value;
        }
        if (number.isNegative()) {
            return this._value.substring(number.add(length));
        } else {
            return this._value.substring(0, number);
        }
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
        this._value = pattern;
    },

    // get result text
    "getText": function(patterns) {
        // set user-defined variables
        if (this._lambda.whole != null) {
            SymbolTable[this._lambda.whole] = this._value;
        }

        // execution of iterator
        let result = "";
        const method = this._functions[this._name];
        if (method != null) {
            result = method(patterns);
        }

        // delete user-defined variables
        delete SymbolTable[this._lambda.index];
        if (this._lambda.whole != null) {
            delete SymbolTable[this._lambda.whole];
        }
        return result;
    },

    // test for all indexes
    "_testsEvery": function(patterns) {
        for (let i = 0; i < this._value.length; i++) {
            SymbolTable[this._lambda.index] = i;
            const text = this._lambda.getText(patterns);
            if (!text || text === "0") {
                return 0;
            }
        }
        return 1;
    },

    // test for any index
    "_testsSome": function(patterns) {
        for (let i = 0; i < this._value.length; i++) {
            SymbolTable[this._lambda.index] = i;
            const text = this._lambda.getText(patterns);
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
    "getText": function(patterns) {
        return this.condition.getText(patterns);
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
    "getText": function(patterns) {
        // check the fields
        if (this._number < 0 || patterns.length <= this._number) {
            return "";
        }
        return patterns[this._number];
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
    "getText": function(patterns) {
        // check the fields
        if (SymbolTable[this._name] == null) {
            return "";
        }
        return SymbolTable[this._name];
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
    "getText": function(patterns) {
        return this._text;
    },

}

// Symbol Table object
const SymbolTable = {};

