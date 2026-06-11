// Token class
class Token {

    // constructor
    constructor(label) {
        this.setPattern(label, "");
    }

    // set the pattern
    setPattern(label, text) {
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
    }

}

// Syntax tree class
class Tree {

    // constructor
    constructor(label, text) {
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

}

// State stack class
class StateStack {
    #stack = [];

    // push a state pair to the stack top
    push(tree, state) {
        const pair = { "tree": tree, "state": state };
        this.#stack.push(pair);
    }

    // pop a state pair from the stack top, remove it, and return the tree
    popTree() {
        const last = this.#stack.length - 1;
        if (last < 0) {
            return null;
        } else {
            const pair = this.#stack.pop();
            return pair.tree;
        }
    }

    // peek the state number of the stack top
    peekState() {
        const last = this.#stack.length - 1;
        if (last < 0) {
            return 0;
        } else {
            return this.#stack[last].state;
        }
    }

    // get the number of the stack items
    getCount() {
        return this.#stack.length;
    }

}

// Syntax parser class
class Parser {
    #terminals;
    #dummies;
    #elements;
    #converter;
    #rules = [];
    #table = [];

    // constructor
    constructor(grammar, converter) {
        // terminal symbols
        const terms = grammar.terminals.concat(grammar.dummies);
        this.#terminals = terms.map(this.#quoteSingle);
        this.#dummies = grammar.dummies.map(this.#quoteSingle);
        this.#elements = terms.map(elem => new RegExp(`^(${elem})`, grammar.flag));

        // production rules
        const nonterms = [];
        for (let i = 0; i < grammar.rules.length; i++) {
            const pair = grammar.rules[i].split("=");
            const symbol = pair[0];
            this.#rules.push({ "symbol": symbol, "count": parseInt(pair[1], 10) });
            if (0 < i && nonterms.indexOf(symbol) < 0) {
                // non-terminal symbols
                nonterms.push(symbol);
            }
        }
        nonterms.unshift("$");
        const symbols = grammar.terminals.map(this.#quoteSingle).concat(nonterms);

        // parsing table
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
            this.#table.push(row);
        }
        this.#converter = converter;
    }

    // lexical analysis
    tokenize(text) {
        const tokens = [];
        while (0 < text.length) {
            const max = new Token();
            for (let i = 0; i < this.#elements.length; i++) {
                const result = this.#elements[i].exec(text);
                if (result != null && max.length < result[0].length) {
                    // get the longest and the first token
                    max.setPattern(this.#terminals[i], result[0]);
                }
            }
            if (0 < max.length) {
                // found a token
                if (this.#dummies.indexOf(max.label) < 0) {
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
            const valid = tokens.map(elem => elem.text).join(" ");
            return { "tokens": null, "valid": valid.trim(), "invalid": text };
        }
        return { "tokens": tokens };
    }

    // syntactic analysis
    parse(tokens) {
        const stack = new StateStack();

        // dealing all tokens
        tokens.push(new Token("$"));
        while (0 < tokens.length) {
            const next = tokens[0];
            const label = next.label;

            // execute an action
            const action = this.#table[stack.peekState()][label];
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
                const rule = this.#rules[action.number];
                let nodes = [];
                for (let i = 0; i < rule.count; i++) {
                    const top = stack.popTree();
                    if (top.label.charAt(0) == "#") {
                        // a non-terminal symbol that should be removed
                        nodes = top.children.concat(nodes);
                    } else {
                        nodes.unshift(top);
                    }
                }

                // create a syntax tree
                const node = new Tree(rule.symbol);
                node.children = nodes;
                if (this.#converter[node.label]) {
                    this.#converter[node.label](node);
                }

                // accept
                if (action.number == 0) {
                    return { "tree": node.children[0] };
                }

                // transit
                const goto = this.#table[stack.peekState()][node.label];
                if (!goto) {
                    break;
                }
                stack.push(node, goto.number);
            }
        }

        // the case of not to accept
        let valid = "";
        while (0 < stack.getCount()) {
            valid = `${this.#joinTree(stack.popTree())} ${valid}`;
        }
        const invalid = tokens.map(elem => elem.text).join(" ");
        return { "tree": null, "valid": valid.trim(), "invalid": invalid.trim() };
    }

    // add the single quatations
    #quoteSingle(cur) {
        const text = cur.replace(/\\(.)/g, "$1");
        return `'${text}'`;
    }

    // join the tree strings
    #joinTree(tree) {
        if (tree.text != "") {
            return tree.text;
        }
        return tree.children.map(this.#joinTree, this).join(" ");
    }

}

