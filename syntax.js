// WHERE syntax class
var SyntaxWhere = function() {
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
var SyntaxSelect = function() {
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
        var text = "";
        for (var i = 0; i < this.list.length; i++) {
            text += this.list[i].getText(patterns);
        }
        return text;
    },

}

// ORDER BY syntax class
var SyntaxOrder = function() {
    // properties
    this.list = [];
}

// ORDER BY syntax prototype
SyntaxOrder.prototype = {

    // compare the magnitude of two values
    "compare": function(a, b) {
        for (var i = 0; i < this.list.length; i++) {
            // compare in order
            var single = this.list[i];
            var x = single.value.getText(a.patterns);
            var y = single.value.getText(b.patterns);
            if (x != y) {
                var result = 1;
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
var SyntaxCondition = function() {
    // properties
    this.list = [];
}

// Search condition prototype
SyntaxCondition.prototype = {

    // get result text
    "getText": function(patterns) {
        // first text
        var text = this.list[0].getText(patterns);
        if (this.list.length == 1) {
            return text;
        }
        if (text && text !== "0") {
            return 1;
        }

        // second and subsequent text
        for (var i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(patterns);
            if (text && text !== "0") {
                return 1;
            }
        }
        return 0;
    },

}

// Condition part class
var SyntaxPart = function() {
    // properties
    this.list = [];
}

// Condition part prototype
SyntaxPart.prototype = {

    // get result text
    "getText": function(patterns) {
        // first text
        var text = this.list[0].getText(patterns);
        if (this.list.length == 1) {
            return text;
        }
        if (!text || text === "0") {
            return 0;
        }

        // second and subsequent text
        for (var i = 1; i < this.list.length; i++) {
            text = this.list[i].getText(patterns);
            if (!text || text === "0") {
                return 0;
            }
        }
        return 1;
    },

}

// Condition unit class
var SyntaxUnit = function() {
    // properties
    this.not = false;
    this.expression = null;
}

// Condition unit prototype
SyntaxUnit.prototype = {

    // get result text
    "getText": function(patterns) {
        // text
        var text = this.expression.getText(patterns);
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
var SyntaxExpression = function(first) {
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
        var result = false;
        var text = this.first.getText(patterns);
        if (this.clause == null) {
            // no comparison target
            if (!this.compare) {
                return text;
            }

            // compare
            var second = this.second.getText(patterns);
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
        } else {
            // IN clause
            var i = 0;
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
var SyntaxTerm = function(first) {
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
        var text = this.first.getText(patterns);
        if (this.operators.length == 0) {
            return text;
        }

        // addition and subtraction
        for (var i = 0; i < this.operators.length; i++) {
            var operator = this.operators[i];
            var follow = this.follows[i].getText(patterns);
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
var SyntaxFactor = function(first) {
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
        var text = this.first.getText(patterns);
        if (this.operators.length == 0) {
            return text;
        }

        // multiplication and division
        var value = PatternCommon.toInt(text);
        for (var i = 0; i < this.operators.length; i++) {
            var operator = this.operators[i];
            var follow = PatternCommon.toInt(this.follows[i].getText(patterns));
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
var SyntaxValue = function(element) {
    // properties
    this.element = element;
    this.properties = [];
}

// Operator value prototype
SyntaxValue.prototype = {

    // get result text
    "getText": function(patterns) {
        // convert to pattern value
        var text = this.element.getText(patterns);
        for (var i = 0; i < this.properties.length; i++) {
            var value = new PatternValue(text);
            text = value.getProperty(this.properties[i]);
        }
        return text;
    },

}

// Variable class
var SyntaxVariable = function(number) {
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
var SyntaxLiteral = function(text) {
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

