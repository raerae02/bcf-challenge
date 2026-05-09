# Permit Radar AI — Plan d'implémentation pour hackathon

## 1. Contexte du challenge

### Challenge Track #1 — BCF

**Thème :** "Just in Time" Information — AI for Actionable & Time-Sensitive Updates

Le challenge demande un prototype fonctionnel qui aide les utilisateurs à surveiller, analyser et interpréter des mises à jour réglementaires et législatives importantes en temps réel.

Le vrai problème n'est pas simplement de trouver l'information. C'est de comprendre :

- **ce qui a changé ;**
- **pourquoi c'est important ;**
- **qui est impacté ;**
- **à quel point c'est urgent ;**
- **quelle action devrait être prise.**

Les newsletters et alertes génériques ne suffisent plus. Le but est de transformer le bruit informationnel en intelligence actionnable, adaptée au contexte de chaque utilisateur.

---

## 2. Spécialisation et utilisateur ciblé

Notre équipe a choisi un domaine spécifique et un utilisateur spécifique.

### Domaine

**Permis, construction, zonage, immobilier et conformité réglementaire au Québec.**

### Utilisateur principal

**Petites entreprises et entrepreneurs** qui lancent un projet de construction ou un commerce nécessitant des permis (ex : ouvrir une boulangerie au centre-ville de Montréal, rénover un local commercial, construire un immeuble résidentiel).

Ces utilisateurs n'ont généralement pas :

- d'avocat à temps plein ;
- de connaissance approfondie du droit municipal ou du Code de construction ;
- les ressources pour suivre toutes les mises à jour réglementaires pertinentes.

### Utilisateurs secondaires

- **Investisseurs** : utilisent l'outil pour faire de la diligence raisonnable sur les projets qu'ils financent.
- **Cabinets d'avocats** (comme BCF) : utilisent l'outil comme point de départ pour la recherche ou pour offrir un service à leurs clients PME.

---

## 3. Nom du produit

# Permit Radar AI

### Tagline

**AI-powered permit and construction compliance monitoring.**

### Version française

**Veille intelligente des permis et de la conformité en construction.**

---

## 4. Problème précis résolu

Un entrepreneur qui veut ouvrir une boulangerie à Montréal doit naviguer :

- des règlements municipaux (zonage, occupation, signalisation, terrasses) ;
- des permis provinciaux (MAPAQ pour la nourriture, RBQ pour la construction) ;
- des règles d'arrondissement (chaque arrondissement a ses propres règles) ;
- le Code de construction du Québec ;
- des décisions judiciaires pertinentes (CanLII) ;
- des changements fréquents à toutes ces sources.

Sans avocat, c'est presque impossible à gérer. Et même avec un avocat, suivre les _changements_ à chaque source est coûteux.

Permit Radar AI répond à deux questions principales :

1. **Quel est le paysage réglementaire complet de mon projet ?** (snapshot initial)
2. **Qu'est-ce qui a changé depuis la dernière fois et est-ce que ça m'affecte ?** (monitoring continu)

---

## 5. Solution proposée

Permit Radar AI est une application Next.js full-stack qui permet à un utilisateur de :

1. **Décrire son projet en langage naturel** (ex : "Je veux ouvrir une boulangerie de 800 pi² rue Saint-Denis avec terrasse").
2. **Obtenir un profil structuré du projet** généré par l'IA (type d'activité, localisation, contraintes).
3. **Recevoir un snapshot réglementaire complet** : toutes les lois, règlements et permis pertinents avec un score de risque pour chacun.
4. **Voir les changements récents** qui affectent ce profil de projet, classés par urgence.
5. **Poser des questions en langage naturel** sur les sources réglementaires (RAG sur documents).
6. **Recevoir un rapport de risque** avec actions recommandées.

Le prototype démontre que l'IA peut transformer une description simple en analyse réglementaire complète et personnalisée.

---

## 6. Ce que l'application doit produire

### 6.1 Snapshot réglementaire (output principal)

Pour un projet décrit par l'utilisateur, le système produit :

```json
{
  "projectProfile": {
    "businessType": "bakery",
    "activities": ["food_preparation", "retail_sales", "outdoor_seating"],
    "location": { "city": "Montréal", "borough": "Plateau-Mont-Royal" },
    "scale": { "squareFeet": 800, "employees": 4 }
  },
  "regulatorySnapshot": {
    "totalApplicableRules": 14,
    "riskOverview": "Medium",
    "rules": [
      {
        "id": "mapaq_food_permit",
        "title": "Permis d'exploitation de restaurant (MAPAQ)",
        "category": "Food Safety",
        "jurisdiction": "Quebec",
        "applies": "Required for any establishment preparing food for sale.",
        "summary": "Le MAPAQ exige un permis d'exploitation pour tout établissement préparant des aliments. Inclut une formation en hygiène et une inspection.",
        "riskLevel": "High",
        "estimatedTimeline": "30-60 jours",
        "estimatedCost": "150-250 $",
        "recentChanges": [],
        "officialUrl": "https://www.mapaq.gouv.qc.ca/..."
      }
    ]
  },
  "recentAlerts": [
    {
      "id": "a1",
      "title": "New green space requirement for residential permit applications",
      "affectsThisProject": true,
      "urgency": "High",
      "summary": "Les projets résidentiels de 4 étages ou plus doivent maintenant démontrer un ratio minimum d'espace vert avant l'approbation du permis.",
      "recommendedAction": "Vérifier le plan de site pour les espaces verts."
    }
  ],
  "riskReport": {
    "executiveSummary": "Ce projet de boulangerie présente un risque modéré principalement en raison des exigences MAPAQ et des règles de terrasse.",
    "topRisks": [
      "Permis MAPAQ requis avec délai de 30-60 jours",
      "Règles de terrasse strictes dans le Plateau",
      "Inspection sécurité incendie obligatoire"
    ],
    "recommendedActions": [
      "Démarrer la demande MAPAQ avant la signature du bail",
      "Vérifier les règles de terrasse de l'arrondissement Plateau-Mont-Royal",
      "Obtenir attestations électriques et plomberie avant les inspections"
    ],
    "disclaimer": "Ceci est de l'information juridique, pas un avis juridique."
  }
}
```

### 6.2 Analyse de changement (pour les alertes)

Pour chaque changement détecté affectant un projet, l'application génère :

- ce qui a changé ;
- pourquoi c'est important pour CE projet ;
- niveau de risque et urgence ;
- actions recommandées ;
- avertissement légal.

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

## 8. Ce qu'on construit

- Application full-stack Next.js 15 (TypeScript + Tailwind + shadcn/ui).
- API routes Next.js (`app/api/*`) — pas de serveur séparé.
- Lecture de données JSON pour règlements, alertes et documents sources.
- Extraction de profil de projet par l'IA (Gemini 2.5 Flash via Vertex AI).
- Matching IA + déterministe entre profils et règlements.
- Snapshot réglementaire personnalisé par projet.
- Système d'alertes pour les changements récents pertinents.
- Mini RAG keyword-based sur fichiers `.txt` pour le chat.
- Frontend démontrable : page d'input, snapshot dashboard, vue détail règlement, chat.
- Support bilingue FR/EN basique.

### Ce qu'on ne construit pas

- Pas de serveur backend séparé.
- Pas de base de données réelle (JSON suffit).
- Pas d'authentification.
- Pas de scraping en direct des sites municipaux.
- Pas d'intégration CanLII automatisée.
- Pas d'OCR ni de PDF parsing.
- Pas de vector DB ni d'embeddings (RAG keyword-based suffit pour la démo).

---

## 9. Stack technique choisie

### Frontend + Backend (Next.js full-stack)

- Node.js 20+
- TypeScript
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- shadcn/ui
- lucide-react
- Zod

### IA

- Google Gemini 2.5 Flash.
- Accès via Vertex AI (Google Cloud)
- SDK : `@google/genai`
- Génération JSON structurée native.

## Données

- Fichiers JSON
- Fichiers `.txt`

## IA

- Google Gemini 2.5 Flash
- SDK : `@google/genai`

## RAG

- Recherche simple par mots-clés sur fichiers `.txt`
- Retour des top documents les plus pertinents
- Injection du contexte dans le prompt IA

---
