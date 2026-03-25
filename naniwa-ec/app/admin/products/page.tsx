import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsClient from './ProductsClient'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, stock, is_featured')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <ProductsClient initialProducts={products ?? []} />
}
