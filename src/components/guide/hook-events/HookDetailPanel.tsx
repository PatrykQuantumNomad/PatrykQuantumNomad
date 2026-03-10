/**
 * Detail panel for hook event information.
 * Rendered below the React Flow canvas when an event node is clicked.
 * Shows handler types, payload fields, configuration example, and blocking info.
 */
import type { EventDetail } from '../../../lib/guides/interactive-data/hook-event-data';

interface HookDetailPanelProps {
  content: EventDetail;
  onClose: () => void;
}

export function HookDetailPanel({ content, onClose }: HookDetailPanelProps) {
  return (
    <div className="mt-3 p-4 rounded-lg border border-[var(--color-border,rgba(255,255,255,0.1))] bg-[var(--color-surface,#1a1a2e)]">
      {/* Title + Close */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-[var(--color-text-primary,#e0e0e0)] text-base">
          {content.title}
        </h4>
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary,#a0a0a0)] hover:text-[var(--color-text-primary,#e0e0e0)] text-xs px-2 py-1 rounded border border-[var(--color-border,rgba(255,255,255,0.1))] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label="Close detail panel"
        >
          Close
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--color-text-secondary,#a0a0a0)] mb-4 leading-relaxed">
        {content.description}
      </p>

      {/* Handler Types */}
      <div className="mb-4">
        <h5 className="text-xs font-semibold text-[var(--color-text-primary,#e0e0e0)] uppercase tracking-wide mb-2">
          Handler Types
        </h5>
        <div className="flex flex-wrap gap-2">
          {content.handlerTypes.map((ht) => (
            <span
              key={ht}
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                color: 'var(--color-text-primary, #e0e0e0)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
              }}
            >
              {ht}
            </span>
          ))}
        </div>
      </div>

      {/* Event-Specific Fields */}
      {content.fields.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-semibold text-[var(--color-text-primary,#e0e0e0)] uppercase tracking-wide mb-2">
            Event Fields
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {content.fields.map((field) => (
              <div
                key={field.key}
                className="p-2 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <dt className="text-xs font-mono text-[var(--color-accent,#c44b20)]">
                  {field.key}
                </dt>
                <dd className="text-xs text-[var(--color-text-secondary,#a0a0a0)] mt-0.5">
                  {field.value}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Example */}
      <div className="mb-4">
        <h5 className="text-xs font-semibold text-[var(--color-text-primary,#e0e0e0)] uppercase tracking-wide mb-2">
          Configuration Example
        </h5>
        <pre
          className="p-3 rounded text-xs overflow-x-auto"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
          }}
        >
          <code className="text-[var(--color-text-secondary,#a0a0a0)] font-mono">
            {content.configExample}
          </code>
        </pre>
      </div>

      {/* Blocking Info (PreToolUse only) */}
      {content.blockingInfo && (
        <div
          className="p-3 rounded"
          style={{
            backgroundColor: 'rgba(196, 75, 32, 0.08)',
            border: '1px solid var(--color-accent, #c44b20)',
          }}
        >
          <h5
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: 'var(--color-accent, #c44b20)' }}
          >
            Blocking Behavior
          </h5>
          <p className="text-xs text-[var(--color-text-secondary,#a0a0a0)] leading-relaxed">
            {content.blockingInfo}
          </p>
        </div>
      )}
    </div>
  );
}
