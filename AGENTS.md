# Permit Radar AI — Plan d’implémentation backend pour hackathon 6h

## 1. Contexte du challenge

### Challenge Track #1 — BCF

**Thème :** “Just in Time” Information — AI for Actionable & Time-Sensitive Updates

Le challenge demande de construire un prototype fonctionnel et scalable qui aide les organisations à surveiller, analyser et interpréter des mises à jour importantes en temps réel.

Dans le contexte général du challenge, les organisations doivent surveiller :

- les mises à jour législatives et réglementaires ;
- les obligations de conformité ;
- les changements dans les conditions d’utilisation de plateformes technologiques ;
- les mises à jour provenant de fournisseurs d’IA et de technologie ;
- les décisions judiciaires ou administratives pertinentes ;
- tout changement critique pouvant affecter une entreprise ou un secteur.

Le problème n’est pas seulement de trouver l’information. Le vrai problème est de comprendre :

- **ce qui a changé ;**
- **pourquoi c’est important ;**
- **qui est impacté ;**
- **à quel point c’est urgent ;**
- **quelle action devrait être prise.**

Les newsletters et alertes génériques ne suffisent plus. Le but est de construire un système qui transforme le bruit informationnel en intelligence actionnable.

---

## 2. Spécialisation choisie par notre équipe

Notre équipe a choisi de spécialiser le projet dans le domaine suivant :

# Permis, construction, zonage et conformité réglementaire

L’application ne vise pas tous les domaines juridiques. Elle se concentre sur les changements qui peuvent affecter :

- les permis de construction ;
- les permis de rénovation ;
- les changements d’usage ;
- les projets immobiliers ;
- le zonage municipal ;
- les règlements municipaux ;
- le Code de construction ;
- les exigences documentaires ;
- les décisions judiciaires ou administratives pertinentes, notamment via CanLII ;
- les risques de refus ou de retard dans l’approbation d’un permis.

Cette spécialisation rend le projet plus concret, plus démontrable et plus utile pour un cabinet comme BCF, notamment pour des clients en :

- immobilier ;
- construction ;
- droit municipal ;
- droit de l’environnement ;
- développement urbain ;
- architecture ;
- ingénierie ;
- promotion immobilière.

---

## 3. Nom du produit

# Permit Radar AI

### Tagline

**AI-powered permit and construction compliance monitoring.**

### Version française

**Veille intelligente des permis et de la conformité en construction.**

---

## 4. Problème précis résolu

Dans la construction, un changement réglementaire ou administratif peut avoir des conséquences directes sur un projet :

- retard d’émission du permis ;
- refus de permis ;
- demande de documents supplémentaires ;
- modification des plans ;
- coûts additionnels ;
- risques juridiques ;
- non-conformité au zonage ;
- problèmes avec le Code de construction ;
- exigences plus strictes en matière de sécurité incendie, accessibilité, verdissement, stationnement, patrimoine ou usage.

Les équipes de projet doivent souvent suivre plusieurs sources en même temps :

- sites municipaux ;
- règlements de zonage ;
- guides de dépôt de permis ;
- Code de construction ;
- décisions CanLII ;
- mises à jour de procédures administratives ;
- communications des arrondissements ou municipalités.

La difficulté est de répondre rapidement aux questions suivantes :

1. Est-ce que ce changement touche notre projet ?
2. Est-ce qu’il peut retarder le permis ?
3. Est-ce qu’on doit modifier les plans ?
4. Quels documents doivent être ajoutés ?
5. Qui dans l’équipe doit agir ?
6. Est-ce urgent ?

Permit Radar AI répond à ces questions avec une analyse générée par IA et fondée sur les documents disponibles.

---

## 5. Solution proposée

Permit Radar AI est une API backend qui permet de :

1. charger des profils de projets de construction ;
2. charger des alertes réglementaires, municipales, administratives ou judiciaires ;
3. analyser l’impact d’une alerte sur un projet spécifique avec l’IA ;
4. répondre à des questions à partir de documents sources avec un mini RAG ;
5. comparer un ancien texte et un nouveau texte pour expliquer ce qui a changé ;
6. exposer des endpoints simples pour un frontend éventuel.

Le prototype doit démontrer que l’IA peut transformer une mise à jour brute en analyse utile.

---

## 6. Ce que l’application doit produire

Pour chaque alerte, l’application doit être capable de générer :

- un résumé exécutif ;
- ce qui a changé ;
- pourquoi c’est important ;
- l’impact spécifique sur le projet ;
- le niveau de risque ;
- le niveau d’urgence ;
- les actions recommandées ;
- le raisonnement basé sur les sources ;
- un avertissement indiquant que ce n’est pas un avis juridique.

Exemple de sortie attendue :

```json
{
  "executiveSummary": "The new green space requirement may affect the Rosemont residential project because it is a 6-storey residential construction currently preparing its permit application.",
  "whatChanged": "Residential projects of 4 storeys or more must now demonstrate compliance with a minimum landscaped green space ratio before permit approval.",
  "whyItMatters": "If the site plan does not show sufficient landscaped areas, the permit application may be delayed or require redesign.",
  "projectSpecificImpact": "The project is directly impacted because it is residential, multi-storey, located in Montreal, and still in the pre-submission stage.",
  "riskLevel": "High",
  "urgency": "High",
  "recommendedActions": [
    "Review the site plan for landscaped and permeable areas.",
    "Confirm the minimum green space requirement with the borough.",
    "Update the permit submission package before filing.",
    "Ask the design team to validate whether redesign is required."
  ],
  "sourceBasedReasoning": "The source indicates that projects of 4 storeys or more must demonstrate green space compliance before permit approval.",
  "disclaimer": "This is legal and permitting information, not legal advice. A qualified professional should review the issue."
}
```

---

## 7. Judging criteria du hackathon

Les juges évaluent selon quatre critères.

## 7.1 Innovation & Creativity

Ce que les juges cherchent :

- Est-ce que la solution est originale ?
- Est-ce qu’elle attaque le problème juridique d’une nouvelle façon ?
- Est-ce qu’elle va au-delà d’un simple chatbot ou d’un simple résumé ?

Comment Permit Radar AI répond au critère :

- Le projet ne fait pas seulement un résumé juridique.
- Il relie une alerte à un projet concret de construction.
- Il produit un score de risque, une urgence et des actions recommandées.
- Il peut intégrer des règlements municipaux, des exigences de permis, le Code de construction et des décisions CanLII.
- Il transforme une veille juridique en outil opérationnel pour les équipes de projet.

## 7.2 Technical Execution

Ce que les juges cherchent :

- Est-ce que le prototype fonctionne ?
- Est-ce que les features principales marchent ?
- Est-ce que l’architecture est claire ?
- Est-ce que l’équipe a livré quelque chose de démontrable ?

Comment Permit Radar AI répond au critère :

- API backend en TypeScript/Node.js.
- Endpoints simples et testables.
- Analyse IA fonctionnelle.
- Mini RAG fonctionnel.
- Comparaison old/new fonctionnelle.
- Données chargées depuis JSON et fichiers texte.
- Code simple, maintenable et hackathon-friendly.

## 7.3 AI Utilization

Ce que les juges cherchent :

- Est-ce que l’IA est utilisée de manière significative ?
- Est-ce que l’IA résout réellement le problème ?
- Est-ce que l’IA aide à analyser, contextualiser ou prioriser ?

Comment Permit Radar AI répond au critère :

- L’IA analyse l’impact d’une alerte sur un projet précis.
- L’IA explique ce qui a changé et pourquoi c’est important.
- L’IA propose des actions concrètes.
- L’IA répond aux questions avec un mini RAG basé sur les documents.
- L’IA compare des textes pour identifier les deltas.

## 7.4 Presentation & Pitch

Ce que les juges cherchent :

- Est-ce que le problème est clair ?
- Est-ce que la solution est facile à comprendre ?
- Est-ce que la valeur est bien articulée ?
- Est-ce que la démo raconte une histoire convaincante ?

Même si le pitch est géré par une autre personne, le backend doit supporter une démo claire :

1. Choisir un projet de construction.
2. Choisir une alerte réglementaire.
3. Demander à l’IA d’analyser l’impact.
4. Poser une question au chat RAG.
5. Comparer l’ancien texte et le nouveau texte.

---

## 8. Scope réaliste en 6h

Le temps est très limité. Il ne faut pas construire une plateforme complète.

## Ce qu’on construit

- Application full-stack Next.js 15 (TypeScript + Tailwind + shadcn/ui).
- API routes Next.js (`app/api/*`).
- Lecture de données JSON pour les projets, alertes et documents sources.
- Analyse IA via Google Gemini 2.5 Flash sur Vertex AI.
- Mini RAG keyword-based sur fichiers `.txt` locaux.
- Réponses IA structurées en JSON.
- Frontend démontrable : liste de projets, liste d'alertes, dashboard d'analyse, vue chronologique avec marqueurs d'expiration.

## Ce qu’on ne construit pas

- Pas de serveur backend séparé — tout vit dans le projet Next.js.
- Pas de base de données réelle (les fichiers JSON suffisent pour la démo).
- Pas d'authentification réelle.
- Pas d'Active Directory ni de SSO.
- Pas de scraping en direct des sites municipaux.
- Pas d'intégration CanLII réelle (on utilise des extraits de décisions chargés manuellement).
- Pas d'OCR ni de parsing PDF avancé.
- Pas de vector database.
- Pas d'embeddings sémantiques.
- Pas de microservices ni de Kubernetes.
- Pas de Prisma ni de NestJS.


Ces éléments peuvent être mentionnés comme évolution future ou architecture enterprise, mais pas implémentés dans les 6h.

---

## 9. Stack technique choisie

## Backend

- Node.js 20+
- TypeScript
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- shadcn/ui (composants UI préfabriqués)
- Zod (validation des inputs API)
- Gemini 4.5 flash


## Données

- Fichiers JSON
- Fichiers `.txt`

## IA

- Google Gemini 2.5 Flash
- Accès via Vertex AI (Google Cloud)
- SDK : `@google/genai`

## RAG

- Recherche simple par mots-clés sur fichiers `.txt`
- Retour des top documents les plus pertinents
- Injection du contexte dans le prompt IA

---

## 10. Architecture backend cible

```txt
backend/
  src/
    index.ts

    routes/
      health.routes.ts
      projects.routes.ts
      alerts.routes.ts
      analyze.routes.ts
      chat.routes.ts
      compare.routes.ts

    services/
      data.service.ts
      ai.service.ts
      rag.service.ts
      compare.service.ts

    schemas/
      analyze.schema.ts
      chat.schema.ts
      compare.schema.ts

    types/
      project.ts
      alert.ts
      analysis.ts

    data/
      projects.json
      alerts.json
      documents/
        document-1.txt
        document-2.txt
        document-3.txt

  .env
  package.json
  tsconfig.json
```

---

## 12. Endpoints finaux attendus

```txt
GET  /
GET  /health

GET  /projects
GET  /projects/:id

GET  /alerts
GET  /alerts/:id

POST /analyze
POST /chat
POST /compare
```

---

## 13. Description des endpoints

## 13.1 GET `/health`

But : vérifier que l’API fonctionne.

Réponse :

```json
{
  "status": "ok",
  "service": "Permit Radar AI Backend"
}
```

---

## 13.2 GET `/projects`

But : retourner tous les projets de construction disponibles.

Réponse :

```json
[
  {
    "id": "p1",
    "name": "Rosemont Residential Mid-Rise",
    "location": "Montreal",
    "borough": "Rosemont-La Petite-Patrie",
    "projectType": "New Construction",
    "use": "Residential",
    "height": "6 storeys",
    "units": 48,
    "permitStage": "Preparing application",
    "sensitiveFactors": ["multi-storey", "residential", "landscaping", "fire safety"]
  }
]
```

---

## 13.3 GET `/projects/:id`

But : retourner un projet précis.

Exemple :

```txt
GET /projects/p1
```

Si le projet n’existe pas :

```json
{
  "error": "Project not found"
}
```

---

## 13.4 GET `/alerts`

But : retourner toutes les alertes disponibles.

Exemple d’alerte :

```json
{
  "id": "a1",
  "title": "New green space requirement for residential permit applications",
  "source": "Municipal bylaw update",
  "jurisdiction": "Montreal",
  "category": "Zoning / Permit",
  "urgency": "High",
  "impactScore": 87,
  "affectedProjects": ["p1"],
  "risk": "Permit delay or redesign required",
  "oldText": "Residential projects must include adequate outdoor space where applicable.",
  "newText": "Residential projects of 4 storeys or more must include a minimum landscaped green space ratio before permit approval.",
  "documentRefs": ["montreal_green_space_old.txt", "montreal_green_space_new.txt"]
}
```

---

## 13.5 GET `/alerts/:id`

But : retourner une alerte précise.

Exemple :

```txt
GET /alerts/a1
```

Si l’alerte n’existe pas :

```json
{
  "error": "Alert not found"
}
```

---

## 13.6 POST `/analyze`

But : analyser l’impact d’une alerte sur un projet précis.

Input :

```json
{
  "projectId": "p1",
  "alertId": "a1"
}
```

Output attendu :

```json
{
  "projectId": "p1",
  "alertId": "a1",
  "analysis": {
    "executiveSummary": "...",
    "whatChanged": "...",
    "whyItMatters": "...",
    "projectSpecificImpact": "...",
    "riskLevel": "High",
    "urgency": "High",
    "recommendedActions": ["...", "..."],
    "sourceBasedReasoning": "...",
    "disclaimer": "..."
  }
}
```

---

## 13.7 POST `/chat`

But : poser une question à l’IA avec contexte récupéré depuis les documents.

Input :

```json
{
  "question": "What should we do before submitting the permit application?",
  "projectId": "p1"
}
```

Output :

```json
{
  "answer": "...",
  "sources": [
    "montreal_green_space_new.txt",
    "canlii_permit_refusal.txt"
  ]
}
```

---

## 13.8 POST `/compare`

But : comparer un ancien texte et un nouveau texte.

Input option 1 :

```json
{
  "oldText": "Applicants may submit documents in multiple formats.",
  "newText": "Applicants must submit flattened PDFs using standardized naming conventions."
}
```

Input option 2 :

```json
{
  "alertId": "a1"
}
```

Output :

```json
{
  "summary": "The update changes the submission requirement from flexible document formats to a mandatory standardized PDF format.",
  "keyChanges": [
    "Submission format is now mandatory",
    "Flattened PDFs are required",
    "Naming conventions must be standardized"
  ],
  "risk": "Administrative delay if the applicant submits documents in the old format"
}
```

---

## 14. Répartition du travail pour 3 personnes

# Personne 1 — API Core + Data Layer

## Mission

Construire le serveur, les routes de base et la couche de lecture des données.

Cette personne ne touche pas à l’IA.

## Fichiers principaux

```txt
src/index.ts
src/routes/health.routes.ts
src/routes/projects.routes.ts
src/routes/alerts.routes.ts
src/services/data.service.ts
src/types/project.ts
src/types/alert.ts
```

## Tâches

1. Créer le serveur Hono.
2. Activer CORS.
3. Ajouter `/` et `/health`.
4. Créer les types `Project` et `PermitAlert`.
5. Créer `data.service.ts`.
6. Lire `projects.json`.
7. Lire `alerts.json`.
8. Lire les documents `.txt`.
9. Ajouter les routes projets.
10. Ajouter les routes alertes.
11. Gérer les erreurs `not found`.

## Endpoints à livrer

```txt
GET /
GET /health
GET /projects
GET /projects/:id
GET /alerts
GET /alerts/:id
```

## Definition of Done

Les commandes suivantes doivent fonctionner :

```bash
curl http://localhost:3001/health
curl http://localhost:3001/projects
curl http://localhost:3001/projects/p1
curl http://localhost:3001/alerts
curl http://localhost:3001/alerts/a1
```

---

# Personne 2 — AI Analysis Engine

## Mission

Créer l’analyse IA principale.

Cette personne construit l’endpoint qui répond à :

> Cette alerte affecte-t-elle ce projet ? Pourquoi ? Quel est le risque ? Quelles actions recommander ?

## Fichiers principaux

```txt
src/routes/analyze.routes.ts
src/services/ai.service.ts
src/schemas/analyze.schema.ts
src/types/analysis.ts
```

## Tâches

1. Créer le schéma Zod pour `/analyze`.
2. Configurer OpenAI SDK.
3. Créer `analyzePermitImpact()`.
4. Forcer une réponse JSON structurée.
5. Charger le projet avec `data.service.ts`.
6. Charger l’alerte avec `data.service.ts`.
7. Envoyer le contexte au modèle.
8. Retourner l’analyse structurée.
9. Gérer les erreurs OpenAI.
10. Ajouter un fallback si l’IA échoue.

## Endpoint à livrer

```txt
POST /analyze
```

## Input

```json
{
  "projectId": "p1",
  "alertId": "a1"
}
```

## Output

```json
{
  "projectId": "p1",
  "alertId": "a1",
  "analysis": {
    "executiveSummary": "...",
    "whatChanged": "...",
    "whyItMatters": "...",
    "projectSpecificImpact": "...",
    "riskLevel": "High",
    "urgency": "High",
    "recommendedActions": ["..."],
    "sourceBasedReasoning": "...",
    "disclaimer": "..."
  }
}
```

## Definition of Done

La commande suivante doit fonctionner :

```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectId":"p1","alertId":"a1"}'
```

---

# Personne 3 — RAG + Chat + Compare Engine

## Mission

Créer les fonctionnalités complémentaires :

1. mini RAG ;
2. chat avec documents sources ;
3. comparaison old/new.

Cette personne ne fait pas de frontend.

## Fichiers principaux

```txt
src/services/rag.service.ts
src/services/compare.service.ts
src/routes/chat.routes.ts
src/routes/compare.routes.ts
src/schemas/chat.schema.ts
src/schemas/compare.schema.ts
```

## Tâches RAG

1. Lire tous les fichiers `.txt` dans `src/data/documents`.
2. Tokeniser la question.
3. Scorer les documents avec un overlap de mots-clés.
4. Retourner les top 3 documents.
5. Retourner aussi les noms des sources.

## Tâches Chat

1. Créer `/chat`.
2. Valider `{ question, projectId? }` avec Zod.
3. Récupérer le projet si `projectId` est fourni.
4. Récupérer le contexte via `rag.service.ts`.
5. Appeler OpenAI.
6. Retourner `{ answer, sources }`.

## Tâches Compare

1. Créer `/compare`.
2. Accepter soit `{ alertId }`, soit `{ oldText, newText }`.
3. Si `alertId`, charger l’alerte.
4. Comparer `oldText` et `newText` avec l’IA.
5. Retourner `{ summary, keyChanges, risk }`.
6. Ajouter fallback si OpenAI échoue.

## Endpoints à livrer

```txt
POST /chat
POST /compare
```

## Definition of Done

Les commandes suivantes doivent fonctionner :

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What should we do before submitting the permit application?","projectId":"p1"}'
```

```bash
curl -X POST http://localhost:3001/compare \
  -H "Content-Type: application/json" \
  -d '{"alertId":"a1"}'
```

---

## 15. Installation backend

```bash
mkdir backend
cd backend
npm init -y
npm install hono @hono/node-server zod dotenv openai
npm install -D typescript tsx @types/node
npx tsc --init
```

Dans `package.json` :

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

Créer `.env` :

```env
OPENAI_API_KEY=your_api_key_here
```

Lancer le backend :

```bash
npm run dev
```

---

## 16. Types TypeScript recommandés

## Project

```ts
export type Project = {
  id: string;
  name: string;
  location: string;
  borough?: string | null;
  projectType: string;
  use: string;
  height?: string;
  units?: number | null;
  permitStage?: string;
  sensitiveFactors?: string[];
};
```

## PermitAlert

```ts
export type PermitAlert = {
  id: string;
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  impactScore?: number;
  affectedProjects?: string[];
  risk?: string;
  oldText?: string;
  newText?: string;
  documentRefs?: string[];
};
```

## ImpactAnalysis

```ts
export type ImpactAnalysis = {
  executiveSummary: string;
  whatChanged: string;
  whyItMatters: string;
  projectSpecificImpact: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  urgency: "Low" | "Medium" | "High" | "Critical";
  recommendedActions: string[];
  sourceBasedReasoning: string;
  disclaimer: string;
};
```

## CompareResult

```ts
export type CompareResult = {
  summary: string;
  keyChanges: string[];
  risk: string;
};
```

---

## 17. Prompt IA pour `/analyze`

```txt
You are Permit Radar AI, a legal and construction permit intelligence analyst.

You analyze construction permit updates, zoning changes, municipal bylaw updates, construction code changes, and case law updates.

Your job is to compare a project profile with a detected alert and produce a practical impact analysis.

Return ONLY valid JSON with this shape:
{
  "executiveSummary": string,
  "whatChanged": string,
  "whyItMatters": string,
  "projectSpecificImpact": string,
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "recommendedActions": string[],
  "sourceBasedReasoning": string,
  "disclaimer": string
}

Rules:
- Focus on permit delays, redesign risk, zoning compliance, municipal approval, construction code, documentation requirements, and legal/compliance risk.
- Be specific to the project.
- Do not invent exact legal obligations if the source does not provide them.
- This is legal information, not legal advice.
- Always include a disclaimer that a qualified legal or permitting professional should review the issue.
```

---

## 18. Prompt IA pour `/chat`

```txt
You are Permit Radar AI, an assistant for construction permit, zoning, and compliance monitoring.

Use the provided context to answer the user’s question.

Rules:
- Answer practically and clearly.
- Mention the project impact when a project profile is provided.
- Use the provided source context.
- Do not provide legal advice.
- If the context is insufficient, say so.
- Recommend review by a qualified legal, municipal, or permitting professional when appropriate.
```

---

## 19. Prompt IA pour `/compare`

```txt
You are Permit Radar AI, a legal and regulatory change analyst.

Compare the old text and the new text.

Return ONLY valid JSON with this shape:
{
  "summary": string,
  "keyChanges": string[],
  "risk": string
}

Rules:
- Focus on practical consequences for construction permits and project approvals.
- Identify changes that may cause delays, redesign, documentation issues, cost changes, or compliance risk.
- Do not provide legal advice.
```

---

## 20. Mini RAG keyword-based

Le RAG ne sera pas vectoriel dans le MVP. Il sera simple :

1. Lire les fichiers `.txt`.
2. Nettoyer la question.
3. Extraire les mots de plus de 3 caractères.
4. Donner un score à chaque document selon le nombre de mots retrouvés.
5. Trier par score.
6. Retourner les 3 meilleurs documents.
7. Injecter leur contenu dans le prompt IA.

Avantages :

- très rapide à coder ;
- pas besoin de ChromaDB ;
- pas besoin d’embeddings ;
- pas besoin de setup complexe ;
- suffisant pour une démo de 6h.

Limite :

- moins intelligent qu’un vrai RAG vectoriel.

Comment le pitcher si demandé :

> “For the hackathon prototype, we implemented lightweight local retrieval. In an enterprise version, this would be replaced by embeddings and a vector database such as Chroma, Pinecone, pgvector, or Azure AI Search.”

---

## 21. Priorités si le temps manque

## Priorité 1 — indispensable

```txt
GET /projects
GET /alerts
POST /analyze
```

Avec ça, le projet a déjà une valeur IA claire.

## Priorité 2 — important

```txt
POST /chat
```

Cela montre le RAG et l’interaction avec les documents.

## Priorité 3 — bonus

```txt
POST /compare
```

Cela montre la capacité “what changed”.

---

## 22. Tests manuels avec curl

## Health

```bash
curl http://localhost:3001/health
```

## Projects

```bash
curl http://localhost:3001/projects
```

## Project by ID

```bash
curl http://localhost:3001/projects/p1
```

## Alerts

```bash
curl http://localhost:3001/alerts
```

## Alert by ID

```bash
curl http://localhost:3001/alerts/a1
```

## Analyze

```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectId":"p1","alertId":"a1"}'
```

## Chat

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What should we do before submitting the permit application?","projectId":"p1"}'
```

## Compare with alertId

```bash
curl -X POST http://localhost:3001/compare \
  -H "Content-Type: application/json" \
  -d '{"alertId":"a1"}'
```

## Compare with raw text

```bash
curl -X POST http://localhost:3001/compare \
  -H "Content-Type: application/json" \
  -d '{"oldText":"Applicants may submit documents in multiple formats.","newText":"Applicants must submit flattened PDFs using standardized naming conventions."}'
```

---

## 23. Definition of Done globale

Le backend est considéré terminé si :

- `npm run dev` lance le serveur sans erreur ;
- `/health` retourne `ok` ;
- `/projects` retourne les projets ;
- `/alerts` retourne les alertes ;
- `/analyze` retourne une analyse IA structurée ;
- `/chat` retourne une réponse avec sources ;
- `/compare` retourne un résumé des changements ;
- les erreurs sont gérées proprement ;
- les réponses sont en JSON ;
- le code est simple à comprendre par le frontend plus tard.

---

## 24. Fallbacks importants

Comme c’est un hackathon, il faut prévoir les problèmes.

## Si OpenAI ne fonctionne pas

Retourner un fallback structuré :

```json
{
  "executiveSummary": "AI analysis could not be generated, but this alert may require manual review.",
  "whatChanged": "See oldText and newText fields for details.",
  "whyItMatters": "Changes to permit requirements may affect timelines, documents, or approval risk.",
  "projectSpecificImpact": "Manual review is recommended for this project.",
  "riskLevel": "Medium",
  "urgency": "Medium",
  "recommendedActions": [
    "Review the alert manually.",
    "Compare the old and new requirements.",
    "Consult a qualified permitting or legal professional."
  ],
  "sourceBasedReasoning": "Fallback response generated without model output.",
  "disclaimer": "This is legal and permitting information, not legal advice."
}
```

## Si un projet n’existe pas

Retourner :

```json
{
  "error": "Project not found"
}
```

## Si une alerte n’existe pas

Retourner :

```json
{
  "error": "Alert not found"
}
```

## Si le body est invalide

Retourner :

```json
{
  "error": "Invalid request body",
  "details": {}
}
```

---

## 25. Comment expliquer l’architecture enterprise si demandé

Le prototype est local et simple, mais l’architecture peut évoluer vers une version enterprise.

## Prototype actuel

```txt
JSON files + .txt documents
        ↓
Node.js TypeScript API
        ↓
OpenAI analysis
        ↓
RAG keyword retrieval
        ↓
JSON responses for frontend
```

## Version enterprise possible

```txt
Municipal sources / CanLII / Construction Code / Permit portals
        ↓
Scheduled ingestion workers
        ↓
Document storage + version snapshots
        ↓
Semantic diff + change detection
        ↓
Vector database / Azure AI Search / pgvector
        ↓
Private LLM or Azure OpenAI
        ↓
RBAC + SSO + audit logs
        ↓
Dashboard + notifications
```

Fonctions enterprise possibles :

- SSO / Active Directory ;
- RBAC ;
- audit logs ;
- client profiles ;
- scheduled monitoring ;
- Teams/Slack/email notifications ;
- encrypted storage ;
- private LLM deployment ;
- Azure OpenAI or private cloud ;
- version tracking ;
- approval workflows.

---

## 26. Résumé ultra court pour l’équipe

```txt
Produit : Permit Radar AI
Domaine : permis, construction, zonage, conformité
Temps : 6h
Équipe backend : 3 personnes

Personne 1 : Core API + Data Layer
- /health
- /projects
- /alerts
- data.service.ts

Personne 2 : AI Analysis
- /analyze
- OpenAI SDK
- analyse structurée projet + alerte

Personne 3 : RAG + Compare
- /chat
- /compare
- retrieval local sur documents .txt
```

---

## 27. Message final de cadrage

Le but n’est pas de construire une plateforme parfaite.

Le but est de livrer en 6h un backend qui prouve que :

1. on peut représenter des projets de construction ;
2. on peut représenter des alertes réglementaires ou juridiques ;
3. l’IA peut analyser l’impact d’une alerte sur un projet ;
4. l’IA peut répondre à des questions à partir de documents ;
5. l’IA peut expliquer ce qui a changé entre deux versions ;
6. le système peut devenir une vraie plateforme enterprise plus tard.

La démo doit donner cette impression :

> “Permit Radar AI transforme les changements réglementaires liés aux permis de construction en actions concrètes pour éviter les retards, refus de permis et risques de non-conformité.”
