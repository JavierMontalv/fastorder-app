function resolveValueTone(estadoColor = '') {
  const tone = String(estadoColor).toLowerCase();

  if (tone.includes('red')) return 'metric-card__value--danger';
  if (tone.includes('yellow')) return 'metric-card__value--warning';
  if (tone.includes('green')) return 'metric-card__value--success';
  if (tone.includes('blue')) return 'metric-card__value--info';

  return '';
}

export default function MetricCard({
  titulo,
  valor,
  descripcion,
  estado,
  estadoColor = ''
}) {
  const valueToneClass = resolveValueTone(estadoColor);

  return (
    <article className="metric-card">
      <p className="metric-card__title">{titulo}</p>

      <p className={`metric-card__value ${valueToneClass}`.trim()}>
        {valor}
      </p>

      {descripcion && <p className="metric-card__description">{descripcion}</p>}

      {estado && (
        <p className="metric-card__state">
          Estado:&nbsp;
          <span>{estado}</span>
        </p>
      )}
    </article>
  );
}
