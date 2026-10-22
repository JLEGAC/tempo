# Tempo — Ma semaine

PWA de simulation de temps de travail. Version portable prête à déposer sur GitHub et à publier avec GitHub Pages. Aucun serveur ni dépendance externe nécessaire.

## Utilisation

Copier le tableau de présence de votre portail de pointage puis cliquer sur **Coller mes badgeages**. Le tableau est importé directement, sans connexion au portail. Si aucun horaire n’est reconnu, un lien configurable permet d’ouvrir les résultats de présence dans un nouvel onglet. En cas de refus de lecture du presse-papiers, une zone de collage manuel est proposée.

Chaque collage commence une simulation indépendante. Les badgeages importés restent fixes ; les autres heures sont modifiables. Les horaires simulés restent en mémoire uniquement. Les badgeages réels importés et les réglages sont conservés localement dans IndexedDB et exportables en JSON versionné.

## Équilibrage

Trois leviers classables par priorité avec les boutons ↑/↓ : départs, pauses, arrivées. L’ordre par défaut est départs, pauses, arrivées. Le moteur répartit les ajustements à la minute entre les jours futurs et utilise la priorité suivante si nécessaire. Les données réelles, les cadenas et les horaires déjà passés ne sont pas déplacés. Les journées passées incomplètes bloquent le calcul pour éviter de les prendre pour du réel.

Les bornes par défaut sont : arrivée avant ou à 09:00, déjeuner entre 12:00 et 14:00, départ de 16:00 à 18:00, pause minimale de 30 minutes. Toutes ces valeurs sont configurables, y compris une pause minimale de zéro. La borne matinale 00:00 signifie aucune limite supplémentaire : renseigner l’heure d’ouverture réelle si nécessaire. Les limites de confort (départ maximal et pause maximale) restreignent encore l’équilibrage.

Le calcul modifie directement la simulation. Aucune explication détaillée des changements ni notification de nouvelle version n’est ajoutée. Le dernier équilibrage peut être annulé jusqu’à la prochaine modification, au prochain collage ou à une modification des paramètres. Une impossibilité n’applique aucun changement.

## Affichage

Durée du déjeuner, effectif et cumul prévisionnel par journée, badgeages manquants sur les jours passés, compteur du temps restant aujourd’hui. Bouton de thème sur l’accueil. Palette sombre : fond #212830, cartes #26292B, sans nom ni logo d’entreprise.

## Architecture

- `dist/app.mjs` : orchestration, navigation, état de la simulation et compteur.
- `dist/domain/time.mjs` : temps, dates et cumuls.
- `dist/domain/settings.mjs` : schéma, migrations, plages et validation.
- `dist/domain/balance.mjs` : moteur indépendant d’équilibrage.
- `dist/views/table.mjs` : tableau et champs horaires.
- `dist/views/settings.mjs` : paramètres et import/export des réglages.
- `dist/services/import.mjs` : parcours de collage et aide au portail de pointage.
- `dist/parser.mjs` : lecture du HTML et du texte multiligne.
- `dist/storage.mjs` : stockage IndexedDB.
- `dist/styles/` : base, mise en page et thèmes.
- `dist/sw.js` : cache hors connexion des seuls fichiers applicatifs.

HTML, CSS et modules JavaScript natifs. Aucun framework ni serveur applicatif requis. Chemins relatifs pour un futur hébergement sous un sous-dossier. Sources lisibles de moins de 400 lignes, avec contrôle automatique.

## Vérification locale

Depuis la racine du projet :

- `node tests/domain.test.mjs`
- `node scripts/check-lines.mjs`

Les tests utilisent des horaires fictifs et couvrent les modes, les plages, la pause minimale, les cadenas, les données réelles, les limites, les migrations et l’import. L’interface, le lien d’aide, l’import multiligne, l’équilibrage avec pause prolongée, l’annulation et l’enregistrement des paramètres ont été vérifiés dans le navigateur.

Installation et démarrage hors connexion sur le téléphone de l’utilisateur restent à vérifier. Les règles RH et les arrondis spécifiques au portail de pointage ne sont pas reproduits. L’ancienne note de flexibilité ne définit pas les réglages actuels : ils sont paramétrables.

Bouton « Si je pars maintenant » désactivé avant la reprise ou lorsqu’aucun départ simulé ne peut être remplacé. Onglets avec émoticônes. Libellés des préférences explicites, avec indication du sens inverse lorsqu’il manque des heures. Sélection des jours supprimée ; seuls les pointages réels, les horaires passés et les cadenas limitent les horaires modifiables.

## Statistiques et sauvegarde complète

L’onglet Statistiques contient uniquement les trois graphiques demandés : heures réelles par semaine et objectif associé, détail par jour d’une semaine, évolution quotidienne des arrivées, départs et déjeuners sur 7 jours. Il n’y a pas de tableau d’historique séparé. Les points et barres présentent leurs valeurs au survol et au focus clavier.

Une semaine est complète lorsque les cinq jours possèdent quatre badgeages réels ordonnés. Pour une semaine incomplète, seuls les intervalles comportant les deux badgeages sont comptés ; les habitudes affichent chaque indicateur disponible, y compris pour les journées incomplètes. Les simulations ne sont jamais écrites dans l’historique. Un nouvel import d’une même semaine remplace ses badgeages, conserve son objectif initial, et ne crée pas de doublon. Les anciens collages non persistés par les versions précédentes ne peuvent pas être récupérés.

La sauvegarde JSON contient les réglages et les semaines. La restauration valide tout le fichier avant d’écrire, remplace les semaines de mêmes dates et conserve les autres. Écriture des réglages et semaines dans une transaction IndexedDB unique. Compatibilité des anciens exports de réglages et migration des schémas 1 et 2 vers le schéma 3 avec ordre de préférence.

Modules ajoutés : `domain/history.mjs`, `views/statistics.mjs`, `views/charts.mjs` et `services/backup.mjs`. Graphiques SVG natifs, sans dépendance réseau. Vérification : `node tests/history.test.mjs` en complément des tests métier et du contrôle de lignes.

## Installation sur GitHub

1. Décompresser le ZIP et placer **tout son contenu à la racine du dépôt**, y compris `.github/`.
2. Utiliser la branche `main` (ou adapter le workflow).
3. Dans **Settings → Pages → Build and deployment**, choisir **GitHub Actions**.
4. Le workflow vérifie le projet puis publie le contenu de `dist/`. Aucun build requis.

Pour tester localement : `python -m http.server 8000 --directory dist`, puis ouvrir http://localhost:8000.
Pour les vérifications : `npm test` avec Node 22 ou supérieur ; aucune installation npm nécessaire.

## Nouveautés de cette archive

- Jauge de la semaine actuelle : objectif moins le réel, avec intervalle ouvert jusqu’à maintenant. Données issues du dernier collage uniquement.
- Rectangle objectif contenant le réel, dépassement visible.
- Habitudes sur 7 jours calendaires jusqu’au dernier badgeage importé, avec données partielles et trous conservés.
- Import historique depuis Excel TSV ou tableau Markdown, dates JJ/MM/AA ou JJ/MM/AAAA. Aperçu avant enregistrement, objectif configurable des nouvelles semaines. Les dates existantes sont remplacées, les autres journées conservées. Les horaires réels hors limites ne sont pas corrigés.

## Transférer les données

Exporter la sauvegarde complète dans les paramètres du Site actuel, puis l’importer sur la nouvelle adresse GitHub Pages. Les données locales ne suivent pas automatiquement un changement d’adresse. Le ZIP contient le code et des tests fictifs, sans historique personnel ni identifiants.
