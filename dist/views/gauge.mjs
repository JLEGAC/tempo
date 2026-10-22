import { currentWorked } from '../domain/current.mjs';
import { weekDate, duration } from '../domain/time.mjs';
export function renderGauge(container, weeks, defaultTarget) {
  const week = weeks.find(w => w.start === weekDate());
  const target = week?.target ?? defaultTarget, actual = currentWorked(week);
  const ratio = Math.min(1, actual / target), angle = -90 + ratio * 180;
  // Les valeurs interpolées sont des nombres ou des chaînes calculées localement.
  container.innerHTML = `<div class="liveGauge"><svg viewBox="0 0 240 145" role="img" aria-label="Objectif réalisé à ${Math.round(ratio * 100)} pour cent">
    <path d="M30 120 A90 90 0 0 1 210 120" class="gaugeTrack" pathLength="100"/>
    <path d="M30 120 A90 90 0 0 1 210 120" class="gaugeFill" pathLength="100" stroke-dasharray="${ratio * 100} 100"/>
    <g transform="rotate(${angle} 120 120)"><path d="M114 120 L120 38 L126 120 Z" class="gaugeNeedle"/></g>
    <circle cx="120" cy="120" r="9" class="gaugeNeedle"/>
    </svg><div><h2>Reste à travailler cette semaine</h2><strong>${actual > target ? '+' + duration(actual - target) : duration(target - actual)}</strong>
    <p>${actual > target ? 'au-delà de l’objectif' : 'pour atteindre l’objectif hebdomadaire'}</p>
    <small>${duration(actual)} réelles / ${duration(target)} · semaine en cours</small>
    <p class="muted">${week ? 'Calcul jusqu’à maintenant avec vos derniers badgeages importés. Aucun horaire simulé.' : 'Collez les badgeages de la semaine en cours pour alimenter la jauge.'}</p></div></div>`;
}
