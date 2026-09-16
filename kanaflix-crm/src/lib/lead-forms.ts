import { z } from "zod";

export const fieldTypeSchema = z.enum(["text", "email", "tel", "textarea", "select", "checkbox"]);

export const leadFormFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,39}$/, "Identificador de campo inválido."),
  label: z.string().trim().min(1, "Todo campo precisa de um nome.").max(60),
  type: fieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().trim().max(100).optional().default(""),
  options: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
});

export type LeadFormField = z.infer<typeof leadFormFieldSchema>;
type FieldsResult = { success: true; data: LeadFormField[] } | { success: false; error: string };

export const requiredLeadFields: LeadFormField[] = [
  { key: "name", label: "Nome", type: "text", required: true, placeholder: "Seu nome completo" },
  { key: "email", label: "E-mail", type: "email", required: true, placeholder: "voce@empresa.com" },
  { key: "phone", label: "Telefone", type: "tel", required: true, placeholder: "(00) 00000-0000" },
];

export function parseLeadFormFields(value: string): FieldsResult {
  let input: unknown;
  try {
    input = JSON.parse(value);
  } catch {
    return { success: false, error: "A configuração dos campos está inválida." };
  }

  const parsed = z.array(leadFormFieldSchema).min(3).max(12).safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Revise os campos do formulário." };

  const keys = parsed.data.map((field) => field.key);
  if (new Set(keys).size !== keys.length) return { success: false, error: "Existem campos duplicados no formulário." };

  for (const requiredField of requiredLeadFields) {
    const field = parsed.data.find((candidate) => candidate.key === requiredField.key);
    if (!field?.required || field.type !== requiredField.type) {
      return { success: false, error: `O campo ${requiredField.label} é obrigatório e não pode ser removido.` };
    }
  }

  for (const field of parsed.data) {
    if (field.type === "select" && (!field.options || field.options.length < 2)) {
      return { success: false, error: `Adicione pelo menos duas opções ao campo ${field.label}.` };
    }
  }

  return { success: true, data: parsed.data };
}

export function slugifyFormName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}
