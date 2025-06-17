// Token class
const Token = function(label) {
    this.setPattern(label, "");
}

// Token prototype
Token.prototype = {

    // set the pattern
    "setPattern": function(label, text) {
        if (label == null) {
            this.label = "";
        } else {
            this.label = label;
        }
        if (text == null) {
            this.text = "";
        } else {
            this.text = text;
        }
        this.length = text.length;
    },

}

// Syntax tree class
const Tree = function(label, text) {
    if (label == null) {
        this.label = "";
    } else {
        this.label = label;
    }
    if (text == null) {
        this.text = "";
    } else {
        this.text = text;
    }
    this.children = [];
}

// State stack class
const StateStack = function() {
    this._stack = [];
}

// State stack prototype
StateStack.prototype = {

    // push a state pair to the stack top
    "push": function(tree, state) {
        const pair = { "tree": tree, "state": state };
        this._stack.push(pair);
    },

    // pop a state pair from the stack top, remove it, and return the tree
    "popTree": function() {
        const last = this._stack.length - 1;
        if (last < 0) {
            return null;
        } else {
            const pair = this._stack.pop();
            return pair.tree;
        }
    },

    // peek the state number of the stack top
    "peekState": function() {
        const last = this._stack.length - 1;
        if (last < 0) {
            return 0;
        } else {
            return this._stack[last].state;
        }
    },

    // get the number of the stack items
    "getCount": function() {
        return this._stack.length;
    },

}

// Syntax parser class
const Parser = function(grammar, converter) {
    // terminal symbols
    const terms = grammar.terminals.concat(grammar.dummies);
    this._terminals = terms.map(this._quoteSingle);
    this._dummies = grammar.dummies.map(this._quoteSingle);

    // lexical analysis elements
    this._elements = [];
    terms.forEach(elem => this._elements.push(new RegExp("^(" + elem + ")", grammar.flag)));

    // production rules
    this._rules = [];
    const nonterms = [];
    for (let i = 0; i < grammar.rules.length; i++) {
        const pair = grammar.rules[i].split("=");
        const symbol = pair[0];
        this._rules.push({ "symbol": symbol, "count": parseInt(pair[1], 10) });
        if (0 < i && nonterms.indexOf(symbol) < 0) {
            // non-terminal symbols
            nonterms.push(symbol);
        }
    }
    nonterms.unshift("$");
    const symbols = grammar.terminals.map(this._quoteSingle).concat(nonterms);

    // parsing table
    this._table = [];
    for (const line of grammar.table) {
        const row = {};
        for (let i = 0; i < symbols.length; i++) {
            const match = line[i].match(/^(s|r|g)([0-9]+)$/);
            if (match) {
                const symbol = match[1];
                const number = parseInt(match[2], 10);
                row[symbols[i]] = { "symbol": symbol, "number": number };
            }
        }
        this._table.push(row);
    }
    this._converter = converter;
}

// Syntax parser prototype
Parser.prototype = {

    // lexical analysis
    "tokenize": function(text) {
        const tokens = [];
        while (0 < text.length) {
            const max = new Token();
            for (let i = 0; i < this._elements.length; i++) {
                const result = this._elements[i].exec(text);
                if (result != null && max.length < result[0].length) {
                    // get the longest and the first token
                    max.setPattern(this._terminals[i], result[0]);
                }
            }
            if (0 < max.length) {
                // found a token
                if (this._dummies.indexOf(max.label) < 0) {
                    tokens.push(max);
                }
                text = text.substring(max.length);
            } else {
                // not found a token
                break;
            }
        }

        // get the result
        if (0 < text.length) {
            const valid = tokens.reduce(this._joinTokens, "");
            return { "tokens": null, "valid": valid.trim(), "invalid": text };
        }
        return { "tokens": tokens };
    },

    // syntactic analysis
    "parse": function(tokens) {
        const stack = new StateStack();

        // dealing all tokens
        tokens.push(new Token("$"));
        while (0 < tokens.length) {
            const next = tokens[0];
            const label = next.label;

            // execute an action
            const action = this._table[stack.peekState()][label];
            if (!action) {
                break;
            }
            if (action.symbol == "s") {
                // shift
                const leaf = new Tree(label, next.text);
                stack.push(leaf, action.number);
                tokens.shift();
            } else {
                // reduce
                const rule = this._rules[action.number];
                const nodes = [];
                for (let i = 0; i < rule.count; i++) {
                    const top = stack.popTree();
                    if (top.label.charAt(0) == "#") {
                        // a non-terminal symbol that should be removed
                        Array.prototype.unshift.apply(nodes, top.children);
                    } else {
                        nodes.unshift(top);
                    }
                }

                // create a syntax tree
                const node = new Tree(rule.symbol);
                node.children = nodes;
                if (this._converter[node.label]) {
                    this._converter[node.label](node);
                }

                // accept
                if (action.number == 0) {
                    return { "tree": node.children[0] };
                }

                // transit
                const goto = this._table[stack.peekState()][node.label];
                if (!goto) {
                    break;
                }
                stack.push(node, goto.number);
            }
        }

        // the case of not to accept
        let valid = "";
        while (0 < stack.getCount()) {
            const tree = stack.popTree();
            valid = this._joinTree(tree) + " " + valid;
        }
        const invalid = tokens.reduce(this._joinTokens, "");
        return { "tree": null, "valid": valid.trim(), "invalid": invalid.trim() };
    },

    // add the single quatations
    "_quoteSingle": function(cur) {
        const text = cur.replace(/\\(.)/g, "$1");
        return "'" + text + "'";
    },

    // join the token strings
    "_joinTokens": function(acc, cur) {
        return acc + " " + cur.text;
    },

    // join the tree strings
    "_joinTree": function(tree) {
        if (tree.text != "") {
            return tree.text;
        }

        // join all child elements
        let text = "";
        tree.children.forEach(elem => text += " " + this._joinTree(elem));
        return text;
    },

}

