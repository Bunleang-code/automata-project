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
            this.states[this.startState.name].isStart = false;
        }
        this.states[name].isStart = true;
        this.startState = this.states[name];
    }

    setFinalStates(names) {
        for (const state of this.finalStates) {
            state.isFinal = false;
        }
        this.finalStates = [];
        for (const name of names) {
            if (this.states[name]) {
                this.states[name].isFinal = true;
                this.finalStates.push(this.states[name]);
            } else {
                alert(`State '${name}' does not exist!`);
            }
        }
    }
}

export { State, Transition, FiniteAutomaton };