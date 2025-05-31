// automata-project/js/fa.js

/**
 * Represents a state in a Finite Automaton.
 * @param {string} name - The name of the state (e.g., "q0").
 */
class State {
    constructor(name) {
        this.name = name;
    }

    equals(otherState) {
        return this.name === otherState.name;
    }
}

/**
 * Represents a transition in a Finite Automaton.
 * @param {State} fromState - The state from which the transition originates.
 * @param {string} symbol - The input symbol for the transition (use 'epsilon' for epsilon transitions).
 * @param {State[]} toStates - An array of states to which the transition leads.
 */
class Transition {
    constructor(fromState, symbol, toStates) {
        this.fromState = fromState;
        this.symbol = symbol;
        this.toStates = toStates; // Array of State objects
    }

    // Helper for saving/loading: get simple objects
    toJSON() {
        return {
            fromState: this.fromState.name,
            symbol: this.symbol,
            toStates: this.toStates.map(s => s.name)
        };
    }
}

/**
 * Represents a Finite Automaton (abstract base class).
 */
class FiniteAutomaton {
    constructor(states, alphabet, transitions, startState, finalStates) {
        this.states = states; // Array of State objects
        this.alphabet = alphabet; // Array of strings
        this.transitions = transitions; // Array of Transition objects
        this.startState = startState; // State object
        this.finalStates = finalStates; // Array of State objects
    }

    /**
     * Checks if a given state is a final state.
     * @param {State} state - The state to check.
     * @returns {boolean} True if the state is a final state, false otherwise.
     */
    isFinal(state) {
        return this.finalStates.some(fs => fs.equals(state));
    }

    /**
     * Helper to get transitions for a specific state and symbol.
     * @param {State} fromState - The state to check from.
     * @param {string} symbol - The symbol.
     * @returns {Transition[]} An array of matching transitions.
     */
    getTransitions(fromState, symbol) {
        return this.transitions.filter(t => t.fromState.equals(fromState) && t.symbol === symbol);
    }

    // Helper for saving/loading: get simple objects
    toJSON() {
        return {
            type: this.type,
            states: this.states.map(s => s.name),
            alphabet: this.alphabet,
            transitions: this.transitions.map(t => t.toJSON()),
            startState: this.startState.name,
            finalStates: this.finalStates.map(s => s.name)
        };
    }
}

/**
 * Represents a Deterministic Finite Automaton (DFA).
 * Extends FiniteAutomaton.
 */
class DFA extends FiniteAutomaton {
    constructor(states, alphabet, transitions, startState, finalStates) {
        super(states, alphabet, transitions, startState, finalStates);
        this.type = "DFA";
    }

    /**
     * Finds the next state for a given state and symbol in a DFA.
     * Assumes determinism.
     * @param {State} currentState - The current state.
     * @param {string} symbol - The input symbol.
     * @returns {State|null} The next state, or null if no transition exists.
     */
    getNextState(currentState, symbol) {
        const applicableTransitions = this.transitions.filter(
            t => t.fromState.equals(currentState) && t.symbol === symbol
        );
        if (applicableTransitions.length === 1 && applicableTransitions[0].toStates.length === 1) {
            return applicableTransitions[0].toStates[0]; // DFA has only one next state
        }
        return null; // No transition or not a valid DFA transition
    }
}

/**
 * Represents a Non-deterministic Finite Automaton (NFA).
 * Extends FiniteAutomaton.
 */
class NFA extends FiniteAutomaton {
    constructor(states, alphabet, transitions, startState, finalStates) {
        super(states, alphabet, transitions, startState, finalStates);
        this.type = "NFA";
    }

    /**
     * Finds all next states for a given state and symbol in an NFA.
     * @param {State} currentState - The current state.
     * @param {string} symbol - The input symbol.
     * @returns {State[]} An array of next states.
     */
    getNextStates(currentState, symbol) {
        const nextStates = [];
        this.transitions.forEach(t => {
            if (t.fromState.equals(currentState) && t.symbol === symbol) {
                nextStates.push(...t.toStates);
            }
        });
        return nextStates;
    }

    /**
     * Computes the epsilon-closure of a set of states.
     * @param {State[]} states - An array of states.
     * @returns {State[]} The epsilon-closure of the given states.
     */
    epsilonClosure(states) {
        let closureNames = new Set(states.map(s => s.name));
        let stack = [...states];

        while (stack.length > 0) {
            let currentState = stack.pop();
            this.transitions.forEach(t => {
                // Assuming 'epsilon' is the designated symbol for epsilon transitions
                if (t.fromState.equals(currentState) && t.symbol === 'epsilon') {
                    t.toStates.forEach(toState => {
                        if (!closureNames.has(toState.name)) {
                            closureNames.add(toState.name);
                            // Find the actual State object from the FA's full state list
                            // This assumes all states exist in this.states
                            stack.push(this.states.find(s => s.name === toState.name));
                        }
                    });
                }
            });
        }
        return Array.from(closureNames).map(name => this.states.find(s => s.name === name));
    }
}