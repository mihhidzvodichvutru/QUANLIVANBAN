export default function ModulePlaceholder({ title, phase, description }) {
  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-stone-200 rounded-[4px] p-6">
        <span className="inline-block font-mono text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-300 rounded-[2px] mb-3">
          {phase}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}