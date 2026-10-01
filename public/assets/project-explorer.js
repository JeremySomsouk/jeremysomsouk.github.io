// Progressive enhancement: every project remains readable without JavaScript.
const root = document.querySelector('[data-project-explorer]');
if (root) {
  const tree = root.querySelector('.project-tree');
  const panel = root.querySelector('.project-grid');
  const cards = [...panel.querySelectorAll('[data-project]')];
  const buttons = [...tree.querySelectorAll('[data-topic]')];
  const topics = { cabane: ['games'], guessr: ['games'], melimo: ['tools'], prctrl: ['tools'], ripple: ['games', 'experiments'], nuance: ['reflection', 'experiments'] };
  const matches = (card, topic) => topic === 'all' || (topics[card.dataset.project] ?? ['experiments']).includes(topic);
  for (const button of buttons) {
    button.querySelector('.topic-count').textContent = cards.filter(card => matches(card, button.dataset.topic)).length;
    button.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      for (const card of cards) card.hidden = !matches(card, button.dataset.topic);
      panel.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      const count = cards.filter(card => !card.hidden).length;
      root.querySelector('[data-project-status]').textContent = `${count} projects · ${button.dataset.topicLabel}`;
    });
  }
  root.classList.add('is-enhanced');
  tree.hidden = false;
  root.querySelector('[data-project-status]').textContent = `${cards.length} projects · All projects`;
}
