interface KeyPointsBlockProps {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
}

export default function KeyPointsBlock({
  value,
  onChange,
  readOnly,
}: KeyPointsBlockProps) {
  return (
    <div className="fl-block">
      <div className="fl-block__head">
        <label htmlFor="key-points" className="fl-label">
          Key Points
        </label>
      </div>
      <textarea
        id="key-points"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`fl-field fl-field--sm ${readOnly ? 'fl-field--locked' : ''}`}
        placeholder={readOnly ? '' : 'Enter key points for today...'}
      />
    </div>
  )
}
