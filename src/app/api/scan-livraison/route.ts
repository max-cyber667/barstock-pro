import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType ?? "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Analyse ce bon de livraison ou facture et extrais la liste des articles avec leurs quantités.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, au format :
[
  { "name": "nom de l'article", "quantity": 12, "unit": "unité détectée ou vide" },
  ...
]

Si tu ne peux pas lire le document ou s'il n'y a pas d'articles, réponds avec un tableau vide : []
Normalise les noms en majuscule/minuscule standard. Pour les quantités, utilise toujours un nombre (pas de texte).`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
