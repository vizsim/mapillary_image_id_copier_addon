import { SPRITE_IMAGE_URL } from './core.js';

/**
 * Erzeugt ein Element. Texte werden als Textknoten eingefügt (kein innerHTML).
 *
 * @param {string} tag
 * @param {Object} props - "class", "on<event>" (Listener), DOM-Eigenschaften oder Attribute
 * @param {...(Node|string|null|false)} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') {
      node.className = value;
    } else if (key.startsWith('on')) {
      node.addEventListener(key.slice(2), value);
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  }
  node.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

/**
 * Icon eines Mapillary-Zeichens als Ausschnitt aus dem Sprite-Sheet
 *
 * @param {string} name - Mapillary-Name
 * @param {Object<string, {x: number, y: number, width: number, height: number}>} sprites - Sprite-JSON (oder {})
 * @returns {HTMLElement}
 */
export function signIcon(name, sprites) {
  const icon = el('span', { class: 'sign-icon', title: name });
  const sprite = sprites[name];
  if (sprite) {
    icon.style.backgroundImage = `url("${SPRITE_IMAGE_URL}")`;
    icon.style.backgroundPosition = `-${sprite.x}px -${sprite.y}px`;
    icon.style.width = `${sprite.width}px`;
    icon.style.height = `${sprite.height}px`;
  }
  return icon;
}
