import { Check } from "lucide-react";

/**
 * Renders package features with formatting:
 * - Lines starting with "-" or "•" → bullet item with ✓ checkmark
 * - Lines without prefix → bold section header with top spacing
 */
export function PackageFeaturesList({
  features,
  className = "",
}: {
  features: (string | unknown)[];
  className?: string;
}) {
  if (!features?.length) return null;

  return (
    <ul className={`space-y-2 ${className}`}>
      {features.map((f, idx) => {
        const text = String(f ?? "").trim();
        if (!text) return null;

        const isBullet = text.startsWith("- ") || text.startsWith("• ");
        const displayText = isBullet ? text.replace(/^[-•]\s*/, "") : text;

        if (isBullet) {
          return (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="text-foreground break-words whitespace-normal">{displayText}</span>
            </li>
          );
        }

        return (
          <li
            key={idx}
            className={`text-sm font-semibold text-foreground${idx > 0 ? " mt-4" : ""}`}
          >
            {displayText}
          </li>
        );
      })}
    </ul>
  );
}
