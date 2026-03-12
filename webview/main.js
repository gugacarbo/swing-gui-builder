(function () {
  const vscode = acquireVsCodeApi();

  const canvas = document.getElementById('canvas');
  const propertiesContent = document.getElementById('properties-content');

  // State
  let components = [];
  let selectedComponentId = null;
  let frameWidth = parseInt(canvas.style.width) || 800;
  let frameHeight = parseInt(canvas.style.height) || 600;
  let counters = { Button: 0, Label: 0, TextField: 0, PasswordField: 0, TextArea: 0 };

  const DEFAULT_SIZES = {
    Button: { width: 100, height: 30 },
    Label: { width: 100, height: 25 },
    TextField: { width: 150, height: 30 },
    PasswordField: { width: 150, height: 30 },
    TextArea: { width: 200, height: 100 },
  };

  function generateId() {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateVariableName(type) {
    counters[type]++;
    const prefix = type.charAt(0).toLowerCase() + type.slice(1);
    return prefix + counters[type];
  }

  // ========== DRAG FROM PALETTE ==========
  const paletteItems = document.querySelectorAll('.palette-item');
  paletteItems.forEach(function (item) {
    item.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('component-type', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  canvas.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('component-type');
    if (!type) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left);
    const y = Math.max(0, e.clientY - rect.top);
    const size = DEFAULT_SIZES[type] || { width: 100, height: 30 };

    const component = {
      id: generateId(),
      type: type,
      variableName: generateVariableName(type),
      x: Math.round(x),
      y: Math.round(y),
      width: size.width,
      height: size.height,
      text: type === 'Label' ? 'Label' : (type === 'Button' ? 'Button' : ''),
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      fontFamily: 'Arial',
      fontSize: 12,
      eventMethodName: '',
    };

    components.push(component);
    renderComponent(component);
    selectComponent(component.id);
    notifyStateChange();
  });

  // ========== RENDER COMPONENT ON CANVAS ==========
  function renderComponent(comp) {
    let el = document.getElementById(comp.id);
    if (!el) {
      el = document.createElement('div');
      el.id = comp.id;
      el.className = 'canvas-component';
      el.addEventListener('mousedown', function (e) {
        if (e.target === el || el.contains(e.target)) {
          selectComponent(comp.id);
          startDragOnCanvas(e, comp.id);
        }
      });
      canvas.appendChild(el);
    }

    el.style.left = comp.x + 'px';
    el.style.top = comp.y + 'px';
    el.style.width = comp.width + 'px';
    el.style.height = comp.height + 'px';
    el.style.backgroundColor = comp.backgroundColor;
    el.style.color = comp.textColor;
    el.style.fontFamily = comp.fontFamily;
    el.style.fontSize = comp.fontSize + 'px';
    el.dataset.type = comp.type;

    var displayText = comp.text || comp.variableName;
    var extraClass = '';
    switch (comp.type) {
      case 'Button':
        extraClass = 'comp-button';
        break;
      case 'Label':
        extraClass = 'comp-label';
        break;
      case 'TextField':
        extraClass = 'comp-textfield';
        displayText = comp.text || comp.variableName;
        break;
      case 'PasswordField':
        extraClass = 'comp-passwordfield';
        displayText = '\u2022\u2022\u2022\u2022\u2022\u2022';
        break;
      case 'TextArea':
        extraClass = 'comp-textarea';
        break;
    }
    el.className = 'canvas-component ' + extraClass;
    if (comp.id === selectedComponentId) {
      el.classList.add('selected');
    }
    el.textContent = displayText;
  }

  // ========== DRAG ON CANVAS (reposition) ==========
  var dragState = null;

  function startDragOnCanvas(e, compId) {
    var comp = components.find(function (c) { return c.id === compId; });
    if (!comp) return;

    dragState = {
      compId: compId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startCompX: comp.x,
      startCompY: comp.y,
    };

    e.preventDefault();
  }

  document.addEventListener('mousemove', function (e) {
    if (!dragState) return;

    var dx = e.clientX - dragState.startMouseX;
    var dy = e.clientY - dragState.startMouseY;
    var comp = components.find(function (c) { return c.id === dragState.compId; });
    if (!comp) return;

    comp.x = Math.max(0, Math.round(dragState.startCompX + dx));
    comp.y = Math.max(0, Math.round(dragState.startCompY + dy));

    renderComponent(comp);
    if (selectedComponentId === comp.id) {
      renderProperties();
    }
  });

  document.addEventListener('mouseup', function () {
    if (dragState) {
      notifyStateChange();
      dragState = null;
    }
  });

  // ========== SELECTION ==========
  function selectComponent(compId) {
    selectedComponentId = compId;
    document.querySelectorAll('.canvas-component').forEach(function (el) {
      el.classList.remove('selected');
    });
    var el = document.getElementById(compId);
    if (el) {
      el.classList.add('selected');
    }
    renderProperties();
  }

  canvas.addEventListener('click', function (e) {
    if (e.target === canvas) {
      selectedComponentId = null;
      document.querySelectorAll('.canvas-component').forEach(function (el) {
        el.classList.remove('selected');
      });
      renderProperties();
    }
  });

  // ========== PROPERTIES PANEL ==========
  function renderProperties() {
    if (selectedComponentId) {
      var comp = components.find(function (c) { return c.id === selectedComponentId; });
      if (!comp) {
        renderFrameProperties();
        return;
      }
      renderComponentProperties(comp);
    } else {
      renderFrameProperties();
    }
  }

  function renderFrameProperties() {
    var className = canvas.dataset.className || 'MainWindow';
    propertiesContent.innerHTML =
      '<div class="properties-section">' +
        '<h4>Window: ' + className + '</h4>' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Width</label>' +
        '<input type="number" id="prop-frame-width" value="' + frameWidth + '" min="100" max="4000">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Height</label>' +
        '<input type="number" id="prop-frame-height" value="' + frameHeight + '" min="100" max="4000">' +
      '</div>';

    document.getElementById('prop-frame-width').addEventListener('input', function (e) {
      frameWidth = parseInt(e.target.value) || 800;
      canvas.style.width = frameWidth + 'px';
      notifyStateChange();
    });

    document.getElementById('prop-frame-height').addEventListener('input', function (e) {
      frameHeight = parseInt(e.target.value) || 600;
      canvas.style.height = frameHeight + 'px';
      notifyStateChange();
    });
  }

  function getEventLabel(type) {
    switch (type) {
      case 'Button': return 'onClick Method Name';
      case 'TextField': return 'onSubmit Method Name';
      case 'PasswordField': return 'onSubmit Method Name';
      case 'TextArea': return 'onChange Method Name';
      default: return '';
    }
  }

  function renderComponentProperties(comp) {
    var eventLabel = getEventLabel(comp.type);
    var eventHtml = '';
    if (eventLabel) {
      eventHtml =
        '<div class="property-group">' +
          '<label>' + eventLabel + '</label>' +
          '<input type="text" id="prop-event-method" value="' + (comp.eventMethodName || '') + '" placeholder="e.g. onButtonClick">' +
        '</div>';
    }

    var textLabel = comp.type === 'TextField' || comp.type === 'PasswordField' ? 'Placeholder' : 'Text';

    propertiesContent.innerHTML =
      '<div class="properties-section">' +
        '<h4>' + comp.type + ': ' + comp.variableName + '</h4>' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Variable Name</label>' +
        '<input type="text" id="prop-varname" value="' + comp.variableName + '">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>X</label>' +
        '<input type="number" id="prop-x" value="' + comp.x + '" min="0">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Y</label>' +
        '<input type="number" id="prop-y" value="' + comp.y + '" min="0">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Width</label>' +
        '<input type="number" id="prop-width" value="' + comp.width + '" min="1">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Height</label>' +
        '<input type="number" id="prop-height" value="' + comp.height + '" min="1">' +
      '</div>' +
      '<div class="properties-section"><h4>Appearance</h4></div>' +
      '<div class="property-group">' +
        '<label>' + textLabel + '</label>' +
        '<input type="text" id="prop-text" value="' + (comp.text || '') + '">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Background Color</label>' +
        '<input type="color" id="prop-bgcolor" value="' + (comp.backgroundColor || '#FFFFFF') + '">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Text Color</label>' +
        '<input type="color" id="prop-textcolor" value="' + (comp.textColor || '#000000') + '">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Font Family</label>' +
        '<input type="text" id="prop-fontfamily" value="' + (comp.fontFamily || 'Arial') + '">' +
      '</div>' +
      '<div class="property-group">' +
        '<label>Font Size</label>' +
        '<input type="number" id="prop-fontsize" value="' + (comp.fontSize || 12) + '" min="1" max="200">' +
      '</div>' +
      eventHtml;

    // Wire up ALL event listeners

    document.getElementById('prop-varname').addEventListener('input', function (e) {
      comp.variableName = e.target.value || comp.variableName;
      renderComponent(comp);
      notifyStateChange();
    });

    document.getElementById('prop-x').addEventListener('input', function (e) {
      comp.x = parseInt(e.target.value) || 0;
      renderComponent(comp);
      notifyStateChange();
    });

    document.getElementById('prop-y').addEventListener('input', function (e) {
      comp.y = parseInt(e.target.value) || 0;
      renderComponent(comp);
      notifyStateChange();
    });

    document.getElementById('prop-width').addEventListener('input', function (e) {
      comp.width = parseInt(e.target.value) || 1;
      renderComponent(comp);
      notifyStateChange();
    });

    document.getElementById('prop-height').addEventListener('input', function (e) {
      comp.height = parseInt(e.target.value) || 1;
      renderComponent(comp);
      notifyStateChange();
    });

    // Text/placeholder
    document.getElementById('prop-text').addEventListener('input', function (e) {
      comp.text = e.target.value;
      renderComponent(comp);
      notifyStateChange();
    });

    // Background color
    document.getElementById('prop-bgcolor').addEventListener('input', function (e) {
      comp.backgroundColor = e.target.value;
      renderComponent(comp);
      notifyStateChange();
    });

    // Text color
    document.getElementById('prop-textcolor').addEventListener('input', function (e) {
      comp.textColor = e.target.value;
      renderComponent(comp);
      notifyStateChange();
    });

    // Font family
    document.getElementById('prop-fontfamily').addEventListener('input', function (e) {
      comp.fontFamily = e.target.value || 'Arial';
      renderComponent(comp);
      notifyStateChange();
    });

    // Font size
    document.getElementById('prop-fontsize').addEventListener('input', function (e) {
      comp.fontSize = parseInt(e.target.value) || 12;
      renderComponent(comp);
      notifyStateChange();
    });

    // Event method name
    var eventMethodEl = document.getElementById('prop-event-method');
    if (eventMethodEl) {
      eventMethodEl.addEventListener('input', function (e) {
        comp.eventMethodName = e.target.value;
        notifyStateChange();
      });
    }
  }

  // ========== STATE SYNC ==========
  function notifyStateChange() {
    vscode.postMessage({
      type: 'stateChanged',
      state: {
        className: canvas.dataset.className || 'MainWindow',
        frameWidth: frameWidth,
        frameHeight: frameHeight,
        components: components,
      },
    });
  }

  window.addEventListener('message', function (event) {
    var message = event.data;
    switch (message.type) {
      case 'loadState':
        loadState(message.state);
        break;
    }
  });

  function loadState(state) {
    if (!state) return;
    components = state.components || [];
    frameWidth = state.frameWidth || 800;
    frameHeight = state.frameHeight || 600;

    canvas.style.width = frameWidth + 'px';
    canvas.style.height = frameHeight + 'px';
    canvas.dataset.className = state.className || 'MainWindow';

    counters = { Button: 0, Label: 0, TextField: 0, PasswordField: 0, TextArea: 0 };
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      var match = comp.variableName.match(/(\d+)$/);
      if (match) {
        var num = parseInt(match[1]);
        if (num > (counters[comp.type] || 0)) {
          counters[comp.type] = num;
        }
      }
    }

    canvas.innerHTML = '';
    for (var j = 0; j < components.length; j++) {
      renderComponent(components[j]);
    }
    selectedComponentId = null;
    renderProperties();
  }

  // Initial render
  renderProperties();
})();
