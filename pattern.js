// Pattern grammar object
var PatternGrammar = {

    "flag": "i",

    "terminals": [
        "\\|",
        "#",
        "\\$",
        "\\.",
        "\\[",
        "\\]",
        "\\^",
        "-",
        "\\(",
        "\\)",
        "\\*",
        "\\+",
        "\\?",
        "{",
        "}",
        ",",
        "[0-9]",
        "\\\\?.",
    ],

    "dummies": [
    ],

    "rules": [
        "#0#=1",
        "Selection=2",
        "#1#=3",
        "#1#=0",
        "Sequence=1",
        "#2#=2",
        "#2#=1",
        "Factor=2",
        "#3#=1",
        "#3#=1",
        "#3#=1",
        "#4#=1",
        "#4#=0",
        "Letter=1",
        "#5#=1",
        "#5#=1",
        "Digit=1",
        "NonDigit=1",
        "Class=1",
        "#9#=1",
        "#9#=1",
        "#9#=1",
        "#9#=4",
        "#6#=1",
        "#6#=0",
        "#8#=3",
        "#8#=2",
        "#7#=2",
        "#7#=0",
        "Group=3",
        "Iteration=1",
        "#12#=1",
        "#12#=1",
        "#12#=1",
        "#12#=4",
        "#11#=2",
        "#11#=0",
        "#10#=1",
        "#10#=0",
        "Integer=1",
        "#13#=2",
        "#13#=1",
    ],

    "table": [
        [ "", "s33", "s34", "s35", "s36", "", "", "", "s48", "", "", "", "", "", "", "", "s24", "s30", "", "g1", "", "g2", "g6", "g51", "g8", "", "g26", "g27", "g28", "g29", "g31", "g32", "", "", "", "g47", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r0", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r3", "", "", "", "", "", "", "", "", "r3", "", "", "", "", "", "", "", "", "r3", "", "g3", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "s4", "", "", "", "", "", "", "", "", "r1", "", "", "", "", "", "", "", "", "r1", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "s33", "s34", "s35", "s36", "", "", "", "s48", "", "", "", "", "", "", "", "s24", "s30", "", "", "", "g5", "g6", "g51", "g8", "", "g26", "g27", "g28", "g29", "g31", "g32", "", "", "", "g47", "", "", "", "", "", "" ],
        [ "r2", "", "", "", "", "", "", "", "", "r2", "", "", "", "", "", "", "", "", "r2", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r4", "s33", "s34", "s35", "s36", "", "", "", "s48", "r4", "", "", "", "", "", "", "s24", "s30", "r4", "", "", "", "", "g7", "g8", "", "g26", "g27", "g28", "g29", "g31", "g32", "", "", "", "g47", "", "", "", "", "", "" ],
        [ "r5", "r5", "r5", "r5", "r5", "", "", "", "r5", "r5", "", "", "", "", "", "", "r5", "r5", "r5", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r12", "r12", "r12", "r12", "r12", "", "", "", "r12", "r12", "s12", "s13", "s14", "s15", "", "", "r12", "r12", "r12", "", "", "", "", "", "", "g9", "", "", "", "", "", "", "", "", "", "", "g10", "g11", "", "", "", "" ],
        [ "r7", "r7", "r7", "r7", "r7", "", "", "", "r7", "r7", "", "", "", "", "", "", "r7", "r7", "r7", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r11", "r11", "r11", "r11", "r11", "", "", "", "r11", "r11", "", "", "", "", "", "", "r11", "r11", "r11", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r30", "r30", "r30", "r30", "r30", "", "", "", "r30", "r30", "", "", "", "", "", "", "r30", "r30", "r30", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r31", "r31", "r31", "r31", "r31", "", "", "", "r31", "r31", "", "", "", "", "", "", "r31", "r31", "r31", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r32", "r32", "r32", "r32", "r32", "", "", "", "r32", "r32", "", "", "", "", "", "", "r32", "r32", "r32", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r33", "r33", "r33", "r33", "r33", "", "", "", "r33", "r33", "", "", "", "", "", "", "r33", "r33", "r33", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "s24", "", "", "", "", "", "", "", "", "", "", "", "g25", "", "", "", "", "", "", "", "", "", "", "", "g16", "g22" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r36", "s19", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "g17", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "s18", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r34", "r34", "r34", "r34", "r34", "", "", "", "r34", "r34", "", "", "", "", "", "", "r34", "r34", "r34", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r38", "", "s24", "", "", "", "", "", "", "", "", "", "", "", "g25", "", "", "", "", "", "", "", "", "", "", "g20", "g21", "g22" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r35", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r37", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r39", "r39", "s24", "", "", "", "", "", "", "", "", "", "", "", "g23", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r40", "r40", "r40", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r16", "r16", "r16", "r16", "r16", "r16", "", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "r16", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r41", "r41", "r41", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r8", "r8", "r8", "r8", "r8", "", "", "", "r8", "r8", "r8", "r8", "r8", "r8", "", "", "r8", "r8", "r8", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r13", "r13", "r13", "r13", "r13", "r13", "", "r13", "r13", "r13", "r13", "r13", "r13", "r13", "", "", "r13", "r13", "r13", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r14", "r14", "r14", "r14", "r14", "r14", "", "r14", "r14", "r14", "r14", "r14", "r14", "r14", "", "", "r14", "r14", "r14", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r15", "r15", "r15", "r15", "r15", "r15", "", "r15", "r15", "r15", "r15", "r15", "r15", "r15", "", "", "r15", "r15", "r15", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r17", "r17", "r17", "r17", "r17", "r17", "", "r17", "r17", "r17", "r17", "r17", "r17", "r17", "", "", "r17", "r17", "r17", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r9", "r9", "r9", "r9", "r9", "", "", "", "r9", "r9", "r9", "r9", "r9", "r9", "", "", "r9", "r9", "r9", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r18", "r18", "r18", "r18", "r18", "", "", "", "r18", "r18", "r18", "r18", "r18", "r18", "", "", "r18", "r18", "r18", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r19", "r19", "r19", "r19", "r19", "", "", "", "r19", "r19", "r19", "r19", "r19", "r19", "", "", "r19", "r19", "r19", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r20", "r20", "r20", "r20", "r20", "", "", "", "r20", "r20", "r20", "r20", "r20", "r20", "", "", "r20", "r20", "r20", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r21", "r21", "r21", "r21", "r21", "", "", "", "r21", "r21", "r21", "r21", "r21", "r21", "", "", "r21", "r21", "r21", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "s46", "", "", "", "", "", "", "", "", "", "r24", "r24", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "g37", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "s24", "s30", "", "", "", "", "", "", "", "", "g44", "g27", "g28", "g29", "", "", "", "g38", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "s39", "", "", "", "", "", "", "", "", "", "", "s24", "s30", "", "", "", "", "", "", "", "", "g40", "g27", "g28", "g29", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r22", "r22", "r22", "r22", "r22", "", "", "", "r22", "r22", "r22", "r22", "r22", "r22", "", "", "r22", "r22", "r22", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "r28", "", "s42", "", "", "", "", "", "", "", "", "r28", "r28", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "g41", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "r25", "", "", "", "", "", "", "", "", "", "", "r25", "r25", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "s24", "s30", "", "", "", "", "", "", "", "", "g43", "g27", "g28", "g29", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "r27", "", "", "", "", "", "", "", "", "", "", "r27", "r27", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "r28", "", "s42", "", "", "", "", "", "", "", "", "r28", "r28", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "g45", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "r26", "", "", "", "", "", "", "", "", "", "", "r26", "r26", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "r23", "r23", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r10", "r10", "r10", "r10", "r10", "", "", "", "r10", "r10", "r10", "r10", "r10", "r10", "", "", "r10", "r10", "r10", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "", "s33", "s34", "s35", "s36", "", "", "", "s48", "", "", "", "", "", "", "", "s24", "s30", "", "g49", "", "g2", "g6", "g51", "g8", "", "g26", "g27", "g28", "g29", "g31", "g32", "", "", "", "g47", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "", "s50", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r29", "r29", "r29", "r29", "r29", "", "", "", "r29", "r29", "r29", "r29", "r29", "r29", "", "", "r29", "r29", "r29", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
        [ "r6", "r6", "r6", "r6", "r6", "", "", "", "r6", "r6", "", "", "", "", "", "", "r6", "r6", "r6", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ],
    ],

}

// Pattern syntax converter
var PatternConverter = {

    // Selection ::= Sequence ('|' Sequence)* ;
    "Selection": function(tree) {
        var iterators = [];
        for (var i = 0; i < tree.children.length; i += 2) {
            iterators.push(tree.children[i].iterator);
        }
        tree.iterator = new SelectionIterator(iterators);
    },

    // Sequence ::= Factor+ ;
    "Sequence": function(tree) {
        var iterators = [];
        for (var i = 0; i < tree.children.length; i++) {
            iterators.push(tree.children[i].iterator);
        }
        tree.iterator = new SequenceIterator(iterators);
    },

    // Factor ::= (Letter | Class | Group) Iteration? ;
    "Factor": function(tree) {
        // number of iterations
        var min = 1;
        var max = 1;
        if (1 < tree.children.length) {
            var iteration = tree.children[1];
            min = iteration.min;
            max = iteration.max;
        }

        // create a iterator
        var child = tree.children[0];
        tree.iterator = new FactorIterator(child.iterator, min, max);
    },

    // Letter ::= Digit | NonDigit ;
    "Letter": function(tree) {
        tree.text = tree.children[0].text;
        tree.iterator = new FiniteIterator([ tree.text ]);
    },

    // Digit ::= "[0-9]" ;
    "Digit": function(tree) {
        tree.text = tree.children[0].text;
    },

    // NonDigit ::= "\\?." ;
    "NonDigit": function(tree) {
        var text = tree.children[0].text;
        if (1 < text.length) {
            tree.text = text.substring(1);
        } else {
            tree.text = text;
        }
    },

    // Class ::= '#' | '$' | '.' | '[' '^'? (Letter ('-' Letter)?)+ ']' ;
    "Class": function(tree) {
        var texts = [];
        switch (tree.children[0].text) {
            case "#":
                texts = this._numbers.split("");
                break;

            case "$":
                texts = this._alphabets.split("");
                break;

            case ".":
                texts = (this._numbers + this._alphabets).split("");
                break;

            default:
                var last = tree.children.length - 2;
                var i = 1;
                var negative = false;
                if (tree.children[i].text == "^" && tree.children[i].label != "Letter") {
                    // negative character class
                    negative = true;
                    i++;
                }
                while (i <= last) {
                    // first value
                    var head = tree.children[i].text;
                    var tail = head;
                    i++;
                    if (tree.children[i].text == "-") {
                        // subsequent value
                        tail = tree.children[i + 1].text;
                        i += 2;
                    }

                    // create a list of values
                    for (var j = head.charCodeAt(0); j <= tail.charCodeAt(0); j++) {
                        var letter = String.fromCharCode(j);
                        if (texts.indexOf(letter) < 0) {
                            texts.push(letter);
                        }
                    }
                }
                if (negative) {
                    // negative character class
                    var removes = texts;
                    var find = function(element) { return removes.indexOf(element) < 0; };
                    texts = (this._numbers + this._alphabets).split("").filter(find);
                }
                break;
        }
        tree.iterator = new FiniteIterator(texts);
    },

    // Group ::= '(' Selection ')' ;
    "Group": function(tree) {
        tree.iterator = tree.children[1].iterator;
    },

    // Iteration ::= '*' | '+' | '?' | '{' Integer (',' Integer?)? '}' ;
    "Iteration": function(tree) {
        switch (tree.children[0].text) {
            case "*":
                tree.min = 0;
                tree.max = -1;
                break;

            case "+":
                tree.min = 1;
                tree.max = -1;
                break;

            case "?":
                tree.min = 0;
                tree.max = 1;
                break;

            default:
                tree.min = tree.children[1].value;
                switch (tree.children.length) {
                    case 3:
                        tree.max = tree.min;
                        break;
                    case 4:
                        tree.max = -1;
                        break;
                    case 5:
                        tree.max = tree.children[3].value;
                        break;
                }
                break;
        }
    },

    // Integer ::= Digit+ ;
    "Integer": function(tree) {
        var text = "";
        for (var i = 0; i < tree.children.length; i++) {
            text += tree.children[i].text;
        }
        tree.value = parseInt(text, 10);
    },

    // list of numbers
    "_numbers": "0123456789",

    // list of alphabets
    "_alphabets": "abcdefghijklmnopqrstuvwxyz",

}

