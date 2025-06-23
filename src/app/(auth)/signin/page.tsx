import SignInForm from "@/components/auth/signin-form"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignInForm />
    </div>
  )
}
