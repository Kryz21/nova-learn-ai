export default function NotesView({ notes }) {
  if (!notes) return <p className="text-muted">No notes generated.</p>

  return (
    <div className="panel p-8 space-y-6">
      {notes.sections?.map((section, i) => (
        <div key={i}>
          <h3 className="font-display text-lg font-medium text-cyan mb-2">{section.heading}</h3>
          <ul className="space-y-1.5">
            {section.points?.map((point, j) => (
              <li key={j} className="text-ink/80 text-sm leading-relaxed flex gap-2">
                <span className="text-magenta mt-1.5">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {notes.keyTerms?.length > 0 && (
        <div className="pt-4 border-t border-line">
          <h4 className="font-mono text-xs tracking-widest uppercase text-muted mb-3">Key terms</h4>
          <div className="flex flex-wrap gap-2">
            {notes.keyTerms.map((term, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-violet/10 border border-violet/30 text-xs text-ink/85">
                <strong className="text-violet">{term.term}</strong> — {term.definition}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
