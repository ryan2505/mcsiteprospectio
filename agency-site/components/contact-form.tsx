"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      business: String(data.get("business") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Erreur d'envoi");
      }

      setStatus("ok");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="font-semibold text-green-800">Message reçu !</p>
        <p className="text-sm text-green-700">
          On revient vers vous sous 2h ouvrées.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        name="name"
        placeholder="Votre nom"
        required
        minLength={2}
        maxLength={80}
        autoComplete="name"
      />
      <Input
        name="phone"
        type="tel"
        placeholder="WhatsApp (ex: +237 6XX XX XX XX)"
        required
        minLength={6}
        maxLength={30}
        autoComplete="tel"
      />
      <Input
        name="business"
        placeholder="Nom de votre établissement"
        required
        minLength={2}
        maxLength={120}
      />
      <Textarea
        name="message"
        placeholder="Dites-nous en quelques mots ce que vous voulez (optionnel)"
        maxLength={1000}
      />

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi…
          </>
        ) : (
          "Recevoir ma maquette gratuite"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        En envoyant, vous acceptez d'être recontacté sur WhatsApp.
      </p>
    </form>
  );
}
