import { STATUS_CONFIG, type GenerationStatus } from '@/lib/constants'

interface Props {
  status: GenerationStatus
}

export function StatusDot({ status }: Props) {
  const config = STATUS_CONFIG[status]

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-sm text-on-surface-variant">{config.label}</span>
    </span>
  )
}
