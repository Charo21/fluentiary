import { render, screen, fireEvent } from '@testing-library/react'
import FreeWriteBlock from '../FreeWriteBlock'

describe('FreeWriteBlock', () => {
  it('should render with value', () => {
    render(
      <FreeWriteBlock
        value="Test free write"
        onChange={() => {}}
        readOnly={false}
      />
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test free write')).toBeInTheDocument()
  })

  it('should call onChange when text changes', () => {
    const mockOnChange = jest.fn()

    render(
      <FreeWriteBlock
        value=""
        onChange={mockOnChange}
        readOnly={false}
      />
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New text' } })

    expect(mockOnChange).toHaveBeenCalledWith('New text')
  })

  it('should be read-only when readOnly is true', () => {
    render(
      <FreeWriteBlock
        value="Test"
        onChange={() => {}}
        readOnly={true}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('readOnly')
  })

  it('should have gray background when read-only', () => {
    const { container } = render(
      <FreeWriteBlock
        value="Test"
        onChange={() => {}}
        readOnly={true}
      />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea?.className).toContain('bg-gray-100')
  })
})
