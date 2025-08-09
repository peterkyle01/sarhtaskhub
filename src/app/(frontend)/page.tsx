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
import { Eye, EyeOff, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/custom/theme-toggle'

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-muted/20 px-4 py-10 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Branding Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
              <FileText className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Sarh Task Hub</h1>
          <p className="text-muted-foreground text-sm">Professional task management platform</p>
        </div>

        <Card className="shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center text-foreground">
              Welcome Back
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Sign in to access your dashboard and manage tasks
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@gmail.com"
                          autoComplete="email"
                          className="h-11 bg-background/50 border-border/60 focus:border-primary/50 transition-all duration-200"
                          {...field}
                        />
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
                      <FormLabel className="text-foreground font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-11 bg-background/50 border-border/60 focus:border-primary/50 transition-all duration-200 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <div className="flex items-center justify-between mt-2">
                        <FormDescription className="text-xs text-muted-foreground">
                          Enter your account password
                        </FormDescription>
                        <Link
                          href="#"
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                    </div>
                    <div>
                      <span className="font-medium">Authentication failed</span>
                      <p className="mt-0.5 text-xs opacity-90">{error}</p>
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full h-11 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <Separator className="bg-border/50" />

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link
                  href="#"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="#"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Secure login powered by Payload CMS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>© 2025 Sarh Task Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
