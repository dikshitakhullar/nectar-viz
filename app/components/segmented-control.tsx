"use client";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  ariaLabel: string;
}

/**
 * Segmented radio-style control for short option sets (e.g. Auto/On/Off).
 *
 * Note: globals.css enforces `min-height: 44px` on every <button>, so each
 * segment ends up 44px tall regardless of the `h-*` class. The container
 * sits just above 44px, padded by p-0.5.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex bg-surface border border-neutral-800 rounded-md p-0.5 w-full"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 text-[11px] tracking-wider uppercase rounded transition-colors duration-150 ${
              isActive
                ? "bg-gold text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
