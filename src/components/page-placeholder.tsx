import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PagePlaceholder({ title, description, children }: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">Esta página será implementada nas próximas etapas.</p>
        {children}
      </CardContent>
    </Card>
  )
}
