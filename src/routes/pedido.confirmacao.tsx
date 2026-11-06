import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireSession } from '@/features/auth/guard'
import { OrdersPage } from '@/features/orders/orders-page'
export const Route = createFileRoute('/pedido/confirmacao')({ beforeLoad: requireSession, validateSearch: z.object({ orderId: z.string().optional() }), component: OrdersPage })
