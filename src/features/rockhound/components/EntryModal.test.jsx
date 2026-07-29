import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EntryModal, { Section, Row } from './EntryModal.jsx';

function renderModal(overrides = {}) {
  const props = { titleId: 'test-title', onClose: vi.fn(), ...overrides };
  render(
    <EntryModal {...props}>
      <h3 id="test-title">A Title</h3>
      <Section title="Details">
        <Row label="Hardness">9</Row>
      </Section>
      <button type="button">inner action</button>
    </EntryModal>
  );
  return props;
}

describe('EntryModal', () => {
  it('renders a labelled modal dialog', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('test-title');
  });

  it('renders its children, including Section and Row content', () => {
    renderModal();
    screen.getByText('Details');
    screen.getByText('Hardness');
    screen.getByText('9');
  });

  it('closes on the close button, Escape, and the backdrop', () => {
    const a = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(a.onClose).toHaveBeenCalled();
    cleanup();

    const b = renderModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(b.onClose).toHaveBeenCalled();
    cleanup();

    const c = renderModal();
    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(c.onClose).toHaveBeenCalled();
  });

  it('does not close when the dialog body is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves focus to the close button on open', () => {
    renderModal();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close entry');
  });

  it('restores focus to the opener when it closes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { unmount } = render(
      <EntryModal titleId="t" onClose={() => {}}>
        <h3 id="t">Entry</h3>
      </EntryModal>
    );
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('keeps Tab focus inside the dialog by wrapping to the exact target element', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    const closeButton = screen.getByRole('button', { name: /close entry/i });
    const inner = screen.getByRole('button', { name: /inner action/i });

    // Tab from the last focusable element wraps to the first (close button).
    inner.focus();
    expect(document.activeElement).toBe(inner);
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab from the first focusable element wraps to the last (inner action).
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(inner);

    // Tab fired while focus sits outside the dialog is pulled back inside,
    // landing on the first focusable element.
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
    outside.remove();
  });

  it('does not re-steal focus when the parent re-renders with a new onClose identity', () => {
    const onCloseA = vi.fn();
    const { rerender } = render(
      <EntryModal titleId="test-title" onClose={onCloseA}>
        <h3 id="test-title">A Title</h3>
        <Section title="Details">
          <Row label="Hardness">9</Row>
        </Section>
        <button type="button">inner action</button>
      </EntryModal>
    );

    const inner = screen.getByRole('button', { name: /inner action/i });
    inner.focus();
    expect(document.activeElement).toBe(inner);

    // A parent re-render with a brand-new onClose (an inline arrow, as real
    // callers pass) must not tear down/re-run the mount effect and yank
    // focus back onto the close button.
    const onCloseB = vi.fn();
    rerender(
      <EntryModal titleId="test-title" onClose={onCloseB}>
        <h3 id="test-title">A Title</h3>
        <Section title="Details">
          <Row label="Hardness">9</Row>
        </Section>
        <button type="button">inner action</button>
      </EntryModal>
    );
    expect(document.activeElement).toBe(inner);

    // Escape must still invoke the latest onClose, not the one captured at mount.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseA).not.toHaveBeenCalled();
    expect(onCloseB).toHaveBeenCalled();
  });
});
