// automata-project/js/minimization.js

/**
 * Minimizes a given DFA using the partitioning method.
 * @param {DFA} dfa - The DFA to minimize.
 * @returns {DFA} The minimized DFA.
 */
function minimizeDFA(dfa) {
    // 1. Create a complete DFA by adding a trap state and missing transitions
    let completeDfaStates = [...dfa.states];
    let completeDfaTransitions = [...dfa.transitions];
    const dfaAlphabet = dfa.alphabet;

    let trapState = completeDfaStates.find(s => s.name === 'TrapState');
    if (!trapState) {
        trapState = new State('TrapState');
        completeDfaStates.push(trapState);
    }

    // Add transitions to the trap state for any missing (state, symbol) pairs from original states
    for (const state of dfa.states) { // Iterate original DFA states
        for (const symbol of dfaAlphabet) {
            const existingTransition = completeDfaTransitions.find(
                t => t.fromState.equals(state) && t.symbol === symbol
            );
            if (!existingTransition) {
                // If a transition is missing, add one to the trap state
                completeDfaTransitions.push(new Transition(state, symbol, [trapState]));
            }
        }
    }

    // IMPORTANT ADDITION: Ensure trap state has transitions to itself for all symbols
    for (const symbol of dfaAlphabet) {
        const trapTransitionExists = completeDfaTransitions.some(
            t => t.fromState.equals(trapState) && t.symbol === symbol && t.toStates.some(s => s.equals(trapState))
        );
        if (!trapTransitionExists) {
            completeDfaTransitions.push(new Transition(trapState, symbol, [trapState]));
        }
    }


    // Create a temporary complete DFA object for minimization
    const tempDFA = new DFA(completeDfaStates, dfaAlphabet, completeDfaTransitions, dfa.startState, dfa.finalStates);

    // Step 1: Initial Partitioning into P0 (Final States and Non-Final States)
    const P0 = [];
    const finalStateNames = new Set(tempDFA.finalStates.map(s => s.name));
    let nonFinalStates = tempDFA.states.filter(s => !finalStateNames.has(s.name));
    const onlyFinalStates = tempDFA.states.filter(s => finalStateNames.has(s.name));

    // Ensure trap state is part of the non-final states if it's not a final state
    // and also ensure it's included in nonFinalStates if it exists and isn't final
    if (!finalStateNames.has(trapState.name) && !nonFinalStates.some(s => s.equals(trapState))) {
         nonFinalStates.push(trapState);
    }


    if (nonFinalStates.length > 0) P0.push(nonFinalStates);
    if (onlyFinalStates.length > 0) P0.push(onlyFinalStates);

    let P = P0;
    let changed = true;

    // Step 2: Iteratively Refine Partitions
    while (changed) {
        changed = false;
        const newP = [];

        for (const block of P) {
            if (block.length <= 1) {
                newP.push(block);
                continue;
            }

            const partitionsForBlock = new Map();

            for (const state of block) {
                let signature = '';
                for (const symbol of tempDFA.alphabet) {
                    const nextState = tempDFA.getNextState(state, symbol);
                    let nextStateBlockName = '';

                    if (nextState) {
                        const blockContainingNextState = P.find(b => b.some(s => s.equals(nextState)));
                        if (blockContainingNextState) {
                            nextStateBlockName = '{' + blockContainingNextState.map(s => s.name).sort().join(',') + '}';
                        } else {
                            nextStateBlockName = 'UNMAPPED'; // Fallback for states not in P, though should not happen with trap state
                        }
                    } else {
                        // This case should not be hit if tempDFA is truly complete with trap state
                        // If getNextState returns null, it's an issue with tempDFA completeness
                        nextStateBlockName = 'ERROR_NULL_STATE';
                    }
                    signature += `${symbol}-${nextStateBlockName};`;
                }

                if (!partitionsForBlock.has(signature)) {
                    partitionsForBlock.set(signature, []);
                }
                partitionsForBlock.get(signature).push(state);
            }

            if (partitionsForBlock.size > 1) {
                changed = true;
            }
            partitionsForBlock.forEach(subBlock => newP.push(subBlock));
        }

        if (changed) {
            P = newP;
        }
    }

    // Step 3: Construct the Minimized DFA
    const minimizedDFAStates = [];
    const minimizedDFAAlphabet = tempDFA.alphabet;
    const minimizedDFATransitions = [];
    let minimizedDFAStartState = null;
    const minimizedDFAFinalStates = [];

    const blockToMinimizedStateMap = new Map();
    const originalStateToMinimizedStateMap = new Map();

    P.forEach(block => {
        const newDfaStateName = '{' + block.map(s => s.name).sort().join(',') + '}';
        const newDfaState = new State(newDfaStateName);
        minimizedDFAStates.push(newDfaState);
        blockToMinimizedStateMap.set(newDfaStateName, newDfaState);

        block.forEach(originalState => {
            originalStateToMinimizedStateMap.set(originalState.name, newDfaState);
        });

        if (block.some(s => s.equals(tempDFA.startState))) {
            minimizedDFAStartState = newDfaState;
        }
        if (block.some(s => tempDFA.isFinal(s))) {
            minimizedDFAFinalStates.push(newDfaState);
        }
    });

    minimizedDFAStates.forEach(mState => {
        const representativeOriginalStateName = mState.name.substring(1, mState.name.length - 1).split(',')[0];
        const representativeOriginalState = tempDFA.states.find(s => s.name === representativeOriginalStateName);

        // It is crucial that representativeOriginalState is not null here.
        // This should be guaranteed by how mState names are formed from P blocks.
        if (!representativeOriginalState) {
            console.error(`Error: Representative original state ${representativeOriginalStateName} not found.`);
            return; // Skip this mState if representative not found
        }

        for (const symbol of minimizedDFAAlphabet) {
            const originalNextState = tempDFA.getNextState(representativeOriginalState, symbol);

            // originalNextState should NOT be null here because tempDFA is now complete with trap state
            if (originalNextState) {
                const minimizedNextState = originalStateToMinimizedStateMap.get(originalNextState.name);
                if (minimizedNextState) {
                     minimizedDFATransitions.push(new Transition(mState, symbol, [minimizedNextState]));
                } else {
                    console.error(`Error: Minimized next state not found for original next state ${originalNextState.name}. This should not happen.`);
                }
            } else {
                console.error(`Error: originalNextState is null for state ${representativeOriginalState.name} and symbol ${symbol}. This indicates an incomplete DFA.`);
            }
        }
    });

    // Filter out states that are not reachable from the start state (including trap state if unreachable)
    const reachableStates = new Set();
    const queue = [minimizedDFAStartState];
    reachableStates.add(minimizedDFAStartState.name);

    let head = 0;
    while(head < queue.length) {
        const currentState = queue[head++];
        minimizedDFATransitions.forEach(t => {
            if (t.fromState.equals(currentState)) {
                t.toStates.forEach(nextState => {
                    if (!reachableStates.has(nextState.name)) {
                        reachableStates.add(nextState.name);
                        queue.push(nextState);
                    }
                });
            }
        });
    }

    const finalMinimizedDFAStates = minimizedDFAStates.filter(s => reachableStates.has(s.name));
    const finalMinimizedDFATransitions = minimizedDFATransitions.filter(t =>
        reachableStates.has(t.fromState.name) && t.toStates.every(ts => reachableStates.has(ts.name))
    );
    const finalMinimizedDFAFinalStates = minimizedDFAFinalStates.filter(s => reachableStates.has(s.name));

    return new DFA(finalMinimizedDFAStates, minimizedDFAAlphabet, finalMinimizedDFATransitions, minimizedDFAStartState, finalMinimizedDFAFinalStates);
}