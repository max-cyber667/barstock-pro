import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, cocktailNames } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const listHint = cocktailNames?.length
      ? `\n\nCocktails du menu : ${(cocktailNames as string[]).join(", ")}`
      : "";

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
              text: `Analyse ce ticket de caisse ou rapport de ventes de bar et extrais la liste des cocktails/boissons vendus avec leurs quantités.${listHint}

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, au format :
[
  { "name": "nom du cocktail tel qu'il apparaît sur le ticket", "quantity": 5 },
  ...
]

Si tu ne peux pas lire le document ou s'il n'y a pas de ventes, réponds avec un tableau vide : []
Pour les quantités, utilise toujours un nombre entier positif.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Scan ticket error:", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
