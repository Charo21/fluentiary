interface FreeWriteBlockProps {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
}

export default function FreeWriteBlock({
  value,
  onChange,
  readOnly,
}: FreeWriteBlockProps) {
  return (
    <div className="fl-block">
      <div className="fl-block__head">
        <label htmlFor="free-write" className="fl-label">
          Free Write
        </label>
      </div>
      <textarea
        id="free-write"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`fl-field fl-field--lg ${readOnly ? 'fl-field--locked' : ''}`}
        placeholder={readOnly ? '' : 'Write freely in English...'}
      />
    </div>
  )
}
