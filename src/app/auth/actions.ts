'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPath = formData.get('redirect') as string || '/dashboard'

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message }
  }

  redirect(redirectPath)
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Use admin client (service role) to bypass RLS on user_settings
  const admin = getSupabase()
  const { data: settings } = await admin
    .from('user_settings')
    .select('plan, display_name')
    .eq('user_email', user.email!)
    .single()

  const plan = settings?.plan || 'free'

  return {
    email: user.email,
    id: user.id,
    displayName: settings?.display_name || user.user_metadata.full_name || '',
    plan,
    role: plan === 'admin' ? 'admin' : plan === 'pro' ? 'pro' : 'free'
  }
}

export async function signUp(data: any) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.firstName,
        first_name: data.firstName,
        company_name: data.companyName,
        sectors: data.sectors,
        regions: data.regions,
        siret: data.siret,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, session: authData.session }
}

export async function forgotPassword(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  })
  
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
