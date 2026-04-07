/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import KeyPointsBlock from '../KeyPointsBlock'

describe('KeyPointsBlock', () => {
  it('should render with value', () => {
    render(
      <KeyPointsBlock
        value="Test key points"
        onChange={() => {}}
        readOnly={false}
      />
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test key points')).toBeInTheDocument()
  })

  it('should call onChange when text changes', () => {
    const mockOnChange = jest.fn()

    render(
      <KeyPointsBlock
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
      <KeyPointsBlock
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
      <KeyPointsBlock
        value="Test"
        onChange={() => {}}
        readOnly={true}
      />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea?.className).toContain('bg-gray-100')
  })
})
