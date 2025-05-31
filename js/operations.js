// automata-project/js/operations.js

/**
 * Checks if a given Finite Automaton is deterministic.
 * A DFA must have exactly one transition for each state-symbol pair.
 * It cannot have epsilon transitions.
 * @param {FiniteAutomaton} fa - The FA to check.
 * @returns {boolean} True if the FA is deterministic, false otherwise.
 */
function isDeterministic(fa) {
    // Check for epsilon transitions
    if (fa.transitions.some(t => t.symbol === 'epsilon')) {
        return false;
    }

    for (const state of fa.states) {
        for (const symbol of fa.alphabet) {
            const transitionsForSymbol = fa.transitions.filter(
                t => t.fromState.equals(state) && t.symbol === symbol
            );
            if (transitionsForSymbol.length !== 1 || transitionsForSymbol[0].toStates.length !== 1) {
                // For a complete DFA, all state-symbol pairs must have exactly one transition.
                // If a transition is missing or leads to multiple states, it's not a DFA.
                return false;
            }
        }
    }
    return true;
}


/**
 * Tests if a given string is accepted by a DFA.
 * @param {DFA} dfa - The DFA to test against.
 * @param {string} inputString - The string to test.
 * @returns {boolean} True if the string is accepted, false otherwise.
 */
function testStringAcceptanceDFA(dfa, inputString) {
    let currentState = dfa.startState;

    for (const symbol of inputString) {
        if (!dfa.alphabet.includes(symbol)) {
            // String contains a symbol not in the alphabet
            return false;
        }
        const nextState = dfa.getNextState(currentState, symbol);
        if (nextState === null) {
            // No transition for the current state and symbol (stuck)
            return false;
        }
        currentState = nextState;
    }

    return dfa.isFinal(currentState);
}

/**
 * Tests if a given string is accepted by an NFA.
 * @param {NFA} nfa - The NFA to test against.
 * @param {string} inputString - The string to test.
 * @returns {boolean} True if the string is accepted, false otherwise.
 */
function testStringAcceptanceNFA(nfa, inputString) {
    let currentStates = nfa.epsilonClosure([nfa.startState]);

    for (const symbol of inputString) {
        // Find next states for the current symbol from all current epsilon-closed states
        let nextStatesReached = new Set();
        for (const state of currentStates) {
            const reachable = nfa.getNextStates(state, symbol);
            reachable.forEach(s => nextStatesReached.add(s.name));
        }

        // Apply epsilon closure to the newly reached states
        const nextStateObjects = Array.from(nextStatesReached).map(name => nfa.states.find(s => s.name === name));
        currentStates = nfa.epsilonClosure(nextStateObjects);

        if (currentStates.length === 0) {
            return false; // No possible states to transition to
        }
    }

    // Check if any of the final states are in the currentStates set after processing the entire string
    return currentStates.some(state => nfa.isFinal(state));
}
// automata-project/js/operations.js

/**
 * Checks if a given Finite Automaton is deterministic.
 * A DFA must have exactly one transition for each state-symbol pair.
 * It cannot have epsilon transitions.
 * This function also returns the reasons for non-determinism if found.
 * @param {FiniteAutomaton} fa - The FA to check.
 * @returns {{isDFA: boolean, issues: string[]}} An object indicating if it's a DFA and a list of issues if not.
 */
function checkDeterminism(fa) {
    const issues = [];

    // Check for epsilon transitions
    if (fa.transitions.some(t => t.symbol === 'epsilon')) {
        issues.push("Contains epsilon (ε) transitions.");
    }

    for (const state of fa.states) {
        for (const symbol of fa.alphabet) {
            const transitionsForSymbol = fa.transitions.filter(
                t => t.fromState.equals(state) && t.symbol === symbol
            );

            // Check for multiple transitions from the same state on the same symbol
            if (transitionsForSymbol.length > 1) {
                issues.push(`Multiple transitions from state '${state.name}' on symbol '${symbol}'.`);
            }
            // Check for a single transition leading to multiple "to" states (NFA characteristic)
            else if (transitionsForSymbol.length === 1 && transitionsForSymbol[0].toStates.length > 1) {
                issues.push(`Transition from state '${state.name}' on symbol '${symbol}' leads to multiple states.`);
            }
            // Note: Missing transitions don't necessarily make it non-deterministic,
            // but rather an incomplete DFA. For the purpose of distinguishing DFA/NFA,
            // we primarily look for non-deterministic features. A "complete" DFA
            // might have a trap state to handle all transitions.
            // For now, we only flag explicit non-determinism, not incompleteness.
        }
    }

    return {
        isDFA: issues.length === 0,
        issues: issues
    };
}


/**
 * Tests if a given string is accepted by a DFA.
 * @param {DFA} dfa - The DFA to test against.
 * @param {string} inputString - The string to test.
 * @returns {boolean} True if the string is accepted, false otherwise.
 */
function testStringAcceptanceDFA(dfa, inputString) {
    let currentState = dfa.startState;

    for (const symbol of inputString) {
        if (!dfa.alphabet.includes(symbol)) {
            // String contains a symbol not in the alphabet
            return false;
        }
        const nextState = dfa.getNextState(currentState, symbol);
        if (nextState === null) {
            // No transition for the current state and symbol (stuck)
            // This can happen if the DFA is not "complete" (i.e., doesn't have a trap state)
            return false;
        }
        currentState = nextState;
    }

    return dfa.isFinal(currentState);
}

/**
 * Tests if a given string is accepted by an NFA.
 * @param {NFA} nfa - The NFA to test against.
 * @param {string} inputString - The string to test.
 * @returns {boolean} True if the string is accepted, false otherwise.
 */
function testStringAcceptanceNFA(nfa, inputString) {
    let currentStates = nfa.epsilonClosure([nfa.startState]);

    for (const symbol of inputString) {
        // Find next states for the current symbol from all current epsilon-closed states
        let nextStatesReached = new Set();
        for (const state of currentStates) {
            const reachable = nfa.getNextStates(state, symbol);
            reachable.forEach(s => nextStatesReached.add(s.name));
        }

        // Apply epsilon closure to the newly reached states
        const nextStateObjects = Array.from(nextStatesReached).map(name => nfa.states.find(s => s.name === name));
        currentStates = nfa.epsilonClosure(nextStateObjects);

        if (currentStates.length === 0) {
            return false; // No possible states to transition to
        }
    }

    // Check if any of the final states are in the currentStates set after processing the entire string
    return currentStates.some(state => nfa.isFinal(state));
}