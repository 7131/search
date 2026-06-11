// Semantic analyzer class
class SemanticAnalyzer {
    #symbols = new Set();
    #duplicate = new Set();
    #used = new Set();
    #undefined = new Set();

    // validate syntax
    validate(tree) {
        // classify
        const definitions = [];
        const expressions = [];
        for (const clause of tree.children) {
            if (clause.label == "Let") {
                const name = clause.children[1].children[0].text;
                const reference = this.#getReference(clause.children[3]);
                definitions.push({ "name": name, "reference": reference, "tree": clause.children[3] });
                if (this.#symbols.has(name)) {
                    this.#duplicate.add(name);
                }
                this.#symbols.add(name);
            } else {
                expressions.push(this.#getLast(clause.children));
            }
        }
        const empties = this.#getEmpties(definitions);
        const parts = definitions.filter(elem => !empties.has(elem.name));

        // circular reference
        const circular = this.#getCircular(parts);
        if (0 < circular.size) {
            return this.#getError("circular reference of variables", parts.map(elem => elem.name), circular);
        }

        // using variables
        const current = Array.from(empties);
        expressions.forEach(elem => this.#validateReference(current, elem, parts));
        if (0 < this.#duplicate.size) {
            return this.#getError("duplicate variables", this.#symbols, this.#duplicate);
        }
        if (0 < this.#undefined.size) {
            return this.#getError("using undefined variables", this.#used, this.#undefined);
        }
        return { "message": "" };
    }

    // get unreferenced variables
    #getEmpties(definitions) {
        // classify variables
        const empties = new Set();
        const rest = new Map();
        for (const definition of definitions) {
            const name = definition.name;
            const reference = definition.reference;
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
            for (const name of rest.keys()) {
                const reference = rest.get(name);
                empties.forEach(reference.delete, reference);
                if (reference.size == 0) {
                    rest.delete(name);
                    empties.add(name);
                }
            }
        }
        return empties;
    }

    // get circular references
    #getCircular(definitions) {
        // classify variables
        const circular = new Set();
        const rest = new Map();
        for (const definition of definitions) {
            const name = definition.name;
            const reference = definition.reference;
            if (reference.has(name)) {
                circular.add(name);
            }
            rest.set(name, new Set(reference));
        }

        // get cross-references
        let dealt = true;
        while (dealt) {
            dealt = false;
            for (const name of rest.keys()) {
                const reference = rest.get(name);
                for (const values of rest.values().filter(elem => elem.has(name))) {
                    const before = values.size;
                    reference.forEach((val, key) => values.add(key));
                    dealt ||= before < values.size;
                }
            }
            rest.keys().filter(elem => rest.get(elem).has(elem)).forEach(elem => circular.add(elem));
        }
        return circular;
    }

    // get referencing variables
    #getReference(tree) {
        const reference = new Set();
        if (tree.label == "Element") {
            // using a variable
            const first = tree.children[0];
            if (first.label == "User") {
                reference.add(first.children[0].text);
            }
        } else {
            // other
            tree.children.forEach(elem => this.#getReference(elem).forEach(reference.add, reference));
        }
        return reference;
    }

    // validate referencing variables
    #validateReference(current, tree, definitions) {
        switch (tree.label) {
            case "Element":
                // using a variable
                const first = tree.children[0];
                if (first.label != "User") {
                    break;
                }
                const name = first.children[0].text;
                this.#used.add(name);
                if (0 <= current.indexOf(name)) {
                    break;
                }
                const selection = definitions.filter(elem => elem.name == name);
                selection.forEach(elem => this.#validateReference(current, elem.tree, definitions));
                if (selection.length == 0) {
                    this.#undefined.add(name);
                }
                break;

            case "Lambda":
                // defining a variable
                const index = tree.children[0].children[0].text;
                if (0 <= current.indexOf(index)) {
                    this.#duplicate.add(index);
                }
                this.#symbols.add(index);
                current.push(index);
                const next = tree.children[2];
                const whole = next.children[0].text;
                if (next.label == "User") {
                    if (0 <= current.indexOf(whole)) {
                        this.#duplicate.add(whole);
                    }
                    this.#symbols.add(whole);
                    current.push(whole);
                    this.#validateReference(current, this.#getLast(tree.children), definitions);
                    current.pop();
                } else {
                    this.#validateReference(current, this.#getLast(tree.children), definitions);
                }
                current.pop();
                break;

            default:
                // other
                tree.children.forEach(elem => this.#validateReference(current, elem, definitions));
                break;
        }
    }

    // get the error
    #getError(message, symbols, errors) {
        const valid = Array.from(symbols).filter(elem => !errors.has(elem)).join();
        const invalid = Array.from(errors).join();
        return { "message": message, "valid": valid, "invalid": invalid };
    }

    // get the last element of an array
    #getLast(array) {
        return array[array.length - 1];
    }

}

