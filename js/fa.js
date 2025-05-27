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
        this.states = {};         // Map of state name -> State object
        this.transitions = [];    // List of Transition objects
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

    convertToDFA() {
        if (this.isDFA()) {
            alert("✅ Already a DFA.");
            return this;
        }

        const dfa = new FiniteAutomaton();
        let stateCounter = 0;
        const stateMap = new Map(); // key = set of NFA states, value = DFA state name

        const getSetName = set => [...set].sort().join(",");

        const startSet = new Set([this.startState.name]);
        const queue = [startSet];

        const startName = `D${stateCounter++}`;
        const isStartFinal = [...startSet].some(name => this.states[name].isFinal);
        stateMap.set(getSetName(startSet), startName);
        dfa.states[startName] = new State(startName, true, isStartFinal);
        dfa.setStartState(startName);
        if (isStartFinal) dfa.setFinalStates([startName]);

        while (queue.length > 0) {
            const currentSet = queue.shift();
            const currentName = stateMap.get(getSetName(currentSet));
            const symbolMap = {};

            for (const stateName of currentSet) {
                for (const t of this.transitions) {
                    if (t.fromState.name === stateName) {
                        if (!symbolMap[t.symbol]) symbolMap[t.symbol] = new Set();
                        symbolMap[t.symbol].add(t.toState.name);
                    }
                }
            }

            for (const symbol in symbolMap) {
                const toSet = symbolMap[symbol];
                const toSetKey = getSetName(toSet);

                if (!stateMap.has(toSetKey)) {
                    const newName = `D${stateCounter++}`;
                    const isFinal = [...toSet].some(name => this.states[name]?.isFinal);
                    stateMap.set(toSetKey, newName);
                    dfa.states[newName] = new State(newName, false, isFinal);
                    if (isFinal) dfa.finalStates.push(dfa.states[newName]);
                    queue.push(toSet);
                }

                const from = dfa.states[currentName];
                const to = dfa.states[stateMap.get(toSetKey)];
                dfa.transitions.push(new Transition(from, to, symbol));
            }
        }

        return dfa;
    }
}

export { State, Transition, FiniteAutomaton };
