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
                if (this.compare == "==") {
                    result = text.equals(second);
                } else if (this.compare == "!=" || this.compare == "<>") {
                    result = text.notEquals(second);
                } else if (this.compare == "<") {
                    result = text.lesser(second);
                } else if (this.compare == "<=") {
                    result = text.lesserOrEquals(second);
                } else if (this.compare == ">") {
                    result = text.greater(second);
                } else if (this.compare == ">=") {
                    result = text.greaterOrEquals(second);
                }
            } else {
                // otherwise
                if (this.compare == "==") {
                    result = (text == second);
                } else if (this.compare == "!=" || this.compare == "<>") {
                    result = (text != second);
                } else if (this.compare == "<") {
                    result = (text < second);
                } else if (this.compare == "<=") {
                    result = (text <= second);
                } else if (this.compare == ">") {
                    result = (text > second);
                } else if (this.compare == ">=") {
                    result = (text >= second);
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
            const operator = this.operators[i];
            const follow = this.follows[i].getText(patterns);
            if (operator == "+") {
                text = PatternCommon.toInt(text).add(PatternCommon.toInt(follow));
            } else if (operator == "-") {
                text = PatternCommon.toInt(text).subtract(PatternCommon.toInt(follow));
            } else {
                text += "" + follow;
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
            const operator = this.operators[i];
            const follow = PatternCommon.toInt(this.follows[i].getText(patterns));
            if (operator == "*") {
                value = value.multiply(follow);
            } else if (operator == "/") {
                value = value.divide(follow);
            } else {
                value = value.mod(follow);
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
    // properties
    this.name = name;
    this.sign = 1;
    this.term = null;
    this.value = null;
}

// Method prototype
SyntaxMethod.prototype = {

    // set pattern value
    "setValue": function(pattern) {
        this.value = pattern;
    },

    // get result text
    "getText": function(patterns) {
        // get the argument
        const positive = PatternCommon.toInt(this.term.getText(patterns));
        const number = positive.multiply(this.sign);
        const length = this.value.length;

        // execute the method
        switch (this.name) {
            case "at":
                if (positive.greater(length) || number.equals(length)) {
                    return "";
                }
                if (number.isNegative()) {
                    return this.value[number.add(length)];
                } else {
                    return this.value[number];
                }

            case "rotate":
                let rotate = number.mod(length);
                if (rotate.isNegative()) {
                    rotate = rotate.add(length);
                }
                return this.value.substring(rotate) + this.value.substring(0, rotate);

            case "skip":
                if (positive.greater(length) || number.equals(length)) {
                    return "";
                }
                if (number.isNegative()) {
                    return this.value.substring(0, number.add(length));
                } else {
                    return this.value.substring(number);
                }

            case "take":
                if (positive.lesser(length)) {
                    if (number.isNegative()) {
                        return this.value.substring(number.add(length));
                    } else {
                        return this.value.substring(0, number);
                    }
                }
                break;
        }
        return this.value;
    },

}

// Variable class
const SyntaxVariable = function(number) {
    // fields
    if (isNaN(number)) {
        this._number = 0;
    } else {
        this._number = number;
    }
}

// Variable prototype
SyntaxVariable.prototype = {

    // get result text
    "getText": function(patterns) {
        // check the fields
        if (this._number < 0 || patterns.length <= this._number) {
            return "";
        }
        return patterns[this._number];
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

