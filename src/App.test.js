import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app navigation and title', () => {
  render(<App />);
  expect(screen.getByText('Pillole Poetiche')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Autori' })).toBeInTheDocument();
});
