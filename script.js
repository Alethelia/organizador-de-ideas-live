const ideaInput = document.getElementById('ideaInput');
const promptInput = document.getElementById('promptInput');
const resultDiv = document.getElementById('result');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const floatingIdea = document.getElementById('floatingIdea');
const minimizeBtn = document.getElementById('minimizeBtn');
const minimizedBubble = document.getElementById('minimizedBubble');
const flowContainer = document.getElementById('flowContainer');

let inactivityTimeout;
let drag = false;
let selectionTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  if (floatingIdea.style.display !== 'none') {
    inactivityTimeout = setTimeout(() => {
      minimizeFloating();
    }, 8000);
  }
}

function minimizeFloating() {
  const { left, top } = floatingIdea.getBoundingClientRect();
  minimizedBubble.style.left = `${left}px`;
  minimizedBubble.style.top = `${top}px`;
  floatingIdea.style.display = 'none';
  minimizedBubble.style.display = 'flex';
}

function expandFloating() {
  const { left, top } = minimizedBubble.getBoundingClientRect();
  floatingIdea.style.left = `${left}px`;
  floatingIdea.style.top = `${top}px`;
  minimizedBubble.style.display = 'none';
  floatingIdea.style.display = 'flex';
  resetInactivityTimer();
}

function makeDraggable(target, onClick) {
  let dragStart = false;

  target.addEventListener('mousedown', (e) => {
    dragStart = false;
    let offsetX = e.clientX - target.offsetLeft;
    let offsetY = e.clientY - target.offsetTop;

    function mouseMoveHandler(e) {
      target.style.left = `${e.clientX - offsetX}px`;
      target.style.top = `${e.clientY - offsetY}px`;
      dragStart = true;
    }

    function mouseUpHandler() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      if (!dragStart && onClick) onClick();
    }

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  });
}

makeDraggable(floatingIdea);
makeDraggable(minimizedBubble, expandFloating);

minimizeBtn.addEventListener('click', minimizeFloating);

function renderOrganized(content) {
  resultDiv.innerHTML = content || 'Aquí se organizarán tus ideas...';
  resultDiv.style.opacity = 0;
  setTimeout(() => {
    resultDiv.style.opacity = 1;
  }, 100);
}

function loadApiKey() {
  const savedKey = localStorage.getItem('openai_api_key');
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }
}

saveApiKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem('openai_api_key', key);
    alert('API Key guardada correctamente.');
  } else {
    alert('Introduce una API Key válida.');
  }
});

resultDiv.addEventListener('dblclick', () => {
  resultDiv.style.userSelect = 'text';
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(() => {
    resultDiv.style.userSelect = 'none';
  }, 10000);
});

async function organizeIdea() {
  const idea = ideaInput.value.trim();
  const prompt = promptInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!idea || !prompt || !apiKey) {
    alert('Escribe tu idea, instrucciones y pega tu API Key');
    return;
  }

  const fullPrompt = `Organiza de forma detallada y clara el siguiente contenido respetando toda la información, sin omitir nada. Devuelve el resultado en formato JSON como este ejemplo:
{
  "nodes": [
    { "id": 1, "title": "Preparar ingredientes", "content": "Reunir pan, queso, mayonesa.", "next": [2] },
    { "id": 2, "title": "Armar el sandwich", "content": "Poner queso y mayonesa entre dos panes.", "next": [3] },
    { "id": 3, "title": "Tostar", "content": "Llevar al sartén o sandwichera hasta dorar.", "next": [] }
  ]
}

Contenido a organizar:
${idea}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 1500
      })
    });

    const data = await response.json();
    console.log('Respuesta completa:', data);

    const content = data.choices?.[0]?.message?.content || '❌ Error al procesar';
    console.log('Contenido recibido:', content);

    try {
      const json = JSON.parse(content);
      console.log('JSON parseado correctamente:', json);
      renderFlow(json);
      resultDiv.innerHTML = '';
    } catch (e) {
      console.warn('No es un JSON válido, mostrando como texto.');
      renderOrganized(content);
    }
    
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}


sendBtn.addEventListener('click', organizeIdea);
clearBtn.addEventListener('click', () => {
  localStorage.removeItem('organizedContent');
  renderOrganized('');
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    organizeIdea();
  }
});

document.addEventListener('mousemove', resetInactivityTimer);

renderOrganized(localStorage.getItem('organizedContent'));
loadApiKey();
resetInactivityTimer();
function renderFlow(json) {
  flowContainer.innerHTML = ''; // Limpia antes de pintar

  if (!json.nodes || !Array.isArray(json.nodes)) {
    flowContainer.innerHTML = '<p>❌ No se pudo interpretar el flujo.</p>';
    return;
  }

  json.nodes.forEach(node => {
    const card = document.createElement('div');
    card.className = 'flow-card';

    const title = document.createElement('h3');
    title.textContent = node.title;

    const content = document.createElement('p');
    content.textContent = node.content;

    const next = document.createElement('div');
    next.className = 'next-steps';
    if (node.next && node.next.length > 0) {
      next.textContent = 'Siguiente: ' + node.next.join(', ');
    }

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(next);

    flowContainer.appendChild(card);
  });
}
function renderFlow(json) {
  flowContainer.innerHTML = ''; // Limpia antes de pintar

  if (!json.nodes || !Array.isArray(json.nodes)) {
    flowContainer.innerHTML = '<p>❌ No se pudo interpretar el flujo.</p>';
    return;
  }

  json.nodes.forEach(node => {
    const card = document.createElement('div');
    card.className = 'flow-card';

    const title = document.createElement('h3');
    title.textContent = node.title;

    const content = document.createElement('p');
    content.textContent = node.content;

    const next = document.createElement('div');
    next.className = 'next-steps';
    if (node.next && node.next.length > 0) {
      next.textContent = 'Siguiente: ' + node.next.join(', ');
    }

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(next);

    // Bloqueo/desbloqueo de selección
    let timer;
    card.addEventListener('dblclick', () => {
      card.style.userSelect = 'text';
      clearTimeout(timer);
      timer = setTimeout(() => {
        card.style.userSelect = 'none';
      }, 10000); // 10 segundos
    });

    flowContainer.appendChild(card);
  });
}
