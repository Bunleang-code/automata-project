import { FiniteAutomaton } from './fa.js';
import {
    addState, addTransition, deleteState, deleteTransition,
    updateState, updateTransition, isDFA, isNFA,
    printStates, printTransitions
} from './operations.js';

const fa = new FiniteAutomaton();

while (true) {
    const choice = prompt(
        "Finite Automaton Menu:\n" +
        "1. Add State\n" +
        "2. Set Start State\n" +          
        "3. Set Final States\n" +         
        "4. Add Transition\n" +
        "5. Delete State\n" +
        "6. Delete Transition\n" +
        "7. Update State\n" +
        "8. Update Transition\n" +
        "9. Check if DFA\n" +
        "10. Show States/Transitions\n" +
        "11. Exit\n" +
        "12. Convert NFA to DFA\n" +
        "13. Test string acceptance\n"
    );

    if (choice === "1") {
        const input = prompt("Enter state name(s):\n(Single name or comma-separated like q1,q2,q3)");
        if (input) {
            addState(fa, input);
        }
    } else if (choice === "2") {
        const name = prompt("Enter start state:");
        if (name && fa.states[name]) {
            fa.setStartState(name);
        } else {
            alert("State does not exist!");
        }
    } else if (choice === "3") {
        const names = prompt("Enter final states (comma-separated):");
        if (names) {
            const states = names.split(",").map(s => s.trim());
            fa.setFinalStates(states);
        }     
    } else if (choice === "4") { 
        const from = prompt("From state:");
        const symbol = prompt("Symbol:");
        const to = prompt("To state:");
        addTransition(fa, from, to, symbol);
    } else if (choice === "5") {
        const name = prompt("Enter state name(s) to delete:\n(Single name or comma-separated like q1,q2,q3)");
        deleteState(fa, name);
    } else if (choice === "6") {
        const from = prompt("From state:");
        const to = prompt("To state:");
        const symbol = prompt("Symbol:");
        deleteTransition(fa, from, to, symbol);
    } else if (choice === "7") {
        const oldName = prompt("Enter state name to update:");
        if (!oldName || !fa.states[oldName]) {
            alert("State not found!");
            continue;
        }
        const newName = prompt("New name (leave empty to keep current):") || oldName;
        const isStart = confirm("Make this the start state?");
        const isFinal = confirm("Make this a final state?");
        updateState(fa, oldName, newName, isStart, isFinal);
    } else if (choice === "8") {
        const from = prompt("From state:");
        const to = prompt("To state:");
        const symbol = prompt("Current symbol:");
        
        const t = fa.transitions.find(t => 
            t.fromState.name === from && 
            t.toState.name === to && 
            t.symbol === symbol
        );
        
        if (!t) {
            alert("Transition not found!");
            continue;
        }
        
        const newTo = prompt("New target state (leave empty to keep current):") || to;
        const newSymbol = prompt("New symbol (leave empty to keep current):") || symbol;
        
        if (!fa.states[newTo]) {
            alert("Target state doesn't exist!");
            continue;
        }
        
        updateTransition(fa, from, to, symbol, newTo, newSymbol);
    } else if (choice === "9") {
        if (isDFA(fa, true)) {
            alert("✅ This is a DFA.");
        } else {
            alert("❌ This is an NFA.");
        }
    } else if (choice === "10") {
        printStates(fa);
        printTransitions(fa);
    } else if (choice === "11") {
        alert("Exiting...");
        break;
    } else if (choice === "12") {
        if (isDFA(fa)) {
            alert("Already a DFA.");
        } else {
            const dfa = fa.convertToDFA();
            alert("✅ Converted to DFA.");
            printStates(dfa);
            printTransitions(dfa);
            // Overwrite original FA with DFA
            fa.states = dfa.states;
            fa.transitions = dfa.transitions;
            fa.startState = dfa.startState;
            fa.finalStates = dfa.finalStates;
        }
    } else if (choice === "13") {
        const input = prompt("Enter input string:");
        if (!isDFA(fa)) {
            alert("Please convert to DFA first.");
        } else {
            const result = fa.acceptsString(input);
            alert(result ? "✅ String accepted." : "❌ String rejected.");
        }
    } else {
        alert("Invalid choice.");
    }
}
