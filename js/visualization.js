// automata-project/js/visualization.js

/**
 * Visualizes a Finite Automaton (DFA or NFA) using vis.js.
 * @param {FiniteAutomaton} fa - The FA object to visualize.
 * @param {string} containerId - The ID of the HTML div element where the network will be drawn.
 */
function visualizeFA(fa, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(
      `Visualization container with ID '${containerId}' not found.`
    );
    return;
  }

  container.innerHTML = "";
  // Ensure the container has an appropriate height, CSS might override for specific containers
  if (!container.style.height || container.style.height === "0px") {
    container.style.height = "300px"; // Default height if not set by CSS for this specific ID
  }
  container.style.width = "100%";

  const nodes = [];
  const edges = [];

//   fa.states.forEach((state) => {
//     let label = state.name;
//     let shape = "circle";
//     let fontColor = "black";
//     let nodeBackgroundColor = "#97C2E0"; // Default state color
//     let nodeBorderColor = "#2B7CE9";

//     // Check for Trap/Dead state first for color
//     if (state.name === "TrapState" || state.name === "dead") {
//       nodeBackgroundColor = "#ff6961"; // Light Red
//       nodeBorderColor = "#dc143c"; // Crimson Red border
//     } else if (state.equals(fa.startState)) {
//       nodeBackgroundColor = "#FFD700"; // Gold for start state
//       nodeBorderColor = "#DAA520";
//     }

//     if (fa.isFinal(state)) {
//       shape = "doublecircle"; // Indicate final state
//       borderWidth = 4;
      
//       // If it's a final trap state, it will be red and doublecircle.
//       // If it's a final start state, it will be gold and doublecircle.
//     }

//     nodes.push({
//       id: state.name,
//       label: label,
//       shape: shape,
//       color: {
//         background: nodeBackgroundColor,
//         border: nodeBorderColor,
//         highlight: {
//           background: nodeBackgroundColor,
//           border: nodeBorderColor,
//         },
//         hover: {
//           background: nodeBackgroundColor,
//           border: nodeBorderColor,
//         },
//       },
//       font: { color: fontColor },
//       borderWidth: 2,
//       shadow: {
//         enabled: true,
//         color: "rgba(0,0,0,0.3)",
//         size: 5,
//         x: 2,
//         y: 2,
//       },

//       margin: 10,
//       physics: true,
//     });
//   });



fa.states.forEach(state => {
    let nodeOptions = {
        id: state.name,
        label: state.name,
        shape: 'circle', // Default shape
        color: {
            background: '#97C2E0', // Default state color
            border: '#2B7CE9', // Default border color
            highlight: {
                background: '#97C2E0',
                border: '#2B7CE9'
            },
            hover: {
                background: '#97C2E0',
                border: '#2B7CE9'
            }
        },
        borderWidth: 2,
        margin: 8, // Added for better double circle visibility
        physics: true
    };

    // Final state styling (must come first to override other styles)
    if (fa.isFinal(state)) {
        nodeOptions.shape = 'doublecircle';
        nodeOptions.borderWidth = 3;
        nodeOptions.color.background = '#90EE90'; // Light green for final states
        nodeOptions.color.border = '#2B7CE9'; // Forest green border
    }

    // Dead/trap state styling
    if (state.name === 'TrapState' || state.name === 'dead') {
        nodeOptions.color.background = '#ff6961';
        nodeOptions.color.border = '#dc143c';
    }

    // Start state styling
    if (state.equals(fa.startState)) {
        nodeOptions.color.background = '#FFD700';
        nodeOptions.color.border = '#DAA520';
    }

    nodes.push(nodeOptions);
});
  if (fa.startState) {
    // Check if start_pointer already exists to prevent duplicates if visualizeFA is called multiple times on same container
    if (!nodes.some((node) => node.id === "start_pointer")) {
      nodes.push({
        id: "start_pointer",
        label: "",
        shape: "text",
        x: -150,
        y: 0,
        physics: false,
        fixed: true,
        size: 0,
      });
      edges.push({
        from: "start_pointer",
        to: fa.startState.name,
        arrows: "to",
        color: { color: "black" },
        dashes: true,
        length: 100,
        smooth: false, // Straight line for start pointer
      });
    }
  }

  const groupedTransitions = new Map();
  fa.transitions.forEach((transition) => {
    transition.toStates.forEach((toState) => {
      const key = `${transition.fromState.name}-${toState.name}`;
      if (!groupedTransitions.has(key)) {
        groupedTransitions.set(key, []);
      }
      groupedTransitions
        .get(key)
        .push(transition.symbol === "epsilon" ? "ε" : transition.symbol);
    });
  });

  groupedTransitions.forEach((symbols, key) => {
    const [fromName, toName] = key.split("-");
    edges.push({
      from: fromName,
      to: toName,
      label: symbols.join(", "),
      arrows: "to",
      font: {
        align: "middle",
        strokeWidth: 0,
        color: "black" /* Ensure label color */,
      },
      color: { color: "#848484", hover: "#505050", highlight: "#505050" },
      selfReference: {
        // Settings for loops on a single node
        size: 20,
        angle: Math.PI / 4,
        renderBehindTheNode: true,
      },
      smooth: {
        enabled: true,
        type: fromName === toName ? "curvedCW" : "dynamic", // Use curved for self-loops
        roundness: fromName === toName ? 0.7 : 0.5,
      },
    });
  });

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  const options = {
    edges: {
      font: {
        background: "white",
      },
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -3000, // Adjusted for better spacing
        centralGravity: 0.25,
        springLength: 150,
        springConstant: 0.05,
        damping: 0.09,
        avoidOverlap: 0.6, // Increased to prevent overlap
      },
      solver: "barnesHut",
      stabilization: {
        // Speed up stabilization
        iterations: 1000,
        fit: true,
      },
    },
    layout: {
      // randomSeed: undefined, // Use default or set one for consistent layouts
      improvedLayout: true,
    },
    interaction: {
      hover: true, // Enable hover effects
      tooltipDelay: 200,
    },
  };

  const network = new vis.Network(container, data, options);

  network.once("stabilizationIterationsDone", function () {
    // network.setOptions( { physics: false } ); // Keep physics for dragging? Or disable.
    network.fit();
  });
}
