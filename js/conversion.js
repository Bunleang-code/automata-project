import { State, Transition, FiniteAutomaton } from './fa.js';

function convertToDFA(nfa) {
    if (nfa.isDFA()) {
        alert("✅ Already a DFA.");
        return nfa;
    }

    const dfa = new FiniteAutomaton();
    let stateCounter = 0;
    const stateMap = new Map();

    const getSetName = set => [...set].sort().join(",");

    const startSet = new Set([nfa.startState.name]);
    const queue = [startSet];

    const startName = `D${stateCounter++}`;
    const isStartFinal = [...startSet].some(name => nfa.states[name].isFinal);
    stateMap.set(getSetName(startSet), startName);
    dfa.states[startName] = new State(startName, true, isStartFinal);
    dfa.setStartState(startName);
    if (isStartFinal) dfa.setFinalStates([startName]);

    while (queue.length > 0) {
        const currentSet = queue.shift();
        const currentName = stateMap.get(getSetName(currentSet));
        const symbolMap = {};

        for (const stateName of currentSet) {
            for (const t of nfa.transitions) {
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
                const isFinal = [...toSet].some(name => nfa.states[name]?.isFinal);
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

export { convertToDFA };

