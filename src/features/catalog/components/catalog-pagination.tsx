import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CatalogPagination({ page, pageCount, onPageChange, disabled = false }: {
  disabled?: boolean
  page?: number
  pageCount?: number
  onPageChange: (page: number) => void
}) {
  const ready = page !== undefined && pageCount !== undefined && pageCount > 0
  return (
    <nav aria-label="Paginação do catálogo" className="flex flex-wrap items-center justify-center gap-4 border-t pt-8">
      <Button variant="outline" className="size-10 rounded-sm" aria-label="Página anterior"
        disabled={disabled || !ready || page <= 1} onClick={() => ready && onPageChange(page - 1)}>
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span aria-live="polite" className="text-xs text-muted-foreground">
        {ready ? `Página ${page} de ${pageCount}` : 'Paginação indisponível'}
      </span>
      <Button variant="outline" className="size-10 rounded-sm" aria-label="Próxima página"
        disabled={disabled || !ready || page >= pageCount} onClick={() => ready && onPageChange(page + 1)}>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
