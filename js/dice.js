import { state } from './state.js';

const PIPS = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]]
};

function renderDie(el, value) {
  const face = el.querySelector('.die-face');
  if (!face) return;
  const pips = PIPS[value] || [];
  face.innerHTML = '';
  pips.forEach(([x, y]) => {
    const pip = document.createElement('div');
    pip.style.cssText = `position:absolute;width:14%;height:14%;background:#0d0f1a;border-radius:50%;left:${x}%;top:${y}%;transform:translate(-50%,-50%)`;
    face.appendChild(pip);
  });
  face.style.position = 'relative';
}

export function displayDice(dice) {
  const d1 = document.getElementById('die1');
  const d2 = document.getElementById('die2');
  const totalEl = document.getElementById('dice-total');
  if (!d1 || !d2 || !totalEl) return;

  if (!dice) {
    renderDie(d1, 1); renderDie(d2, 1);
    totalEl.textContent = '';
    return;
  }

  const isNew = state.lastDiceId !== dice.id;
  if (isNew) {
    d1.classList.add('rolling');
    d2.classList.add('rolling');
    state.lastDiceId = dice.id;
    setTimeout(() => {
      renderDie(d1, dice.die1);
      renderDie(d2, dice.die2);
      d1.classList.remove('rolling');
      d2.classList.remove('rolling');
    }, 600);
  } else {
    renderDie(d1, dice.die1);
    renderDie(d2, dice.die2);
  }
  totalEl.textContent = `= ${dice.total}`;
  if (dice.isDouble) totalEl.textContent += ' (double!)';
}

export function resetDiceVisual() {
  const d1 = document.getElementById('die1');
  const d2 = document.getElementById('die2');
  if (d1) renderDie(d1, 1);
  if (d2) renderDie(d2, 1);
  const totalEl = document.getElementById('dice-total');
  if (totalEl) totalEl.textContent = '';
  state.lastDiceId = null;
}