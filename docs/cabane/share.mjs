export function setupShare(getData = () => ({ title: document.title, url: location.href })) {
  const button = document.querySelector('#share');
  const status = document.querySelector('#share-status');
  const hasNativeShare = typeof navigator.share === 'function';
  button.textContent = hasNativeShare ? 'Partager' : 'Copier le lien';

  async function copyLink(data) {
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
  }

  function offerCopy() {
    // Some mobile browsers expose share() but never open a working share sheet.
    // Keep a separate copy action usable even while the native promise is pending.
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'quiet';
    copy.textContent = 'Copier le lien';
    copy.addEventListener('click', () => copyLink(getData()));
    status.replaceChildren(copy);
    status.hidden = false;
  }

  button.addEventListener('click', async () => {
    const data = getData();
    status.hidden = true;
    button.disabled = true;
    try {
      if (hasNativeShare) {
        try {
          if (typeof navigator.canShare !== 'function' || navigator.canShare(data)) {
            offerCopy();
            await navigator.share(data);
            return;
          }
        } catch (error) {
          // Cancelling should not write to the clipboard, but keep copying available.
          if (error.name === 'AbortError') return;
        }
      }
      // A rejected/unsupported native share falls back in the same click.
      await copyLink(data);
    } finally {
      button.disabled = false;
    }
  });
}

// Reading initializes sharing with its selected-text data provider.
if (!document.querySelector('#text-choice')) setupShare();
