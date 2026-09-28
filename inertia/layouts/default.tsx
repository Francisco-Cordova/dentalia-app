import { type Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { type ReactElement, useEffect } from 'react'
import AdminLayout from '~/layouts/admin'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url, flash } = usePage()
  const isAuthPage = url === '/' || url === '/signup'
  useEffect(() => {
    toast.dismiss()
  }, [url])

  useEffect(() => {
    if (flash.error) {
      toast.error(flash.error)
    }
    if (flash.success) {
      toast.success(flash.success)
    }
  })

  if (isAuthPage) {
    return (
      <>
        <main className="auth-layout">{children}</main>
        <Toaster position="top-center" richColors />
      </>
    )
  }

  return (
    <>
      <AdminLayout>{children}</AdminLayout>
      <Toaster position="top-center" richColors />
    </>
  )
}
