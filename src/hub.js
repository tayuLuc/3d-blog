import '@fontsource/tektur/600.css';
import '@fontsource/tektur/700.css';
import '@fontsource/golos-text/400.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles/tokens.css';
import './styles/chrome.css';
import './styles/hub.css';
import { LEVELS } from './levels/registry.js';

const card = l => {
  const tag = l.status === 'ready' ? 'a' : 'div';
  const href = l.href ? ` href="${l.href}"` : '';
  const badge = l.status === 'ready' ? 'открыто' : 'скоро';
  return `
  <${tag} class="card ${l.status}"${href}>
    <span class="num">${l.id}</span>
    <div>
      <h2>${l.title}</h2>
      <span class="meta">${l.meta}</span>
      <p>${l.pitch}</p>
      <span class="badge ${l.status}">● ${badge}</span>
    </div>
  </${tag}>`;
};

document.getElementById('list').innerHTML = LEVELS.map(card).join('');
