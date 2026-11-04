export function SectionTag({ num, label }: { num: string; label: string }) {
  return (
    <div className="ct-tagrow reveal-piece">
      <b className="ct-tag-cap">
        <i className="ct-tassel" aria-hidden="true" />
        {num}
      </b>
      <span className="ct-tag-text">{label}</span>
      <i className="ct-tag-line" aria-hidden="true" />
    </div>
  );
}
