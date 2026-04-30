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
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
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
                className={`text-xs ${
                  active || completed ? "text-white" : "text-zinc-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${
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
