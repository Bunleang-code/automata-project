// automata-project/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    const mainMenu = document.getElementById('main-menu');
    const inputGui = document.getElementById('input-gui');
    const nfaGui = document.getElementById('nfa-gui');
    const dfaGui = document.getElementById('dfa-gui');
    const testAcceptanceGui = document.getElementById('test-acceptance-gui');
    const minimizeDfaGui = document.getElementById('minimize-dfa-gui');
    const showAllFasGui = document.getElementById('show-all-fas-gui');

    // Main Menu Buttons
    document.getElementById('btn-input-fa').addEventListener('click', () => showGui(inputGui));
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
    document.getElementById('btn-save-nfa').addEventListener('click', saveCurrentFa);
    document.getElementById('btn-convert-nfa-to-dfa').addEventListener('click', convertNfaToDfaAndDisplay);
    document.getElementById('btn-nfa-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // DFA GUI Buttons
    document.getElementById('btn-save-dfa').addEventListener('click', saveCurrentFa);
    document.getElementById('btn-dfa-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // Test Acceptance GUI Buttons
    document.getElementById('btn-test-gui-exit').addEventListener('click', () => showGui(mainMenu));
    document.getElementById('btn-check-fa-for-test').addEventListener('click', checkFaForTest);
    document.getElementById('btn-test-string-acceptance').addEventListener('click', testStringForAcceptance);
    document.getElementById('btn-continue-test').addEventListener('click', () => {
        document.getElementById('acceptance-result').textContent = '';
        document.getElementById('test-string-input').value = '';
        document.getElementById('rejection-options').classList.add('hidden');
        document.getElementById('btn-save-test-result').classList.add('hidden');
        rejectionCount = 0; // Reset rejection count
    });
    document.getElementById('btn-exit-test-to-main').addEventListener('click', () => showGui(mainMenu));
    document.getElementById('btn-save-test-result').addEventListener('click', saveLastTestedResult);


    // Minimize DFA GUI Buttons
    document.getElementById('btn-minimize-dfa-action').addEventListener('click', handleMinimizeDfa);
    document.getElementById('btn-minimize-gui-exit').addEventListener('click', () => showGui(mainMenu));

    // Show All FAs GUI Buttons
    document.getElementById('btn-show-all-fas-exit').addEventListener('click', () => showGui(mainMenu));


    // --- Global Variables for current FA and User ID ---
    let currentFa = null; // Stores the full FA entry object { id: ..., fa: FA_Object, originalInput: {}, stringTestResults: [] }
    let currentFaUserId = 0; // Tracks the highest assigned User ID
    let savedFas = []; // Array to hold { id: ..., fa: FA_Object, originalInput: {}, stringTestResults: [], dfaVisualization: base64 } entries
    let rejectionCount = 0;
    let lastTestedFaEntry = null; // Stores the full FA entry object for the last test

    // --- Utility Functions ---
    function showGui(guiElement) {
        const guis = [mainMenu, inputGui, nfaGui, dfaGui, testAcceptanceGui, minimizeDfaGui, showAllFasGui];
        guis.forEach(gui => gui.classList.add('hidden'));
        guiElement.classList.remove('hidden');
    }

    /**
     * Reconstructs an FA object (DFA or NFA) from its plain JSON data.
     * This is crucial when loading from localStorage because JSON.parse()
     * only returns plain objects, losing the class methods.
     * @param {object} faData - The plain object representing the FA.
     * @returns {FiniteAutomaton} An instance of DFA or NFA.
     */
    function reconstructFaObject(faData) {
        // Handle null or undefined faData gracefully
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

    /**
     * Loads saved FAs from localStorage and reconstructs their objects.
     */
    function loadSavedFas() {
        const fasJson = localStorage.getItem('savedFas');
        if (fasJson) {
            const rawFas = JSON.parse(fasJson);
            savedFas = rawFas.map(faEntryData => {
                const faObject = reconstructFaObject(faEntryData.fa);
                // Reconstruct minimized DFA object if it exists
                const minimizedDfaObject = faEntryData.minimizedDfa ? reconstructFaObject(faEntryData.minimizedDfa) : null;
                return {
                    id: faEntryData.id,
                    fa: faObject,
                    originalInput: faEntryData.originalInput || {}, // Load original input
                    stringTestResults: faEntryData.stringTestResults || [], // Load test results
                    // dfaVisualization: faEntryData.dfaVisualization || null, // No longer needed for live viz in table
                    isNFA: faEntryData.isNFA, // Load NFA flag
                    minimizedDfa: minimizedDfaObject // Store the minimized DFA object
                };
            });
            // Update currentFaUserId based on the highest existing ID
            if (savedFas.length > 0) {
                currentFaUserId = Math.max(...savedFas.map(fa => fa.id));
            }
        }
    }

    /**
     * Saves the current list of FAs to localStorage.
     * This uses the toJSON() methods on FA, State, Transition classes for proper serialization.
     */
    function saveFas() {
        localStorage.setItem('savedFas', JSON.stringify(savedFas.map(faEntry => ({
            id: faEntry.id,
            fa: faEntry.fa.toJSON(), // Call the toJSON method on the FA object
            originalInput: faEntry.originalInput, // Store the raw input
            stringTestResults: faEntry.stringTestResults, // Store test results
            // dfaVisualization: faEntry.dfaVisualization, // No longer needed for live viz in table
            isNFA: faEntry.isNFA, // Store NFA flag
            minimizedDfa: faEntry.minimizedDfa ? faEntry.minimizedDfa.toJSON() : null // Store minimized DFA as JSON
        }))));
    }

    function getNextUserId() {
        currentFaUserId++;
        return currentFaUserId;
    }

    /**
     * Displays FA details as text and optionally visualizes it.
     * @param {FiniteAutomaton} fa - The FA object to display.
     * @param {string} textElementId - ID of the <pre> element for text display.
     * @param {string} visualizationElementId - ID of the <div> element for visualization.
     * @returns {void}
     */
    async function displayFaDetails(fa, textElementId, visualizationElementId) {
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
            // No need to await image data if we're not storing it as base64 in faEntry.dfaVisualization
            // The visualizeFA function directly renders to the DOM
            visualizeFA(fa, visualizationElementId);
        }
    }

    // --- Event Handlers ---

    /**
     * Handles adding a new FA from the input fields.
     * Detects if it's a DFA or NFA and displays accordingly.
     */
    async function handleAddFa() {
        console.log("Add FA button clicked.");
        const statesInput = document.getElementById('states-input');
        const alphabetInput = document.getElementById('alphabet-input');
        const startStateInput = document.getElementById('start-state-input');
        const finalStatesInput = document.getElementById('final-states-input');
        const transitionsInput = document.getElementById('transitions-input');

        // Check if all input elements exist
        if (!statesInput || !alphabetInput || !startStateInput || !finalStatesInput || !transitionsInput) {
            console.error("One or more input elements not found in the DOM.");
            alert('Error: Required input fields are missing from the page. Please check your HTML.');
            return;
        }

        const statesValue = statesInput.value.trim();
        const alphabetValue = alphabetInput.value.trim();
        const startStateValue = startStateInput.value.trim();
        const finalStatesValue = finalStatesInput.value.trim();
        const transitionsValue = transitionsInput.value.trim();

        // Store original input values before parsing
        const originalInputData = {
            states: statesValue,
            alphabet: alphabetValue,
            startState: startStateValue,
            finalStates: finalStatesValue,
            transitions: transitionsValue
        };

        if (!statesValue || !alphabetValue || !startStateValue || !finalStatesValue || !transitionsValue) {
            alert('Please fill in all FA details.');
            return;
        }

        try {
            console.log("Parsing states...");
            const states = statesValue.split(',').map(s => new State(s.trim())).filter(s => s.name !== '');

            console.log("Parsing alphabet...");
            // Filter out empty strings from alphabet
            const alphabet = alphabetValue.split(',').map(s => s.trim()).filter(s => s !== '');
            // Ensure no 'epsilon' in regular alphabet
            if (alphabet.includes('epsilon')) {
                throw new Error("The symbol 'epsilon' is reserved for epsilon transitions and cannot be part of the regular alphabet.");
            }


            console.log("Finding start state...");
            const startState = states.find(s => s.name === startStateValue);
            if (!startState) {
                throw new Error(`Start state '${startStateValue}' must be one of the defined states.`);
            }

            console.log("Finding final states...");
            const finalStates = finalStatesValue.split(',').map(fs => {
                const foundState = states.find(s => s.name === fs.trim());
                return foundState;
            }).filter(fs => fs); // Filter out any final state names not found in the states list
            if (finalStatesValue.length > 0 && finalStates.length === 0 && finalStatesValue.split(',').map(fs => fs.trim()).some(fs => fs !== '')) {
                // Check if finalStatesValue was not empty but no valid states were found
                throw new Error('One or more final states are not defined in the states list.');
            }


            console.log("Parsing transitions...");
            const transitions = [];
            const transitionEntries = transitionsValue.split(';').filter(entry => entry.trim() !== ''); // Filter out empty entries
            
            transitionEntries.forEach((tStr, index) => {
                const parts = tStr.trim().split(',');
                if (parts.length === 3) {
                    const fromStateName = parts[0].trim();
                    const symbol = parts[1].trim();
                    const toStatesString = parts[2].trim();

                    const fromState = states.find(s => s.name === fromStateName);
                    if (!fromState) {
                        throw new Error(`From state '${fromStateName}' not defined for transition: ${tStr}`);
                    }

                    if (symbol === 'epsilon' && alphabet.includes('epsilon')) {
                         throw new Error("Alphabet contains 'epsilon'. The symbol 'epsilon' is reserved only for epsilon transitions and cannot be in the alphabet.");
                    }
                    if (symbol !== 'epsilon' && !alphabet.includes(symbol)) {
                        throw new Error(`Symbol '${symbol}' not defined in the alphabet for transition: ${tStr}`);
                    }


                    let targetStateNames;
                    if (toStatesString.startsWith('{') && toStatesString.endsWith('}')) {
                        targetStateNames = toStatesString.substring(1, toStatesString.length - 1).split(',').map(s => s.trim()).filter(s => s !== '');
                    } else {
                        targetStateNames = [toStatesString.trim()];
                    }

                    const toStates = targetStateNames.map(tsName => {
                        const state = states.find(s => s.name === tsName);
                        if (!state) {
                            throw new Error(`To state '${tsName}' not defined for transition: ${tStr}`);
                        }
                        return state;
                    });
                    
                    if (toStates.length === 0 && targetStateNames.length > 0) { // If target names were provided but no states found
                         throw new Error(`One or more target states for transition '${tStr}' not defined in the states list.`);
                    }

                    transitions.push(new Transition(fromState, symbol, toStates));
                } else {
                    throw new Error(`Malformed transition format at entry ${index + 1}: '${tStr}'. Expected 'from,symbol,to' or 'from,symbol,{to1,to2}'`);
                }
            });

            const userId = getNextUserId();
            let currentFaEntry = {
                id: userId,
                fa: null, // Will be set to DFA or NFA instance
                originalInput: originalInputData,
                stringTestResults: [],
                // dfaVisualization: null, // No longer needed for live viz in table
                isNFA: false, // Default to false, updated if NFA
                minimizedDfa: null // Stores the minimized DFA object
            };

            console.log("Checking determinism...");
            // Temporarily create an NFA to run determinism check, as all FA types can be represented initially as NFA.
            const tempFA = new NFA(states, alphabet, transitions, startState, finalStates);
            const determinismCheckResult = checkDeterminism(tempFA);

            if (determinismCheckResult.isDFA) {
                // If it's deterministic, create a DFA object
                const newDFA = new DFA(states, alphabet, transitions, startState, finalStates);
                currentFaEntry.fa = newDFA;
                document.getElementById('dfa-user-id').textContent = userId;
                displayFaDetails(newDFA, 'dfa-display-text', 'dfa-display-visualization');
                alert(`FA created as DFA (User ID: ${userId}).`);
                showGui(dfaGui);
            } else {
                // If it's not deterministic, it's an NFA
                const newNFA = new NFA(states, alphabet, transitions, startState, finalStates);
                currentFaEntry.fa = newNFA;
                currentFaEntry.isNFA = true; // Mark as NFA
                document.getElementById('nfa-user-id').textContent = userId;
                displayFaDetails(newNFA, 'nfa-display-text', 'nfa-display-visualization');
                alert(`FA created as NFA (User ID: ${userId}). Reasons: \n- ${determinismCheckResult.issues.join('\n- ')}`);
                showGui(nfaGui);
            }

            // Set the global currentFa to the full entry object
            currentFa = currentFaEntry;

            // Now save the FA entry including visualization data
            saveFas(); // This ensures the visualization is saved immediately

            // Clear input fields after successful addition
            statesInput.value = '';
            alphabetInput.value = '';
            startStateInput.value = '';
            finalStatesInput.value = '';
            transitionsInput.value = '';

        } catch (error) {
            console.error("Error during handleAddFa:", error);
            alert('Error creating FA: ' + error.message);
        }
    }

    /**
     * Saves the currently active FA (DFA or NFA) to the savedFas array and localStorage.
     */
    async function saveCurrentFa() {
        if (currentFa) {
            const existingIndex = savedFas.findIndex(fa => fa.id === currentFa.id);
            if (existingIndex !== -1) {
                savedFas[existingIndex] = currentFa;
                alert(`FA User ID ${currentFa.id} updated successfully!`);
            }
            else {
                savedFas.push(currentFa);
                alert(`FA User ID ${currentFa.id} saved successfully!`);
            }
            saveFas();
            showGui(mainMenu);
        } else {
            alert('No FA to save. Please add one first.');
        }
    }

    /**
     * Converts the current NFA to a DFA and displays it.
     */
    async function convertNfaToDfaAndDisplay() {
        if (currentFa && currentFa.fa.type === "NFA") {
            try {
                const convertedDFA = convertNFAtoDFA(currentFa.fa);
                currentFa.fa = convertedDFA; // Update the FA object to the converted DFA
                currentFa.isNFA = false; // It's now a DFA
                document.getElementById('dfa-user-id').textContent = currentFa.id;
                displayFaDetails(convertedDFA, 'dfa-display-text', 'dfa-display-visualization'); // Display in current GUI
                alert(`NFA User ID ${currentFa.id} converted to DFA successfully!`);
                showGui(dfaGui);
                saveFas(); // Save changes after conversion
            } catch (error) {
                console.error("Error during NFA to DFA conversion:", error);
                alert('Error during NFA to DFA conversion: ' + error.message);
            }
        } else {
            alert('No NFA loaded or selected FA is already a DFA. Please select an NFA from the input screen first.');
        }
    }

    /**
     * Loads an FA by User ID for string testing.
     */
    async function checkFaForTest() {
        const userId = parseInt(document.getElementById('test-user-id').value);
        if (isNaN(userId) || userId <= 0) {
            alert('Please enter a valid User ID (a positive number).');
            return;
        }

        const faEntry = savedFas.find(fa => fa.id === userId);
        if (!faEntry) {
            alert(`FA with User ID ${userId} not found.`);
            document.getElementById('fa-details-for-test').classList.add('hidden');
            return;
        }

        lastTestedFaEntry = faEntry; // Store the full FA entry for testing
        displayFaDetails(faEntry.fa, 'display-fa-for-test-text', 'display-fa-for-test-visualization');
        document.getElementById('fa-details-for-test').classList.remove('hidden');
        document.getElementById('acceptance-result').textContent = '';
        document.getElementById('rejection-options').classList.add('hidden');
        document.getElementById('btn-save-test-result').classList.add('hidden');
        rejectionCount = 0;
    }

    /**
     * Tests a string for acceptance by the currently loaded FA.
     */
    async function testStringForAcceptance() {
        if (!lastTestedFaEntry) {
            alert('Please load an FA first by entering its User ID and clicking "Load FA".');
            return;
        }

        const inputString = document.getElementById('test-string-input').value.trim();
        // Allow empty string testing, so no check for !inputString here

        let accepted = false;
        if (lastTestedFaEntry.fa.type === "DFA") {
            accepted = testStringAcceptanceDFA(lastTestedFaEntry.fa, inputString);
        } else if (lastTestedFaEntry.fa.type === "NFA") {
            accepted = testStringAcceptanceNFA(lastTestedFaEntry.fa, inputString);
        } else {
            alert('Unknown FA type for testing. Cannot test string.');
            return;
        }

        const resultElement = document.getElementById('acceptance-result');
        const rejectionOptions = document.getElementById('rejection-options');
        const saveTestResultBtn = document.getElementById('btn-save-test-result');

        resultElement.textContent = `String "${inputString}" is ${accepted ? "ACCEPTED" : "REJECTED"}.`;
        resultElement.style.color = accepted ? 'green' : 'red';

        // Add test result to the current FA entry
        lastTestedFaEntry.stringTestResults.push({
            testString: inputString,
            accepted: accepted,
            timestamp: new Date().toISOString()
        });
        saveFas(); // Save updated test results to localStorage

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
        document.getElementById('test-string-input').value = '';
    }

    /**
     * Confirms saving the last test result and exits to main menu.
     */
    async function saveLastTestedResult() {
        // The result is already saved by testStringForAcceptance, so this button
        // just confirms and exits.
        alert("Test result logged and saved.");
        showGui(mainMenu);
    }

    /**
     * Handles minimization of a DFA by User ID.
     */
    async function handleMinimizeDfa() {
        const userId = parseInt(document.getElementById('minimize-user-id').value);
        if (isNaN(userId) || userId <= 0) {
            alert('Please enter a valid User ID (a positive number).');
            return;
        }

        const faEntry = savedFas.find(fa => fa.id === userId);
        if (!faEntry) {
            alert(`FA with User ID ${userId} not found.`);
            document.getElementById('minimized-dfa-display').classList.add('hidden');
            return;
        }

        const determinismCheckResult = checkDeterminism(faEntry.fa);
        if (!determinismCheckResult.isDFA) {
            alert('Cannot minimize: The selected FA is not a DFA. Please convert NFA to DFA first if applicable. Reasons: \n- ' + determinismCheckResult.issues.join('\n- '));
            document.getElementById('minimized-dfa-display').classList.add('hidden');
            return;
        }

        try {
            const minimizedDFA = minimizeDFA(faEntry.fa);
            faEntry.minimizedDfa = minimizedDFA; // Store the actual minimized DFA object
            displayFaDetails(minimizedDFA, 'display-minimized-dfa-text', 'display-minimized-dfa-visualization');
            document.getElementById('minimized-dfa-display').classList.remove('hidden');
            alert(`DFA User ID ${userId} minimized successfully!`);
            saveFas(); // Save changes after minimization
        } catch (error) {
            console.error("Error during DFA minimization:", error);
            alert('Error during DFA minimization: ' + error.message);
            document.getElementById('minimized-dfa-display').classList.add('hidden');
        }
    }

    /**
     * Handles the removal of an FA from the savedFas array and localStorage.
     * @param {Event} event - The click event from the remove button.
     */
    function handleRemoveFa(event) {
        const faIdToRemove = parseInt(event.target.dataset.id);
        if (isNaN(faIdToRemove)) {
            console.error("Attempted to remove FA with invalid ID.");
            return;
        }

        if (confirm(`Are you sure you want to remove FA with User ID ${faIdToRemove}?`)) {
            savedFas = savedFas.filter(faEntry => faEntry.id !== faIdToRemove);
            saveFas(); // Update localStorage
            loadAndDisplayAllFas(); // Refresh the displayed table
            alert(`FA User ID ${faIdToRemove} removed successfully.`);
        }
    }

    /**
     * Loads all saved FAs and displays them in a table format in the 'Show All FAs' section.
     */
    function loadAndDisplayAllFas() {
        const displayDiv = document.getElementById('all-fas-display');
        displayDiv.innerHTML = ''; // Clear previous content

        if (savedFas.length === 0) {
            displayDiv.textContent = 'No Finite Automata saved yet.';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('fa-data-table');

        // Create table header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        // Updated headers to reflect new visualization columns
        const headers = ["User ID", "FA (Original Input)", "Original FA Visualization", "NFA Status", "Minimized DFA Visualization", "String Test Results", "Actions"];
        headers.forEach(text => {
            let th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        table.appendChild(thead);

        // Create table body
        const tbody = table.createTBody();
        savedFas.forEach(faEntry => {
            const row = tbody.insertRow();

            // User ID
            let cellId = row.insertCell();
            cellId.textContent = faEntry.id;

            // FA (Original Input)
            let cellOriginalInput = row.insertCell();
            cellOriginalInput.classList.add('original-input-cell');
            cellOriginalInput.innerHTML = `
                <strong>Type:</strong> ${faEntry.fa.type}<br>
                <strong>States:</strong> ${faEntry.originalInput.states}<br>
                <strong>Alphabet:</strong> ${faEntry.originalInput.alphabet}<br>
                <strong>Start:</strong> ${faEntry.originalInput.startState}<br>
                <strong>Final:</strong> ${faEntry.originalInput.finalStates}<br>
                <strong>Transitions:</strong> ${faEntry.originalInput.transitions}
            `;

            // Original FA Visualization
            let cellOriginalFaVis = row.insertCell();
            const originalFaVizContainerId = `viz-original-fa-${faEntry.id}`;
            const originalFaVizDiv = document.createElement('div');
            originalFaVizDiv.id = originalFaVizContainerId;
            // Add a class for styling, e.g., for smaller containers in the table
            originalFaVizDiv.classList.add('visualization-container-inline'); 
            cellOriginalFaVis.appendChild(originalFaVizDiv);
            if (faEntry.fa) {
                // Use setTimeout to ensure the div is attached to the DOM before vis.js tries to render
                setTimeout(() => visualizeFA(faEntry.fa, originalFaVizContainerId), 0);
            } else {
                originalFaVizDiv.textContent = 'N/A';
            }


            // NFA Status
            let cellNfaStatus = row.insertCell();
            cellNfaStatus.textContent = faEntry.isNFA ? 'Yes' : 'No';

            // Minimized DFA Visualization
            let cellMinimizedDfaVis = row.insertCell();
            const minimizedDfaVizContainerId = `viz-minimized-dfa-${faEntry.id}`;
            const minimizedDfaVizDiv = document.createElement('div');
            minimizedDfaVizDiv.id = minimizedDfaVizContainerId;
            minimizedDfaVizDiv.classList.add('visualization-container-inline'); 
            cellMinimizedDfaVis.appendChild(minimizedDfaVizDiv);
            if (faEntry.minimizedDfa) { // Check if minimizedDfa object exists
                setTimeout(() => visualizeFA(faEntry.minimizedDfa, minimizedDfaVizContainerId), 0);
            } else {
                minimizedDfaVizDiv.textContent = 'N/A';
            }

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
            } else {
                cellTestResults.textContent = 'No tests yet.';
            }

            // Actions Cell
            let cellActions = row.insertCell();
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('btn-remove-fa');
            removeButton.dataset.id = faEntry.id; // Store FA ID in a data attribute
            removeButton.addEventListener('click', handleRemoveFa); // Attach event listener
            cellActions.appendChild(removeButton);

            // You can add "Visualize" buttons here if you want to open a larger view
            // For now, the inline visualization is directly rendered.
        });
        table.appendChild(tbody);
        displayDiv.appendChild(table);
    }

    // --- Initial Load ---
    loadSavedFas();
    showGui(mainMenu); // Start at the main menu
});