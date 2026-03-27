import { useEffect, useState, type ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Mobile bottom sheet wrapper with slide-up animation.
 * Renders a backdrop overlay and a sheet container that slides up from
 * the bottom of the viewport. Used for DetailPanel on screens < 768px.
 */
export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    // Trigger slide-up after mount via requestAnimationFrame
    const raf = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet container */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-2xl transition-transform duration-300 ease-out"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
