"use client";

import { signIn, getProviders, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Chrome, Loader2 } from "lucide-react";
import Image from "next/image";

type Provider = { id: string; name: string };

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H17V4.8c-.4-.1-1.6-.2-3-.2-3 0-5 1.8-5 5.1V11H6v3h3V22h4.5z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-7.1L5.8 22H2.7l7.3-8.4L1 2h6.3l4.3 6.4L18.9 2Zm-1.1 18h1.7L7.2 3.9H5.4L17.8 20Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.7.5.6 5.7.6 12.2c0 5.2 3.4 9.6 8.1 11.1.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.8 2.1 3.3 1.5.1-.8.4-1.4.7-1.7-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.4-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.1 0 0 .9-.3 3.1 1.2.9-.3 1.8-.4 2.7-.4.9 0 1.9.1 2.7.4 2.2-1.5 3.1-1.2 3.1-1.2.6 1.6.2 2.8.1 3.1.7.8 1.1 1.9 1.1 3.1 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.7-1.5 8.1-5.9 8.1-11.1C23.4 5.7 18.3.5 12 .5Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const params = useSearchParams();
  const callbackUrl = params.get("from") ?? "/";
  const err = params.get("error");
  const { status } = useSession();
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);

  useEffect(() => {
    getProviders().then((p) => setProviders((p as any) ?? {}));
  }, []);

  const hasGoogle = useMemo(() => !!providers?.google, [providers]);
  const hasFacebook = useMemo(() => !!providers?.facebook, [providers]);
  const hasTwitter = useMemo(() => !!providers?.twitter, [providers]);
  const hasGithub = useMemo(() => !!providers?.github, [providers]);
  const hasEmail = useMemo(() => !!providers?.email, [providers]);
  const hasCreds = useMemo(() => !!providers?.credentials, [providers]);

  if (status === "loading" || providers === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-soft p-6">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-mark.svg" width={36} height={36} alt="PicksRocket" />
          <div>
            <div className="text-lg font-semibold">PicksRocket</div>
            <div className="text-sm text-slate-600">Inicia sesión para ver picks y predicciones en tiempo real.</div>
          </div>
        </div>
        <div className="mt-6 space-y-3">{err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              Error de autenticación: <span className="font-mono">{err}</span>. Revisa tu <span className="font-mono">.env.local</span>
              (NEXTAUTH_URL, NEXTAUTH_SECRET, Google/Facebook/X/Email) y reinicia.
            </div>
          )}
          {hasGoogle && (
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              <Chrome className="h-4 w-4" /> Continuar con Google
            </button>
          )}

          


{hasFacebook && (
  <button
    onClick={() => signIn("facebook", { callbackUrl })}
    className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2"
  >
    <FacebookIcon /> Continuar con Facebook
  </button>
)}

{hasTwitter && (
  <button
    onClick={() => signIn("twitter", { callbackUrl })}
    className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2"
  >
    <XIcon /> Continuar con X
  </button>
)}

{hasGithub && (
  <button
    onClick={() => signIn("github", { callbackUrl })}
    className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2"
  >
    <GitHubIcon /> Continuar con GitHub
  </button>
)}

{hasEmail && (
            <button
              onClick={() => signIn("email", { callbackUrl })}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" /> Continuar con correo
            </button>
          )}

          {providers?.credentials && (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget as any;
      const email = form.email.value;
      const password = form.password.value;
      await signIn("credentials", { email, password, callbackUrl });
    }}
    className="w-full rounded-xl border border-slate-200 bg-white p-3 space-y-2"
  >
    <div className="text-xs font-medium text-slate-700">Acceso rápido (Dev)</div>
    <input
      name="email"
      type="email"
      required
      placeholder="tu@correo.com"
      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
    />
    <input
      name="password"
      type="password"
      required
      placeholder="Password"
      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
    />
    <button className="w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-medium">
      Entrar
    </button>
    <div className="text-[11px] text-slate-500">
      Activo solo si <span className="font-mono">DEV_LOGIN_PASSWORD</span> está configurado en <span className="font-mono">.env.local</span>.
    </div>
  </form>
)}

          {!hasGoogle && !hasEmail && !hasCreds && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Aún no hay proveedores de login configurados. Configura Google, Facebook, X o Email en <span className="font-mono">.env.local</span>.
            </div>
          )}
        </div>

        <div className="mt-5 text-xs text-slate-500 leading-relaxed">
          Recomendado para producción: Google + Email (magic link) (magic link) con base de datos.
        </div>
      </div>
    </div>
  );
}
