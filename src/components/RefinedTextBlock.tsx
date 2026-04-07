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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="refined-text" className="block text-sm font-medium text-gray-700">
          Refined Text
        </label>
        {!readOnly && (
          <button
            onClick={onRefine}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Refining...' : 'Refine'}
          </button>
        )}
      </div>
      <textarea
        id="refined-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
          readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        placeholder={readOnly ? '' : 'Refined text will appear here...'}
      />
    </div>
  )
}
