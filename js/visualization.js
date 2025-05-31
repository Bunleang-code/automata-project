// automata-project/js/visualization.js

/**
 * Visualizes a Finite Automaton (DFA or NFA) using vis.js.
 * @param {FiniteAutomaton} fa - The FA object to visualize.
 * @param {string} containerId - The ID of the HTML div element where the network will be drawn.
 */
function visualizeFA(fa, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Visualization container with ID '${containerId}' not found.`);
        return;
    }

    // Clear previous visualization
    container.innerHTML = '';
    // Ensure the container has a minimum height for vis.js to render
    container.style.height = '300px';
    container.style.width = '100%'; // Or a fixed width if preferred

    const nodes = [];
    const edges = [];

    // Create nodes for each state
    fa.states.forEach(state => {
        let label = state.name;
        let color = '#97C2E0'; // Default state color
        let shape = 'circle';
        let fontColor = 'black';
        let borderColor = '#2B7CE9';

        if (fa.isFinal(state)) {
            shape = 'doublecircle'; // Indicate final state
        }
        if (state.equals(fa.startState)) {
            color = { background: '#FFD700', border: '#DAA520' }; // Gold for start state
            borderColor = '#DAA520';
        }

        nodes.push({
            id: state.name,
            label: label,
            shape: shape,
            color: color,
            font: { color: fontColor },
            borderWidth: 2,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.3)',
                size: 5,
                x: 2,
                y: 2
            }
        });
    });

    // Add a dummy node and edge for the start state pointer
    if (fa.startState) {
        nodes.push({ id: 'start_pointer', label: '', shape: 'text', x: -150, y: 0, physics: false, fixed: true, size: 0 });
        edges.push({
            from: 'start_pointer',
            to: fa.startState.name,
            arrows: 'to',
            color: { color: 'black' },
            dashes: true,
            length: 100 // Adjust length of the start arrow
        });
    }

    // Group transitions with the same source and destination to consolidate labels
    const groupedTransitions = new Map(); // Key: `${from.name}-${to.name}` -> Array of symbols

    fa.transitions.forEach(transition => {
        transition.toStates.forEach(toState => {
            const key = `${transition.fromState.name}-${toState.name}`;
            if (!groupedTransitions.has(key)) {
                groupedTransitions.set(key, []);
            }
            // Use 'ε' for epsilon, otherwise the symbol
            groupedTransitions.get(key).push(transition.symbol === 'epsilon' ? 'ε' : transition.symbol);
        });
    });

    groupedTransitions.forEach((symbols, key) => {
        const [fromName, toName] = key.split('-');
        edges.push({
            from: fromName,
            to: toName,
            label: symbols.join(', '),
            arrows: 'to',
            font: { align: 'middle' },
            color: { color: '#848484' },
            smooth: {
                enabled: true,
                type: 'dynamic' // 'dynamic' adjusts curvature based on number of edges
            }
        });
    });

    // Create a network
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        edges: {
            font: {
                background: 'white' // Make labels readable over lines
            }
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 120, // Increased spring length for more spacing
                springConstant: 0.05,
                damping: 0.09,
                avoidOverlap: 0.5 // Try to prevent node overlap
            },
            solver: 'barnesHut'
        },
        layout: {
            // For simple linear FAs, hierarchical can look good.
            // For general, non-linear FAs, let physics handle it.
            // hierarchical: { enabled: true, direction: 'LR', sortMethod: 'directed' }
            // If you enable hierarchical layout, disable physics or configure it carefully.
        }
    };

    const network = new vis.Network(container, data, options);

    // Optional: After network is stable, disable physics and fit to view
    network.once('stabilizationIterationsDone', function() {
        network.setOptions( { physics: false } );
        network.fit(); // Zoom to fit all nodes
    });
}