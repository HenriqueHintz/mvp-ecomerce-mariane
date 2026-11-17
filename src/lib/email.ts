import crypto from "crypto";
import { maskPiiEmail } from "@/lib/orders";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  mode: "brevo" | "console";
  messageId?: string;
  error?: string;
}

function maskOtpInLog(text: string): string {
  return text.replace(/\b\d{6}\b/g, "******");
}

/**
 * Envia e-mail transacional via API HTTP do Brevo (`/v3/smtp/email`).
 * Em desenvolvimento/testes sem `BREVO_API_KEY`, apenas registra log com PII e código mascarados.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const fromEmail = (process.env.EMAIL_FROM || "").trim();
  const fromName = (process.env.EMAIL_FROM_NAME || "Mariane Cosméticos").trim();
  const safeRecipient = maskPiiEmail(to) || "[email-mascarado]";

  if (!apiKey) {
    const safeSubject = maskOtpInLog(subject);
    if (
      process.env.NODE_ENV === "production" &&
      process.env.EMAIL_SANDBOX !== "true"
    ) {
      console.error(
        `[email] BREVO_API_KEY ausente em produção ao enviar para ${safeRecipient}. Assunto="${safeSubject}"`
      );
      return {
        success: false,
        mode: "brevo",
        error: "Provedor de e-mail (BREVO_API_KEY) não configurado.",
      };
    }

    console.info(
      `[email:sandbox] Destinatário=${safeRecipient} Assunto="${safeSubject}" (text=${text.length} chars, html=${html.length} chars)`
    );
    return {
      success: true,
      mode: "console",
      messageId: `sandbox_${crypto.randomUUID()}`,
    };
  }

  if (!fromEmail) {
    console.error(`[email] EMAIL_FROM não configurado ao enviar para ${safeRecipient}.`);
    return {
      success: false,
      mode: "brevo",
      error: "Remetente oficial (EMAIL_FROM) não configurado.",
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [{ email: to.trim() }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const errorStatus = response.status;
      console.error(
        `[email] Falha HTTP ${errorStatus} no provedor Brevo para ${safeRecipient}.`
      );
      return {
        success: false,
        mode: "brevo",
        error: `Falha ao enviar e-mail (HTTP ${errorStatus}).`,
      };
    }

    const data = (await response.json().catch(() => ({}))) as {
      messageId?: string;
    };
    return {
      success: true,
      mode: "brevo",
      messageId: data.messageId || `brevo_${crypto.randomUUID()}`,
    };
  } catch (err) {
    console.error(
      `[email] Erro de rede ao enviar via Brevo para ${safeRecipient}:`,
      err instanceof Error ? err.message : "erro desconhecido"
    );
    return {
      success: false,
      mode: "brevo",
      error: "Erro de comunicação com o servidor de e-mail.",
    };
  }
}
