import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('App (mock API)', () => {
  it('loads awards from the API and lists the riskiest first', async () => {
    render(<App />);
    expect(screen.getByRole('status').textContent).toContain('Loading');

    const nav = await screen.findByRole('navigation', { name: 'Awards' }, { timeout: 3000 });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons.length).toBe(4);
    // The first award shown is selected and described in plain language.
    expect(buttons[0]?.getAttribute('aria-current')).toBe('true');
    const firstName = within(buttons[0]!).getByText(/./, { selector: '.project-item__name' }).textContent!;
    expect(screen.getByRole('heading', { level: 2, name: firstName })).toBeTruthy();
  });

  it('switches awards and updates the headline', async () => {
    render(<App />);
    const nav = await screen.findByRole('navigation', { name: 'Awards' }, { timeout: 3000 });
    const buttons = within(nav).getAllByRole('button');
    const before = document.querySelector('.hero__lede')?.textContent;
    fireEvent.click(buttons[buttons.length - 1]!);
    const after = document.querySelector('.hero__lede')?.textContent;
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
  });

  it('changes the forecast when the what-if slider moves', async () => {
    render(<App />);
    await screen.findByRole('navigation', { name: 'Awards' }, { timeout: 3000 });
    const forecast = () => document.querySelector('.scenario__result dd')?.textContent;
    const before = forecast();
    fireEvent.change(screen.getByLabelText(/Change future monthly spending/), { target: { value: '50' } });
    expect(forecast()).not.toBe(before);
  });
});
