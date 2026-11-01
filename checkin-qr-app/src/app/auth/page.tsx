
import {LoginForm} from '@/components/auth/LoginForm';
export default function AuthPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
			<section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
				<LoginForm />
			</section>
		</main>
	);
}
