# Reprise de Tempo

PWA générique de simulation hebdomadaire, sans framework. Sources dans dist/.
Tous les fichiers doivent rester sous 400 lignes. Attendre le « go » de Jérémy avant de coder.

## État

✅ Paramètres locaux, équilibre selon ordre de préférences, limites, cadenas.
✅ Collage direct, distinction réel/simulation, statistiques et sauvegarde JSON.
✅ Réel à l’intérieur du rectangle objectif, dépassement visible au-dessus.
✅ Habitudes sur 7 jours calendaires terminant au dernier badgeage importé ; valeurs manquantes vides.
✅ Import historique avec aperçu, fusion par journée et transaction atomique.
✅ Jauge du reste hebdomadaire réel, intervalle ouvert compté jusqu’à maintenant uniquement aujourd’hui.
✅ Workflow GitHub Pages, tests sans dépendances.

L’import d’une semaine depuis l’accueil reste indépendant et remplace cette semaine.
L’import historique remplace uniquement les journées indiquées et conserve les autres.
Les objectifs déjà enregistrés sont conservés. Aucun badgeage personnel fourni dans le dépôt.
La jauge utilise la semaine calendaire actuelle, indépendamment de la semaine simulée affichée.
Aucun report de solde d’une semaine à l’autre, congé, jour férié ou arrondi RH.

## Validation et limites

Lancer npm test. Installation sur téléphone et démarrage hors ligne à vérifier sur l’appareil cible.
L’historique d’un autre domaine ne migre pas automatiquement : exporter la sauvegarde JSON depuis l’ancien site puis l’importer dans la nouvelle adresse.
Cette archive ne publie pas les modifications sur le Site ChatGPT existant.

## Prompt de reprise

« Lis README.md et CONTINUITE/00_LIRE_EN_PREMIER.md, examine les modules concernés,
explique brièvement ta compréhension et attends mon go avant toute nouvelle modification. »
