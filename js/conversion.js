<<<<<<< HEAD
// automata-project/js/conversion.js
=======
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
>>>>>>> 3ac73e4604436a9c425286caa034af81fc6f6795

/**
 * Converts an NFA to an equivalent DFA using the subset construction algorithm.
 * @param {NFA} nfa - The NFA to convert.
 * @returns {DFA} The equivalent DFA.
 */
function convertNFAtoDFA(nfa) {
    const dfaStates = []; // Array of objects: { name: '...', set: Set<State>, obj: State }
    const dfaAlphabet = nfa.alphabet.filter(s => s !== 'epsilon'); // DFA alphabet doesn't include epsilon
    const dfaTransitions = []; // Array of Transition objects for the DFA
    let dfaStartState = null;
    const dfaFinalStates = []; // Array of DFA State objects

    // 1. Initial Epsilon Closure of Start State
    let initialDFAStateSet = nfa.epsilonClosure([nfa.startState]);
    let initialDFAStateName = '{' + initialDFAStateSet.map(s => s.name).sort().join(',') + '}';
    let initialDFAStateObj = new State(initialDFAStateName);
    dfaStates.push({ name: initialDFAStateName, set: initialDFAStateSet, obj: initialDFAStateObj });
    dfaStartState = initialDFAStateObj;

    const unmarkedStatesQueue = [{ name: initialDFAStateName, set: initialDFAStateSet, obj: initialDFAStateObj }];
    const processedDFAStateNames = new Set([initialDFAStateName]); // To track unique DFA states by name

    // Handle a potential "dead" state for completeness if transitions lead nowhere
    let deadStateInfo = null;

    // 2. Process unmarked DFA states
    while (unmarkedStatesQueue.length > 0) {
        const currentDFAState = unmarkedStatesQueue.shift();
        const currentDFAStateSet = currentDFAState.set;
        const currentDFAStateObj = currentDFAState.obj;

        // Check if this new DFA state is a final state
        if (currentDFAStateSet.some(s => nfa.isFinal(s))) {
            if (!dfaFinalStates.some(s => s.equals(currentDFAStateObj))) {
                dfaFinalStates.push(currentDFAStateObj);
            }
        }

        for (const symbol of dfaAlphabet) {
            let nextNFAStateSet = new Set();

            // Find all states reachable from currentDFAStateSet on 'symbol'
            currentDFAStateSet.forEach(nfaState => {
                const reachableOnSymbol = nfa.getNextStates(nfaState, symbol);
                reachableOnSymbol.forEach(s => nextNFAStateSet.add(s));
            });

            // Apply epsilon closure to the set of states reached
            const nextDFAStateSet = nfa.epsilonClosure(Array.from(nextNFAStateSet));

            let nextDFAStateName;
            let nextDFAStateObj;

            if (nextDFAStateSet.length === 0) {
                // If no states are reachable, transition to a "dead" (trap) state
                if (!deadStateInfo) {
                    const deadStateName = 'dead'; // Or any other convention
                    const deadStateObj = new State(deadStateName);
                    deadStateInfo = { name: deadStateName, set: [], obj: deadStateObj };
                    dfaStates.push(deadStateInfo);
                    unmarkedStatesQueue.push(deadStateInfo); // Add dead state to queue to ensure its transitions are processed
                    processedDFAStateNames.add(deadStateName);
                }
                nextDFAStateName = deadStateInfo.name;
                nextDFAStateObj = deadStateInfo.obj;
            } else {
                nextDFAStateName = '{' + nextDFAStateSet.map(s => s.name).sort().join(',') + '}';

                // Check if this DFA state already exists
                const existingDFAState = dfaStates.find(d => d.name === nextDFAStateName);
                if (existingDFAState) {
                    nextDFAStateObj = existingDFAState.obj;
                } else {
                    nextDFAStateObj = new State(nextDFAStateName);
                    dfaStates.push({ name: nextDFAStateName, set: nextDFAStateSet, obj: nextDFAStateObj });
                    unmarkedStatesQueue.push({ name: nextDFAStateName, set: nextDFAStateSet, obj: nextDFAStateObj });
                    processedDFAStateNames.add(nextDFAStateName);
                }
            }

            // Add the transition to the DFA
            dfaTransitions.push(new Transition(currentDFAStateObj, symbol, [nextDFAStateObj]));
        }
    }

    // Filter dfaStates to only include the actual State objects that were found reachable
    const finalDFAStateObjects = dfaStates.filter(d => processedDFAStateNames.has(d.name)).map(d => d.obj);

    return new DFA(finalDFAStateObjects, dfaAlphabet, dfaTransitions, dfaStartState, dfaFinalStates);
}
