'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/server-actions/user-actions'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

type UserRole = 'ADMIN' | 'WORKER'
interface UserWithRole {
  role?: UserRole
}

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
})

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const [showPassword, setShowPassword] = useState(false)

  function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    startTransition(async () => {
      const res = await login(values.email, values.password)
      if (res.error) {
        setError(res.error)
        return
      }
      const role = (res.user as UserWithRole | undefined)?.role
      if (role === 'ADMIN') {
        router.push('/admin-dashboard')
      } else {
        router.push('/worker-dashboard')
      }
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-slate-200/60">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              Sign in to Sarh Task Hub
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Access your {`account`} to continue.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground transition"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <div className="flex items-center justify-between mt-1">
                        <FormDescription className="text-xs">
                          Use your account password.
                        </FormDescription>
                        <Link
                          href="#"
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-start gap-2">
                    <span className="font-medium">Error:</span>
                    <span className="flex-1">{error}</span>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full font-medium flex items-center justify-center gap-2"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>
            <Separator className="my-6" />
            <p className="text-xs text-center text-muted-foreground">
              By continuing you agree to our{' '}
              <Link href="#" className="underline underline-offset-2">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="#" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
