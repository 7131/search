// Semantic analyzer class
const SemanticAnalyzer = function() {
    // fields
    this._symbols = new Set();
    this._duplicate = new Set();
    this._used = new Set();
    this._undefined = new Set();
}

// Semantic analyzer prototype
SemanticAnalyzer.prototype = {

    // validate syntax
    "validate": function(tree) {
        // classify
        const definitions = [];
        const expressions = [];
        for (let i = 0; i < tree.children.length; i++) {
            const clause = tree.children[i];
            if (clause.label == "Let") {
                const name = clause.children[1].children[0].text;
                const reference = this._getReference(clause.children[3]);
                definitions.push({ "name": name, "reference": reference, "tree": clause.children[3] });
                if (this._symbols.has(name)) {
                    this._duplicate.add(name);
                }
                this._symbols.add(name);
            } else {
                expressions.push(this._getLast(clause.children));
            }
        }
        const empties = this._getEmpties(definitions);
        const parts = definitions.filter(elem => !empties.has(elem.name));

        // circular reference
        const circular = this._getCircular(parts);
        if (0 < circular.size) {
            return this._getError("circular reference of variables", parts.map(elem => elem.name), circular);
        }

        // using variables
        const current = Array.from(empties);
        for (let i = 0; i < expressions.length; i++) {
            this._validateReference(current, expressions[i], parts);
        }
        if (0 < this._duplicate.size) {
            return this._getError("duplicate variables", this._symbols, this._duplicate);
        }
        if (0 < this._undefined.size) {
            return this._getError("using undefined variables", this._used, this._undefined);
        }
        return { "message": "" };
    },

    // get unreferenced variables
    "_getEmpties": function(definitions) {
        // classify variables
        const empties = new Set();
        const rest = new Map();
        for (let i = 0; i < definitions.length; i++) {
            const name = definitions[i].name;
            const reference = definitions[i].reference;
            if (reference.size == 0) {
                empties.add(name);
            } else {
                rest.set(name, new Set(reference));
            }
        }

        // references to unreferenced variables
        let before = definitions.length;
        while (rest.size < before) {
            before = rest.size;
            for (let name of rest.keys()) {
                const reference = rest.get(name);
                for (let empty of empties) {
                    reference.delete(empty);
                }
                if (reference.size == 0) {
                    rest.delete(name);
                    empties.add(name);
                }
            }
        }
        return empties;
    },

    // get circular references
    "_getCircular": function(definitions) {
        // classify variables
        const circular = new Set();
        const rest = new Map();
        for (let i = 0; i < definitions.length; i++) {
            const name = definitions[i].name;
            const reference = definitions[i].reference;
            if (reference.has(name)) {
                circular.add(name);
            }
            rest.set(name, new Set(reference));
        }

        // get cross-references
        let dealt = true;
        while (dealt) {
            dealt = false;
            for (let name of rest.keys()) {
                const reference = rest.get(name);
                for (let values of rest.values()) {
                    if (values.has(name)) {
                        const before = values.size;
                        reference.forEach((value, key) => values.add(key));
                        dealt ||= before < values.size;
                    }
                }
            }
            for (let name of rest.keys()) {
                if (rest.get(name).has(name)) {
                    circular.add(name);
                }
            }
        }
        return circular;
    },

    // get referencing variables
    "_getReference": function(tree) {
        const reference = new Set();
        if (tree.label == "Element") {
            // using a variable
            const first = tree.children[0];
            if (first.label == "User") {
                reference.add(first.children[0].text);
            }
        } else {
            // other
            for (let i = 0; i < tree.children.length; i++) {
                const sub = this._getReference(tree.children[i]);
                for (let name of sub) {
                    reference.add(name);
                }
            }
        }
        return reference;
    },

    // validate referencing variables
    "_validateReference": function(current, tree, definitions) {
        switch (tree.label) {
            case "Element":
                // using a variable
                const first = tree.children[0];
                if (first.label != "User") {
                    break;
                }
                const name = first.children[0].text;
                this._used.add(name);
                if (0 <= current.indexOf(name)) {
                    break;
                }
                let count = 0;
                for (let i = 0; i < definitions.length; i++) {
                    if (definitions[i].name == name) {
                        this._validateReference(current, definitions[i].tree, definitions);
                        count++;
                    }
                }
                if (count == 0) {
                    this._undefined.add(name);
                }
                break;

            case "Lambda":
                // defining a variable
                const index = tree.children[0].children[0].text;
                if (0 <= current.indexOf(index)) {
                    this._duplicate.add(index);
                }
                this._symbols.add(index);
                current.push(index);
                const next = tree.children[2];
                const whole = next.children[0].text;
                if (next.label == "User") {
                    if (0 <= current.indexOf(whole)) {
                        this._duplicate.add(whole);
                    }
                    this._symbols.add(whole);
                    current.push(whole);
                    this._validateReference(current, this._getLast(tree.children), definitions);
                    current.pop();
                } else {
                    this._validateReference(current, this._getLast(tree.children), definitions);
                }
                current.pop();
                break;

            default:
                // other
                for (let i = 0; i < tree.children.length; i++) {
                    this._validateReference(current, tree.children[i], definitions);
                }
                break;
        }
    },

    // get the error
    "_getError": function(message, symbols, errors) {
        const valid = Array.from(symbols).filter(elem => !errors.has(elem)).join();
        const invalid = Array.from(errors).join();
        return { "message": message, "valid": valid, "invalid": invalid };
    },

    // get the last element of an array
    "_getLast": function(array) {
        return array[array.length - 1];
    },

}

