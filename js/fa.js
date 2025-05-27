class State {
    constructor(name, isStart = false, isFinal = false) {
        this.name = name;
        this.isStart = isStart;
        this.isFinal = isFinal;
    }
}

class Transition {
    constructor(fromState, toState, symbol) {
        this.fromState = fromState;
        this.toState = toState;
        this.symbol = symbol;
    }
}

class FiniteAutomaton {
    constructor() {
        this.states = {};
        this.transitions = [];
        this.startState = null;
        this.finalStates = [];
    }

    setStartState(name) {
        if (this.startState) {
            this.startState.isStart = false;
        }
        if (this.states[name]) {
            this.states[name].isStart = true;
            this.startState = this.states[name];
        } else {
            alert(`State '${name}' does not exist.`);
        }
    }

    setFinalStates(names) {
        this.finalStates.forEach(state => state.isFinal = false);
        this.finalStates = [];
        for (const name of names) {
            const state = this.states[name];
            if (state) {
                state.isFinal = true;
                this.finalStates.push(state);
            } else {
                alert(`State '${name}' does not exist!`);
            }
        }
    }

    isDFA() {
        const seen = new Set();
        for (const t of this.transitions) {
            const key = `${t.fromState.name}-${t.symbol}`;
            if (seen.has(key)) return false;
            seen.add(key);
        }
        return true;
    }

    acceptsString(input) {
        if (!this.isDFA()) {
            alert("❌ Must be DFA to test string acceptance.");
            return false;
        }

        let currentState = this.startState;
        for (const symbol of input) {
            const next = this.transitions.find(t =>
                t.fromState.name === currentState.name &&
                t.symbol === symbol
            );
            if (!next) return false;
            currentState = next.toState;
        }
        return currentState.isFinal;
    }
}

export { State, Transition, FiniteAutomaton };
