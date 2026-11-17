interface RefinedTextBlockProps {
  value: string
  onChange: (value: string) => void
  onRefine: () => void
  readOnly: boolean
  loading: boolean
}

export default function RefinedTextBlock({
  value,
  onChange,
  onRefine,
  readOnly,
  loading,
}: RefinedTextBlockProps) {
  return (
    <div className="fl-block">
      <div className="fl-block__head">
        <label htmlFor="refined-text" className="fl-label fl-label--gold">
          Refined Text
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={onRefine}
            disabled={loading}
            className="fl-btn fl-btn--gold"
          >
            {loading ? 'Refining…' : 'Refine'}
          </button>
        )}
      </div>
      <textarea
        id="refined-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`fl-field fl-field--lg fl-field--serif ${readOnly ? 'fl-field--locked' : ''}`}
        placeholder={readOnly ? '' : 'Refined text will appear here...'}
      />
    </div>
  )
}
