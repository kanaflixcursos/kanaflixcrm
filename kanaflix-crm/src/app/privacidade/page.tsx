import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 sm:px-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para o Kanaflix CRM
        </Link>
        <h1 className="mt-8 text-4xl font-medium tracking-[-0.04em]">Política de privacidade</h1>
        <p className="mt-4 text-sm text-muted-foreground">Última atualização: 16 de setembro de 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-medium text-foreground">Dados que coletamos</h2>
            <p className="mt-2">Coletamos os dados necessários para criar sua conta e operar o CRM, como nome, e-mail e informações inseridas por você nos espaços de trabalho.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Como usamos os dados</h2>
            <p className="mt-2">Usamos os dados para autenticar o acesso, manter seus espaços de trabalho separados e oferecer os recursos de relacionamento com clientes.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Login com Google</h2>
            <p className="mt-2">Quando você escolhe entrar com Google, recebemos seu nome, endereço de e-mail e imagem de perfil conforme autorizado na tela de consentimento. Não recebemos sua senha do Google.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Seus direitos</h2>
            <p className="mt-2">Você pode solicitar atualização ou exclusão dos seus dados pelo suporte do Kanaflix. Mantemos apenas o necessário para prestar o serviço e cumprir obrigações legais.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
