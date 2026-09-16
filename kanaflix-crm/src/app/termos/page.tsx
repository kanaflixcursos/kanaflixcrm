import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 sm:px-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para o Kanaflix CRM
        </Link>
        <h1 className="mt-8 text-4xl font-medium tracking-[-0.04em]">Termos de uso</h1>
        <p className="mt-4 text-sm text-muted-foreground">Última atualização: 16 de setembro de 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-medium text-foreground">Uso do serviço</h2>
            <p className="mt-2">O Kanaflix CRM oferece ferramentas para organizar contatos, oportunidades, atividades e captação de leads. Você é responsável pelos dados inseridos e por manter suas credenciais seguras.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Uso aceitável</h2>
            <p className="mt-2">Não use o serviço para atividades ilegais, envio de spam, tentativa de acesso indevido ou tratamento de dados sem a devida autorização.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Disponibilidade</h2>
            <p className="mt-2">Trabalhamos para manter o serviço disponível e seguro, mas manutenções e falhas de provedores externos podem causar indisponibilidade temporária.</p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Contato</h2>
            <p className="mt-2">Ao continuar usando o Kanaflix CRM, você concorda com estes termos e com a nossa política de privacidade.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
