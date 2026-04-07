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
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Key Points
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
          readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        placeholder={readOnly ? '' : 'Enter key points for today...'}
      />
    </div>
  )
}
