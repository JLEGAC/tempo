import { duration, clock } from '../domain/time.mjs';
const NS = 'http://www.w3.org/2000/svg';
function node(tag, attributes = {}, text = '') {
  const element = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  element.textContent = text;
  return element;
}
function canvas(container, title, count, maximum, format, minimum = 0) {
  container.replaceChildren();
  const width = Math.max(900, count * 74 + 100), height = 280;
  const left = 62, bottom = 230, top = 24, right = width - 20;
  const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': title });
  svg.append(node('title', {}, title));
  const span = Math.max(1, maximum - minimum);
  const y = value => bottom - (value - minimum) / span * (bottom - top);
  for (let tick = 0; tick <= 4; tick++) {
    const value = minimum + span * tick / 4, position = y(value);
    svg.append(node('line', { x1: left, x2: right, y1: position, y2: position, class: 'chartGrid' }));
    svg.append(node('text', { x: left - 9, y: position + 4, 'text-anchor': 'end', class: 'chartLabel' }, format(Math.round(value))));
  }
  container.append(svg);
  return { svg, y, left, right, bottom, step: (right - left) / Math.max(count, 1) };
}
function tooltip(element, text) { element.append(node('title', {}, text)); }
export function bars(container, title, items, withTarget = false) {
  const maximum = Math.max(60, ...items.flatMap(item => [item.value ?? 0, item.target ?? 0]));
  const scale = Math.ceil(maximum / 60) * 60;
  const c = canvas(container, title, items.length, scale, duration);
  items.forEach((item, i) => {
    const x = c.left + (i + .5) * c.step;
    if (item.value !== null) {
      const bar = node('rect', {
        x: x - 13, y: c.y(item.value), width: 26,
        height: Math.max(1, c.bottom - c.y(item.value)), rx: 3,
        class: item.complete ? 'chartActual' : 'chartPartial', tabindex: 0,
      });
      tooltip(bar, `${item.label} : ${duration(item.value)}${item.complete ? '' : ' — incomplet, intervalles badgés uniquement'}`);
      c.svg.append(bar);
    }
    if (withTarget) {
      const target = node('rect', { x: x - 16, y: c.y(item.target), width: 32, height: c.bottom - c.y(item.target), rx: 2, class: 'chartTarget', tabindex: 0 });
      tooltip(target, `${item.label} — objectif : ${duration(item.target)}`);
      c.svg.append(target);
    }
    c.svg.append(node('text', { x, y: c.bottom + 22, 'text-anchor': 'middle', class: 'chartLabel' }, item.label));
    if (!item.complete) c.svg.append(node('text', { x, y: c.bottom + 39, 'text-anchor': 'middle', class: 'chartLabel' }, 'incomplète'));
  });
}
export function trend(container, title, items, timeOfDay) {
  const values = items.filter(item => item.value !== null).map(item => item.value);
  if (!values.length) {
    container.replaceChildren();
    const empty = document.createElement('p');
    empty.textContent = 'Aucun badgeage disponible pour cet indicateur sur ces 7 jours.';
    empty.className = 'muted';
    container.append(empty);
    return;
  }
  const minimum = timeOfDay ? Math.max(0, Math.floor((Math.min(...values) - 30) / 60) * 60) : 0;
  const maximum = Math.max(minimum + 60, Math.ceil((Math.max(...values) + 30) / 60) * 60);
  const format = timeOfDay ? clock : duration;
  const c = canvas(container, title, items.length, maximum, format, minimum);
  let previous = null;
  items.forEach((item, i) => {
    const x = c.left + (i + .5) * c.step;
    c.svg.append(node('text', { x, y: c.bottom + 22, 'text-anchor': 'middle', class: 'chartLabel' }, item.label));
    if (item.value === null) { previous = null; return; }
    const y = c.y(item.value);
    if (previous) c.svg.append(node('line', { x1: previous.x, y1: previous.y, x2: x, y2: y, class: 'chartTrend' }));
    const point = node('circle', { cx: x, cy: y, r: 5, class: 'chartPoint', tabindex: 0 });
    tooltip(point, `${item.label} : ${format(item.value)} ${item.complete === false ? "— journée incomplète" : ""}`);
    c.svg.append(point);
    previous = { x, y };
  });
}
