export function setupShare(getData = () => ({ title: document.title, url: location.href })) {
  const button = document.querySelector('#share');
  const status = document.querySelector('#share-status');
  let copyOnly = typeof navigator.share !== 'function';
  button.textContent = copyOnly ? 'Copier le lien' : 'Partager';

  button.addEventListener('click', async () => {
    const data = getData();
    status.hidden = true;
    button.disabled = true;
    try {
      if (!copyOnly) {
        try {
          await navigator.share(data);
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
          copyOnly = true;
          button.textContent = 'Copier le lien';
          status.textContent = 'Le partage est indisponible. Appuie sur Copier le lien.';
          status.hidden = false;
          return;
        }
      }
      try {
        await navigator.clipboard.writeText(data.url);
        status.textContent = 'Lien copié !';
      } catch {
        status.replaceChildren(document.createTextNode('Copie ce lien : '));
        const input = document.createElement('input');
        input.type = 'text';
        input.readOnly = true;
        input.value = data.url;
        input.setAttribute('aria-label', 'Lien à copier');
        status.append(input);
        status.hidden = false;
        input.focus();
        input.select();
      }
      status.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
}

// Reading initializes sharing after installing its selected-text data provider.
if (!document.querySelector('#text-choice')) setupShare();
