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
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Free Write
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
          readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        placeholder={readOnly ? '' : 'Write freely in English...'}
      />
    </div>
  )
}
