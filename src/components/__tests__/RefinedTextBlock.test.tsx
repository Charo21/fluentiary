import { render, screen, fireEvent } from '@testing-library/react'
import RefinedTextBlock from '../RefinedTextBlock'

describe('RefinedTextBlock', () => {
  it('should render with value', () => {
    render(
      <RefinedTextBlock
        value="Test refined text"
        onChange={() => {}}
        onRefine={() => {}}
        readOnly={false}
        loading={false}
      />
    )

    expect(screen.getByLabelText('Refined Text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test refined text')).toBeInTheDocument()
  })

  it('should show Refine button when not read-only', () => {
    render(
      <RefinedTextBlock
        value=""
        onChange={() => {}}
        onRefine={() => {}}
        readOnly={false}
        loading={false}
      />
    )

    expect(screen.getByRole('button', { name: /refine/i })).toBeInTheDocument()
  })

  it('should not show Refine button when read-only', () => {
    render(
      <RefinedTextBlock
        value=""
        onChange={() => {}}
        onRefine={() => {}}
        readOnly={true}
        loading={false}
      />
    )

    expect(screen.queryByRole('button', { name: /refine/i })).not.toBeInTheDocument()
  })

  it('should call onRefine when button is clicked', () => {
    const mockOnRefine = jest.fn()

    render(
      <RefinedTextBlock
        value=""
        onChange={() => {}}
        onRefine={mockOnRefine}
        readOnly={false}
        loading={false}
      />
    )

    const button = screen.getByRole('button', { name: /refine/i })
    fireEvent.click(button)

    expect(mockOnRefine).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(
      <RefinedTextBlock
        value=""
        onChange={() => {}}
        onRefine={() => {}}
        readOnly={false}
        loading={true}
      />
    )

    expect(screen.getByText(/refining/i)).toBeInTheDocument()
  })

  it('should be read-only when readOnly is true', () => {
    render(
      <RefinedTextBlock
        value="Test"
        onChange={() => {}}
        onRefine={() => {}}
        readOnly={true}
        loading={false}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('readOnly')
  })
})
