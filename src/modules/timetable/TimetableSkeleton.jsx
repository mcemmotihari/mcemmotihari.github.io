export default function TimetableSkeleton() {
  return (
    <div className="page-body tt-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading timetable</span>
      <div className="sk-controls">
        <span className="sk-block sk-select" />
        <span className="sk-block sk-icon" />
      </div>
      <div className="sk-tabs">
        <span className="sk-block sk-tab" />
        <span className="sk-block sk-tab" />
        <span className="sk-block sk-tab" />
      </div>
      <div className="sk-mobile">
        <div className="sk-chips">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="sk-block sk-chip" />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="sk-block sk-card" />
        ))}
      </div>
      <div className="sk-desktop">
        <span className="sk-block sk-sheet" />
      </div>
    </div>
  );
}
