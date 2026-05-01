type Step = { label: string };

export function StepIndicator({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between">
      {steps.map((step, idx) => {
        const active = idx === current;
        const completed = idx < current;
        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition sm:h-10 sm:w-10 ${
                  active
                    ? "bg-gold text-canvas shadow-gold"
                    : completed
                    ? "bg-gold/20 text-gold"
                    : "border border-border bg-surface text-zinc-500"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`max-w-[6.5rem] text-center text-[11px] leading-tight sm:max-w-none sm:text-xs ${
                  active || completed ? "text-white" : "text-zinc-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-1.5 h-px flex-1 sm:mx-2 ${
                  completed ? "bg-gold" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
