import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  if (!token) {
    redirect('/auth/login')
  }

  let tokenData: any
  try {
    tokenData = JSON.parse(token.value)
  } catch {
    redirect('/auth/login')
  }

  const stockRequest = await prisma.stockRequest.findUnique({
    where: { id },
    include: { product: true, requestedBy: true }
  })

  if (!stockRequest) {
    notFound()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Request Details</h1>
      <div className="space-y-2">
        <div><span className="font-medium">ID:</span> {stockRequest.id}</div>
        <div><span className="font-medium">Product:</span> {stockRequest.product.name}</div>
        <div><span className="font-medium">Quantity:</span> {stockRequest.quantity}</div>
        <div><span className="font-medium">Status:</span> {stockRequest.status}</div>
        <div><span className="font-medium">Requested By:</span> {stockRequest.requestedBy.name}</div>
        {stockRequest.notes ? (
          <div><span className="font-medium">Notes:</span> {stockRequest.notes}</div>
        ) : null}
        <div><span className="font-medium">Created:</span> {stockRequest.createdAt.toISOString()}</div>
      </div>
    </div>
  )
}


