import { State, Transition } from './fa.js';
export function addState(fa, namesInput) {
    const names = namesInput.split(',').map(name => name.trim());
    let addedCount = 0;
    let duplicates = [];

    for (const name of names) {
        if (!name) continue;
        
        if (fa.states[name]) {
            duplicates.push(name);
        } else {
            fa.states[name] = new State(name, false, false);
            addedCount++;
        }
    }

    if (names.length > 1) {
        let message = `Added ${addedCount} states.`;
        if (duplicates.length > 0) {
            message += `\nDuplicates skipped: ${duplicates.join(', ')}`;
        }
        alert(message);
    } else if (duplicates.length > 0) {
        alert(`State ${duplicates[0]} already exists.`);
    }
}

export function addTransition(fa, from, to, symbol) {
    if (!fa.states[from] || !fa.states[to]) {
        alert(`Error: State ${from} or ${to} not found.`);
        return;
    }
    const transition = new Transition(fa.states[from], fa.states[to], symbol);
    fa.transitions.push(transition);
}

export function deleteState(fa, namesInput) {
    const names = namesInput.split(',').map(name => name.trim()).filter(Boolean);
    let deleted = [];
    let notFound = [];

    for (const name of names) {
        if (!fa.states[name]) {
            notFound.push(name);
            continue;
        }
        fa.transitions = fa.transitions.filter(t =>
            t.fromState.name !== name && t.toState.name !== name
        );
        if (fa.startState && fa.startState.name === name) {
            fa.startState = null;
        }
        delete fa.states[name];
        deleted.push(name);
    }

    let msg = '';
    if (deleted.length) msg += `Deleted: ${deleted.join(', ')}.`;
    if (notFound.length) msg += ` Not found: ${notFound.join(', ')}.`;
    alert(msg || 'No states deleted.');
}

export function deleteTransition(fa, from, to, symbol) {
    const before = fa.transitions.length;
    fa.transitions = fa.transitions.filter(t =>
        !(t.fromState.name === from && t.toState.name === to && t.symbol === symbol)
    );
    const after = fa.transitions.length;
    alert((before === after) ? "Transition not found." : "Transition deleted.");
}

export function updateState(fa, oldName, newName, isStart, isFinal) {
    if (!fa.states[oldName]) return alert(`State ${oldName} not found.`);
    if (oldName !== newName && fa.states[newName]) {
        return alert(`State ${newName} already exists.`);
    }

    const state = fa.states[oldName];
    state.name = newName;
    state.isStart = isStart;
    state.isFinal = isFinal;

    fa.transitions.forEach(t => {
        if (t.fromState.name === oldName) t.fromState.name = newName;
        if (t.toState.name === oldName) t.toState.name = newName;
    });

    fa.states[newName] = state;
    delete fa.states[oldName];

    if (fa.startState && fa.startState.name === oldName) {
        fa.startState = state;
    }

    alert(`State updated: ${oldName} → ${newName}`);
}

export function updateTransition(fa, from, to, symbol, newTo, newSymbol) {
    const t = fa.transitions.find(t =>
        t.fromState.name === from && t.toState.name === to && t.symbol === symbol
    );
    if (!t) return alert("Transition not found.");
    if (!fa.states[newTo]) return alert(`New destination state ${newTo} doesn't exist.`);
    t.toState = fa.states[newTo];
    t.symbol = newSymbol;
    alert("Transition updated.");
}

export function isDFA(fa, verbose = false) {
    const transitionMap = {};
    for (const t of fa.transitions) {
        const key = `${t.fromState.name}_${t.symbol}`;
        if (t.symbol === '' || t.symbol === 'ε') {
            if (verbose) alert(`Not a DFA: ε-transition from ${t.fromState.name}`);
            return false;
        }
        if (transitionMap[key]) {
            if (verbose) alert(`Not a DFA: multiple transitions from ${t.fromState.name} using '${t.symbol}'`);
            return false;
        }
        transitionMap[key] = true;
    }
    return true;
}

export function isNFA(fa, verbose = false) {
    const result = isDFA(fa, verbose);
    if (!result) {
        if (verbose) alert("This is an NFA.");
        return true;
    } else {
        if (verbose) alert("This is a DFA.");
        return false;
    }
}

export function printStates(fa) {
    console.log("States:");
    for (const name in fa.states) {
        const s = fa.states[name];
        console.log(`${s.name} ${s.isStart ? "(start)" : ""} ${s.isFinal ? "(final)" : ""}`);
    }
}

export function printTransitions(fa) {
    console.log("Transitions:");
    for (const t of fa.transitions) {
        console.log(`${t.fromState.name} --${t.symbol}--> ${t.toState.name}`);
    }
}