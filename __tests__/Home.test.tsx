import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import '@testing-library/jest-dom'

// 👇 THIS IS THE NEW PART (The Fake Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('Home Page', () => {
  it('renders the FinBank heading', () => {
    render(<Home />)
    
    // Check if the main heading exists
    // The "i" makes it case-insensitive
    const heading = screen.getByText(/Potatoes/i)
    
    expect(heading).toBeInTheDocument()
  })
})