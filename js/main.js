// automata-project/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    const mainMenu = document.getElementById('main-menu');
    const inputGui = document.getElementById('input-gui');
    const nfaGui = document.getElementById('nfa-gui');
    const dfaGui = document.getElementById('dfa-gui');
    const convertNfaByIdGui = document.getElementById('convert-nfa-by-id-gui'); // New GUI
    const testAcceptanceGui = document.getElementById('test-acceptance-gui');
    const minimizeDfaGui = document.getElementById('minimize-dfa-gui');
    const showAllFasGui = document.getElementById('show-all-fas-gui');
    const visualizationModal = document.getElementById('visualization-modal'); // Modal

    // Main Menu Buttons
    document.getElementById('btn-input-fa').addEventListener('click', () => showGui(inputGui));
    document.getElementById('btn-convert-nfa-by-id').addEventListener('click', () => { // New Button Handler
        document.getElementById('convert-nfa-user-id-input').value = '';
        document.getElementById('converted-dfa-display-area').classList.add('hidden');
        document.getElementById('convert-nfa-message').textContent = '';
        showGui(convertNfaByIdGui);
    });
    document.getElementById('btn-test-string').addEventListener('click', () => showGui(testAcceptanceGui));
    document.getElementById('btn-minimize-dfa').addEventListener('click', () => showGui(minimizeDfaGui));
    document.getElementById('btn-show-all-fas').addEventListener('click', () => {
        loadAndDisplayAllFas();
        showGui(showAllFasGui);
    });

    // Input GUI Buttons
    document.getElementById('btn-input-gui-exit').addEventListener('click', () => showGui(mainMenu));
    document.getElementById('btn-add-fa').addEventListener('click', handleAddFa);

    // NFA GUI Buttons
    document.getElementById('btn-save-nfa').addEventListener('click', () => { // Modified
        if (currentFa) {
            const existingIndex = savedFas.findIndex(fa => fa.id === currentFa.id);
            if (existingIndex !== -1) {
                savedFas[existingIndex] = currentFa;
            } else {
                savedFas.push(currentFa);
            }
            saveFas();
            alert(`NFA User ID ${currentFa.id} saved successfully! You can now convert it or exit.`);
            // User stays on NFA GUI
        } else {
            alert('No NFA to save. Please add one first.');
        }
    });
    document.getElementById('btn-convert-nfa-to-dfa').addEventListener('click', convertCurrentNfaToDfaAndDisplay); // Renamed handler for clarity
    document.getElementById('btn-nfa-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // DFA GUI Buttons
    document.getElementById('btn-save-dfa').addEventListener('click', saveCurrentFa); // This now correctly saves DFA (original or converted)
    document.getElementById('btn-dfa-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // Convert NFA by ID GUI Buttons (New)
    document.getElementById('btn-load-and-convert-nfa').addEventListener('click', handleLoadAndConvertNfaById);
    document.getElementById('btn-save-converted-dfa').addEventListener('click', () => {
        if (currentFa && currentFa.fa.type === "DFA") { // Ensure currentFa is the converted DFA
            saveCurrentFa(); // This will save the updated faEntry (currentFa)
            alert('Converted DFA saved successfully!');
            showGui(mainMenu); // Optionally go to main menu or stay
        } else {
            alert('No converted DFA to save or current FA is not a DFA.');
        }
    });
    document.getElementById('btn-convert-nfa-by-id-gui-exit').addEventListener('click', () => showGui(mainMenu));


    // Test Acceptance GUI Buttons
    document.getElementById('btn-test-gui-exit').addEventListener('click', () => showGui(mainMenu));
    document.getElementById('btn-check-fa-for-test').addEventListener('click', checkFaForTest);
    document.getElementById('btn-test-string-acceptance').addEventListener('click', testStringForAcceptance);
    document.getElementById('btn-continue-test').addEventListener('click', () => {
        document.getElementById('acceptance-result').textContent = '';
        document.getElementById('test-string-input').value = '';
        document.getElementById('rejection-options').classList.add('hidden');
        document.getElementById('btn-save-test-result').classList.add('hidden');
        rejectionCount = 0;
    });
    document.getElementById('btn-exit-test-to-main').addEventListener('click', () => showGui(mainMenu));
    document.getElementById('btn-save-test-result').addEventListener('click', saveLastTestedResult);


    // Minimize DFA GUI Buttons
    document.getElementById('btn-minimize-dfa-action').addEventListener('click', handleMinimizeDfa);
    document.getElementById('btn-minimize-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // Show All FAs GUI Buttons
    document.getElementById('btn-download-all-fas').addEventListener('click', downloadAllFasAsJson); // New
    document.getElementById('btn-show-all-fas-exit').addEventListener('click', () => showGui(mainMenu));

    // Modal buttons
    document.getElementById('close-visualization-modal').addEventListener('click', () => {
        visualizationModal.classList.add('hidden');
        visualizationModal.style.display = 'none'; // Ensure it's hidden
    });
    // Close modal if clicked outside content (optional)
    visualizationModal.addEventListener('click', (event) => {
        if (event.target === visualizationModal) {
            visualizationModal.classList.add('hidden');
            visualizationModal.style.display = 'none';
        }
    });


    // --- Global Variables ---
    let currentFa = null; // Stores the full FA entry object { id: ..., fa: FA_Object, originalInput: {}, stringTestResults: [], isNFA: boolean, minimizedDfa: FA_Object|null }
    let currentFaUserId = 0;
    let savedFas = [];
    let rejectionCount = 0;
    let lastTestedFaEntry = null;

    // --- Utility Functions ---
    function showGui(guiElement) {
        const guis = [mainMenu, inputGui, nfaGui, dfaGui, convertNfaByIdGui, testAcceptanceGui, minimizeDfaGui, showAllFasGui];
        guis.forEach(gui => gui.classList.add('hidden'));
        guiElement.classList.remove('hidden');
        if (guiElement === visualizationModal) { // Special handling for modal display
            guiElement.style.display = 'flex'; // Use flex for centering
        }
    }

    function reconstructFaObject(faData) {
        if (!faData) return null;
        const states = faData.states.map(sName => new State(sName));
        const startState = states.find(s => s.name === faData.startState);
        const finalStates = faData.finalStates.map(fsName => states.find(s => s.name === fsName));
        const transitions = faData.transitions.map(tData => {
            const fromState = states.find(s => s.name === tData.fromState);
            const toStates = tData.toStates.map(tsName => states.find(s => s.name === tsName));
            return new Transition(fromState, tData.symbol, toStates);
        });

        if (faData.type === "DFA") {
            return new DFA(states, faData.alphabet, transitions, startState, finalStates);
        } else if (faData.type === "NFA") {
            return new NFA(states, faData.alphabet, transitions, startState, finalStates);
        }
        return null;
    }

    function loadSavedFas() {
        const fasJson = localStorage.getItem('savedFas');
        if (fasJson) {
            const rawFas = JSON.parse(fasJson);
            savedFas = rawFas.map(faEntryData => {
                const faObject = reconstructFaObject(faEntryData.fa);
                const minimizedDfaObject = faEntryData.minimizedDfa ? reconstructFaObject(faEntryData.minimizedDfa) : null;
                return {
                    id: faEntryData.id,
                    fa: faObject,
                    originalInput: faEntryData.originalInput || {},
                    stringTestResults: faEntryData.stringTestResults || [],
                    isNFA: faEntryData.isNFA || false, // Ensure isNFA flag is loaded
                    minimizedDfa: minimizedDfaObject
                };
            });
            if (savedFas.length > 0) {
                currentFaUserId = Math.max(...savedFas.map(fa => fa.id), 0);
            } else {
                currentFaUserId = 0;
            }
        }
    }

    function saveFas() {
        localStorage.setItem('savedFas', JSON.stringify(savedFas.map(faEntry => ({
            id: faEntry.id,
            fa: faEntry.fa.toJSON(),
            originalInput: faEntry.originalInput,
            stringTestResults: faEntry.stringTestResults,
            isNFA: faEntry.isNFA,
            minimizedDfa: faEntry.minimizedDfa ? faEntry.minimizedDfa.toJSON() : null
        }))));
    }

    function getNextUserId() {
        currentFaUserId++;
        return currentFaUserId;
    }

    async function displayFaDetails(fa, textElementId, visualizationElementId, clearPreviousViz = true) {
        const textDisplay = document.getElementById(textElementId);
        if (textDisplay) {
            let faString = `Type: ${fa.type}\n`;
            faString += `States: ${fa.states.map(s => s.name).join(', ')}\n`;
            faString += `Alphabet: ${fa.alphabet.join(', ')}\n`;
            faString += `Start State: ${fa.startState.name}\n`;
            faString += `Final States: ${fa.finalStates.map(s => s.name).join(', ')}\n`;
            faString += `Transitions:\n`;
            fa.transitions.forEach(t => {
                faString += `  (${t.fromState.name}, '${t.symbol === 'epsilon' ? 'ε' : t.symbol}') -> {${t.toStates.map(s => s.name).join(', ')}}\n`;
            });
            textDisplay.textContent = faString;
        }

        if (visualizationElementId) {
            if (clearPreviousViz) {
                 document.getElementById(visualizationElementId).innerHTML = ''; // Clear previous
            }
            visualizeFA(fa, visualizationElementId);
        }
    }

    // --- Event Handlers ---

    async function handleAddFa() {
        // ... (existing handleAddFa logic from your file)
        // Ensure that when a new FA is added, currentFa is structured correctly:
        // currentFa = { id: userId, fa: newDFA_or_NFA, originalInput: originalInputData, stringTestResults: [], isNFA: (boolean), minimizedDfa: null };
        console.log("Add FA button clicked.");
        const statesInput = document.getElementById('states-input');
        const alphabetInput = document.getElementById('alphabet-input');
        const startStateInput = document.getElementById('start-state-input');
        const finalStatesInput = document.getElementById('final-states-input');
        const transitionsInput = document.getElementById('transitions-input');

        if (!statesInput || !alphabetInput || !startStateInput || !finalStatesInput || !transitionsInput) {
            console.error("One or more input elements not found.");
            alert('Error: Required input fields are missing.');
            return;
        }

        const statesValue = statesInput.value.trim();
        const alphabetValue = alphabetInput.value.trim();
        const startStateValue = startStateInput.value.trim();
        const finalStatesValue = finalStatesInput.value.trim();
        const transitionsValue = transitionsInput.value.trim();

        const originalInputData = {
            states: statesValue, alphabet: alphabetValue, startState: startStateValue,
            finalStates: finalStatesValue, transitions: transitionsValue
        };

        if (!statesValue || !alphabetValue || !startStateValue || !finalStatesValue || !transitionsValue) {
            alert('Please fill in all FA details.');
            return;
        }

        try {
            const states = statesValue.split(',').map(s => new State(s.trim())).filter(s => s.name !== '');
            const alphabet = alphabetValue.split(',').map(s => s.trim()).filter(s => s !== '');
            if (alphabet.includes('epsilon')) throw new Error("'epsilon' cannot be in the alphabet.");

            const startState = states.find(s => s.name === startStateValue);
            if (!startState) throw new Error(`Start state '${startStateValue}' not defined.`);

            const finalStates = finalStatesValue.split(',').map(fsName => states.find(s => s.name === fsName.trim())).filter(Boolean);
            if (finalStatesValue.split(',').map(fs => fs.trim()).filter(Boolean).length > 0 && finalStates.length === 0) {
                throw new Error('One or more final states are not defined in the states list.');
            }
            
            const parsedTransitions = [];
            const transitionEntries = transitionsValue.split(';').filter(entry => entry.trim() !== '');
            transitionEntries.forEach((tStr) => {
                const parts = tStr.trim().split(',');
                if (parts.length !== 3) throw new Error(`Malformed transition: '${tStr}'.`);
                const from = states.find(s => s.name === parts[0].trim());
                const sym = parts[1].trim();
                if (!from) throw new Error(`State '${parts[0].trim()}' not defined in transition '${tStr}'.`);
                if (sym !== 'epsilon' && !alphabet.includes(sym)) throw new Error(`Symbol '${sym}' not in alphabet for transition '${tStr}'.`);
                
                const toStateNamesStr = parts[2].trim();
                let targetNames;
                if (toStateNamesStr.startsWith('{') && toStateNamesStr.endsWith('}')) {
                    targetNames = toStateNamesStr.substring(1, toStateNamesStr.length - 1).split(',').map(s => s.trim()).filter(Boolean);
                } else {
                    targetNames = [toStateNamesStr];
                }
                const toStates = targetNames.map(tsName => {
                    const s = states.find(st => st.name === tsName);
                    if (!s) throw new Error(`Target state '${tsName}' not defined in transition '${tStr}'.`);
                    return s;
                });
                if (targetNames.length > 0 && toStates.length === 0) throw new Error(`No valid target states for transition '${tStr}'.`);
                parsedTransitions.push(new Transition(from, sym, toStates));
            });

            const tempFA = new NFA(states, alphabet, parsedTransitions, startState, finalStates); // Use NFA for initial check
            const determinismCheck = checkDeterminism(tempFA);
            const userId = getNextUserId();
            
            currentFa = { // Initialize currentFa structure fully
                id: userId,
                fa: null, // to be replaced by DFA or NFA instance
                originalInput: originalInputData,
                stringTestResults: [],
                isNFA: !determinismCheck.isDFA,
                minimizedDfa: null
            };

            if (determinismCheck.isDFA) {
                currentFa.fa = new DFA(states, alphabet, parsedTransitions, startState, finalStates);
                document.getElementById('dfa-user-id').textContent = userId;
                displayFaDetails(currentFa.fa, 'dfa-display-text', 'dfa-display-visualization');
                alert(`FA created as DFA (User ID: ${userId}).`);
                showGui(dfaGui);
            } else {
                currentFa.fa = new NFA(states, alphabet, parsedTransitions, startState, finalStates); // Already have tempFA
                document.getElementById('nfa-user-id').textContent = userId;
                displayFaDetails(currentFa.fa, 'nfa-display-text', 'nfa-display-visualization');
                alert(`FA created as NFA (User ID: ${userId}). Reasons:\n- ${determinismCheck.issues.join('\n- ')}`);
                showGui(nfaGui);
            }
            // Do not save here automatically, let user click save button on DFA/NFA GUI.

            // Clear input fields
            statesInput.value = ''; alphabetInput.value = ''; startStateInput.value = '';
            finalStatesInput.value = ''; transitionsInput.value = '';

        } catch (error) {
            console.error("Error in handleAddFa:", error);
            alert('Error creating FA: ' + error.message);
            currentFa = null; // Reset currentFa if creation failed
        }
    }


    async function saveCurrentFa() {
        if (currentFa && currentFa.fa) { // Check fa property within currentFa
            const existingIndex = savedFas.findIndex(entry => entry.id === currentFa.id);
            if (existingIndex !== -1) {
                savedFas[existingIndex] = currentFa; // Update existing
            } else {
                savedFas.push(currentFa); // Add as new
            }
            saveFas();
            alert(`FA User ID ${currentFa.id} (Type: ${currentFa.fa.type}, NFA Origin: ${currentFa.isNFA}) saved successfully!`);
            showGui(mainMenu);
        } else {
            alert('No FA to save. Please add or load one first.');
        }
    }

    async function convertCurrentNfaToDfaAndDisplay() { // For NFA GUI's convert button
        if (currentFa && currentFa.fa && currentFa.fa.type === "NFA") {
            try {
                const convertedDFA = convertNFAtoDFA(currentFa.fa);
                currentFa.fa = convertedDFA; // Update the FA object within currentFa
                currentFa.isNFA = true; // Mark that this DFA originated from an NFA
                                        // The type is now DFA, but isNFA flag indicates origin.
                document.getElementById('dfa-user-id').textContent = currentFa.id;
                displayFaDetails(convertedDFA, 'dfa-display-text', 'dfa-display-visualization');
                alert(`NFA (User ID: ${currentFa.id}) converted to DFA successfully! You can now save this DFA.`);
                showGui(dfaGui);
                // Do not auto-save here. Let user click "Save DFA" on the dfa-gui.
            } catch (error) {
                console.error("Error during NFA to DFA conversion:", error);
                alert('Error converting NFA to DFA: ' + error.message);
            }
        } else {
            alert('No NFA loaded or current FA is already a DFA. Please select an NFA from input or load one.');
        }
    }

    async function handleLoadAndConvertNfaById() { // For new "Convert NFA by ID" GUI
        const userIdInput = document.getElementById('convert-nfa-user-id-input');
        const messageArea = document.getElementById('convert-nfa-message');
        const displayArea = document.getElementById('converted-dfa-display-area');
        const sourceNfaIdSpan = document.getElementById('source-nfa-id');

        messageArea.textContent = '';
        displayArea.classList.add('hidden');

        const userId = parseInt(userIdInput.value);
        if (isNaN(userId) || userId <= 0) {
            messageArea.textContent = 'Please enter a valid User ID.';
            messageArea.style.color = 'red';
            return;
        }

        const faEntry = savedFas.find(entry => entry.id === userId);

        if (!faEntry) {
            messageArea.textContent = `FA with User ID ${userId} not found.`;
            messageArea.style.color = 'red';
            return;
        }

        if (faEntry.fa.type !== "NFA") {
            let msg = `FA User ID ${userId} is already a DFA.`;
            if (faEntry.isNFA) { // It's a DFA that was already converted from an NFA
                msg = `FA User ID ${userId} is already a DFA (converted from an NFA). Do you want to re-convert its original NFA definition? (Re-conversion not implemented from original input yet if already DFA). Showing current DFA.`;
                 // For now, just display its current DFA form. A more complex setup would re-load original NFA input.
                currentFa = faEntry; // Set currentFa to this entry
                sourceNfaIdSpan.textContent = currentFa.id;
                displayFaDetails(currentFa.fa, 'converted-dfa-display-text', 'converted-dfa-display-visualization');
                displayArea.classList.remove('hidden');
                messageArea.textContent = msg;
                messageArea.style.color = 'orange';
                return;
            }
            messageArea.textContent = msg;
            messageArea.style.color = 'orange';
            return;
        }

        try {
            const convertedDFA = convertNFAtoDFA(faEntry.fa);
            // We are about to modify faEntry, so let's make currentFa point to it
            currentFa = faEntry;
            currentFa.fa = convertedDFA; // Update the FA object within the entry
            currentFa.isNFA = true;      // Mark that this DFA originated from an NFA

            sourceNfaIdSpan.textContent = currentFa.id;
            displayFaDetails(convertedDFA, 'converted-dfa-display-text', 'converted-dfa-display-visualization');
            displayArea.classList.remove('hidden');
            messageArea.textContent = `NFA User ID ${userId} converted successfully. You can save this DFA now.`;
            messageArea.style.color = 'green';
            // User can now click "Save This Converted DFA" button which calls saveCurrentFa()
        } catch (error) {
            console.error("Error during NFA by ID conversion:", error);
            messageArea.textContent = 'Error converting NFA: ' + error.message;
            messageArea.style.color = 'red';
        }
    }


    async function checkFaForTest() {
        // ... (existing implementation)
        const userId = parseInt(document.getElementById('test-user-id').value);
        if (isNaN(userId) || userId <= 0) {
            alert('Please enter a valid User ID.'); return;
        }
        const faEntry = savedFas.find(fa => fa.id === userId);
        if (!faEntry) {
            alert(`FA with User ID ${userId} not found.`);
            document.getElementById('fa-details-for-test').classList.add('hidden'); return;
        }
        lastTestedFaEntry = faEntry;
        displayFaDetails(faEntry.fa, 'display-fa-for-test-text', 'display-fa-for-test-visualization');
        document.getElementById('fa-details-for-test').classList.remove('hidden');
        document.getElementById('acceptance-result').textContent = '';
        document.getElementById('rejection-options').classList.add('hidden');
        document.getElementById('btn-save-test-result').classList.add('hidden');
        rejectionCount = 0;
    }

    async function testStringForAcceptance() {
        // ... (existing implementation)
        if (!lastTestedFaEntry) {
            alert('Please load an FA first.'); return;
        }
        const inputString = document.getElementById('test-string-input').value; // No trim to allow empty string
        let accepted = false;
        if (lastTestedFaEntry.fa.type === "DFA") {
            accepted = testStringAcceptanceDFA(lastTestedFaEntry.fa, inputString);
        } else if (lastTestedFaEntry.fa.type === "NFA") {
            accepted = testStringAcceptanceNFA(lastTestedFaEntry.fa, inputString);
        } else {
            alert('Unknown FA type for testing.'); return;
        }
        const resultElement = document.getElementById('acceptance-result');
        resultElement.textContent = `String "${inputString}" is ${accepted ? "ACCEPTED" : "REJECTED"}.`;
        resultElement.className = accepted ? 'accepted' : 'rejected'; // For styling via CSS
        
        lastTestedFaEntry.stringTestResults.push({ testString: inputString, accepted: accepted, timestamp: new Date().toISOString() });
        saveFas();

        const rejectionOptions = document.getElementById('rejection-options');
        const saveTestResultBtn = document.getElementById('btn-save-test-result');
        if (accepted) {
            saveTestResultBtn.classList.remove('hidden');
            rejectionCount = 0;
            rejectionOptions.classList.add('hidden');
        } else {
            saveTestResultBtn.classList.add('hidden');
            rejectionCount++;
            if (rejectionCount >= 3) {
                rejectionOptions.classList.remove('hidden');
            } else {
                rejectionOptions.classList.add('hidden');
            }
        }
        // document.getElementById('test-string-input').value = ''; // Keep string for reference? Or clear. User request implies clear.
    }

    async function saveLastTestedResult() {
        // ... (existing implementation)
        alert("Test result logged and saved.");
        showGui(mainMenu);
    }

    async function handleMinimizeDfa() {
        // ... (existing implementation)
        const userId = parseInt(document.getElementById('minimize-user-id').value);
        if (isNaN(userId) || userId <= 0) {
            alert('Please enter a valid User ID.'); return;
        }
        const faEntry = savedFas.find(fa => fa.id === userId);
        if (!faEntry) {
            alert(`FA with User ID ${userId} not found.`);
            document.getElementById('minimized-dfa-display').classList.add('hidden'); return;
        }
        // Check if it's a DFA before minimizing
        if (faEntry.fa.type !== "DFA") {
             const determinismCheckResult = checkDeterminism(faEntry.fa); // Re-check, though type should be reliable
             alert('Cannot minimize: The selected FA is not a DFA. Please convert NFA to DFA first if applicable. Reasons: \n- ' + determinismCheckResult.issues.join('\n- '));
             document.getElementById('minimized-dfa-display').classList.add('hidden');
             return;
        }

        try {
            const minimizedDFA = minimizeDFA(faEntry.fa); // minimizeDFA is from minimization.js
            faEntry.minimizedDfa = minimizedDFA;
            displayFaDetails(minimizedDFA, 'display-minimized-dfa-text', 'display-minimized-dfa-visualization');
            document.getElementById('minimized-dfa-display').classList.remove('hidden');
            alert(`DFA User ID ${userId} minimized successfully! Changes saved.`);
            saveFas(); // Save the FA entry with its new minimizedDfa
        } catch (error) {
            console.error("Error during DFA minimization:", error);
            alert('Error minimizing DFA: ' + error.message);
            document.getElementById('minimized-dfa-display').classList.add('hidden');
        }
    }

    function handleRemoveFa(event) {
        // ... (existing implementation)
        const faIdToRemove = parseInt(event.target.dataset.id);
        if (isNaN(faIdToRemove)) return;
        if (confirm(`Are you sure you want to remove FA User ID ${faIdToRemove}?`)) {
            savedFas = savedFas.filter(faEntry => faEntry.id !== faIdToRemove);
            saveFas();
            loadAndDisplayAllFas(); // Refresh table
            alert(`FA User ID ${faIdToRemove} removed.`);
        }
    }

    function loadAndDisplayAllFas() {
        const displayDiv = document.getElementById('all-fas-display');
        const downloadBtn = document.getElementById('btn-download-all-fas');
        displayDiv.innerHTML = '';

        if (savedFas.length === 0) {
            displayDiv.textContent = 'No Finite Automata saved yet.';
            downloadBtn.classList.add('hidden');
            return;
        }
        downloadBtn.classList.remove('hidden');

        const table = document.createElement('table');
        table.classList.add('fa-data-table');
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ["User ID", "Original Input", "Current FA Viz", "NFA Origin", "Minimized DFA Viz", "String Tests", "Actions"];
        headers.forEach(text => {
            let th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        savedFas.forEach(faEntry => {
            const row = tbody.insertRow();

            row.insertCell().textContent = faEntry.id;

            let cellOriginalInput = row.insertCell();
            cellOriginalInput.classList.add('original-input-cell');
            cellOriginalInput.innerHTML = `
                <strong>Type (Original):</strong> ${faEntry.originalInput.type || (faEntry.isNFA && faEntry.fa.type === "NFA" ? "NFA" : "DFA")}<br>
                <strong>States:</strong> ${faEntry.originalInput.states}<br>
                <strong>Alphabet:</strong> ${faEntry.originalInput.alphabet}<br>
                <strong>Start:</strong> ${faEntry.originalInput.startState}<br>
                <strong>Final:</strong> ${faEntry.originalInput.finalStates}<br>
                <strong>Transitions:</strong> ${faEntry.originalInput.transitions}
            `;
            
            // Current FA Visualization (could be original NFA, original DFA, or converted DFA)
            let cellCurrentFaViz = row.insertCell();
            const currentFaVizContainerId = `viz-current-fa-${faEntry.id}`;
            const currentFaVizDiv = document.createElement('div');
            currentFaVizDiv.id = currentFaVizContainerId;
            currentFaVizDiv.classList.add('visualization-container-inline');
            cellCurrentFaViz.appendChild(currentFaVizDiv);
            if (faEntry.fa) {
                setTimeout(() => visualizeFA(faEntry.fa, currentFaVizContainerId, false), 0);
                const viewLargerBtn = document.createElement('button');
                viewLargerBtn.textContent = 'View Larger';
                viewLargerBtn.classList.add('btn-view-larger');
                viewLargerBtn.onclick = () => {
                    displayFaDetails(faEntry.fa, null, 'modal-visualization-container', true);
                    visualizationModal.classList.remove('hidden');
                    visualizationModal.style.display = 'flex';
                };
                cellCurrentFaViz.appendChild(viewLargerBtn);
            } else { cellCurrentFaViz.textContent = 'N/A'; }


            // NFA Origin Status
            let cellNfaOrigin = row.insertCell();
            // faEntry.isNFA = true means it originated as an NFA (even if faEntry.fa is now a DFA)
            // faEntry.isNFA = false means it was input as a DFA
            cellNfaOrigin.textContent = faEntry.isNFA ? 'Yes' : 'No';


            // Minimized DFA Visualization
            let cellMinimizedDfaViz = row.insertCell();
            if (faEntry.minimizedDfa) {
                const minimizedDfaVizContainerId = `viz-minimized-dfa-${faEntry.id}`;
                const minimizedDfaVizDiv = document.createElement('div');
                minimizedDfaVizDiv.id = minimizedDfaVizContainerId;
                minimizedDfaVizDiv.classList.add('visualization-container-inline');
                cellMinimizedDfaViz.appendChild(minimizedDfaVizDiv);
                setTimeout(() => visualizeFA(faEntry.minimizedDfa, minimizedDfaVizContainerId, false), 0);

                const viewLargerBtnMin = document.createElement('button');
                viewLargerBtnMin.textContent = 'View Larger';
                viewLargerBtnMin.classList.add('btn-view-larger');
                viewLargerBtnMin.onclick = () => {
                    displayFaDetails(faEntry.minimizedDfa, null, 'modal-visualization-container', true);
                    visualizationModal.classList.remove('hidden');
                    visualizationModal.style.display = 'flex';
                };
                cellMinimizedDfaViz.appendChild(viewLargerBtnMin);
            } else { cellMinimizedDfaViz.textContent = 'N/A'; }


            // String Test Results
            let cellTestResults = row.insertCell();
            cellTestResults.classList.add('string-test-results-cell');
            if (faEntry.stringTestResults && faEntry.stringTestResults.length > 0) {
                const ul = document.createElement('ul');
                faEntry.stringTestResults.forEach(result => {
                    const li = document.createElement('li');
                    li.innerHTML = `"${result.testString}" - <span class="${result.accepted ? 'accepted' : 'rejected'}">${result.accepted ? 'ACCEPTED' : 'REJECTED'}</span>`;
                    ul.appendChild(li);
                });
                cellTestResults.appendChild(ul);
            } else { cellTestResults.textContent = 'No tests yet.'; }

            // Actions
            let cellActions = row.insertCell();
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('btn-remove-fa');
            removeButton.dataset.id = faEntry.id;
            removeButton.addEventListener('click', handleRemoveFa);
            cellActions.appendChild(removeButton);
        });
        displayDiv.appendChild(table);
    }

    /**
     * Downloads all saved FAs as a JSON file.
     */
    function downloadAllFasAsJson() {
        if (savedFas.length === 0) {
            alert("No FAs to download.");
            return;
        }
        // Prepare data for download, ensuring FA objects are properly serialized using their toJSON methods
        const dataToDownload = JSON.stringify(
            savedFas.map(faEntry => ({
                id: faEntry.id,
                originalInput: faEntry.originalInput,
                fa: faEntry.fa ? faEntry.fa.toJSON() : null, // Serialize current FA
                isNFA: faEntry.isNFA, // NFA origin status
                minimizedDfa: faEntry.minimizedDfa ? faEntry.minimizedDfa.toJSON() : null, // Serialize minimized DFA
                stringTestResults: faEntry.stringTestResults
            })),
            null, // Replacer function (null for default)
            2     // Indentation space for pretty printing
        );

        const blob = new Blob([dataToDownload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'saved-fas.json'; // Filename for download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("All FAs data prepared for download as 'saved-fas.json'. Check your browser's downloads.");
    }

    // --- Initial Load ---
    loadSavedFas();
    showGui(mainMenu);
});