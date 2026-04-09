interface Props {
  content: string
  date?: string
}

export function DiaryCard({ content, date }: Props) {
  return (
    <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
      {date && (
        <p className="text-label text-primary/60 uppercase mb-2">
          {new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </p>
      )}
      <p className="text-body text-on-surface italic whitespace-pre-wrap">{content}</p>
    </div>
  )
}
