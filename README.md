# JeremySomsouk.github.io

Le site existant est publié par GitHub Pages depuis `docs/`.

## La cabane à découvertes

Le menu se trouve à `/cabane/`, avec deux activités indépendantes :

- `/cabane/memory/` : moteur Rust compilé en WebAssembly, interface HTML/CSS et SVG locaux. Une partie contient trois grilles de 3, 4 et 5 paires, tirées au hasard. Rejouer ou recommencer repart à 3 paires. Aucune progression sauvegardée.
- `/cabane/lecture/` : choix du texte, texte agrandissable, chronomètre sous le texte, historique daté. L'atelier utilise les API natives du navigateur en JavaScript, sans dépendre du module WASM du Memory.

Les pages n'utilisent ni serveur applicatif, ni ressources tierces, ni bibliothèque JavaScript. Les illustrations SVG et les trois poèmes de démonstration ont été créés pour ce prototype. Aucun enregistrement audio n'est réalisé.

### Prévisualiser

```sh
python3 -m http.server 8765 --directory docs
```

Ouvrir `http://localhost:8765/cabane/`. Utiliser un serveur HTTP, pas une ouverture directe en `file://`. Ce serveur ne rend pas le CV Jekyll à la racine, mais permet de tester les activités.

### Compiler le Memory

Le binaire `docs/cabane/memory/game.wasm` est inclus pour permettre la publication habituelle de `docs/` sans changer le déploiement Jekyll. Après toute modification du moteur, régénérer ce fichier et le versionner avec les sources.

```sh
rustup toolchain install 1.96.0 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
bash scripts/build-games.sh
```

La version Rust est fixée dans le script pour que la compilation utilise la même chaîne, même si un autre Rust est installé via Homebrew.

### Vérifier

```sh
rustup run 1.96.0 cargo test --manifest-path games/memory/Cargo.toml
rustup run 1.96.0 cargo clippy --manifest-path games/memory/Cargo.toml --all-targets -- -D warnings
node --test scripts/reading*.test.mjs
```

### Ajouter les textes de lecture

Modifier `docs/cabane/lecture/texts.json`. Chaque entrée contient `id`, `title`, `author` et `body` ; `\n` sépare les vers, `\n\n` les strophes. Le contenu est affiché comme du texte, sans interpréter de HTML.

Utiliser un identifiant unique et stable. Si le texte change sensiblement, créer un nouvel identifiant (par exemple `mon-texte-v2`) pour distinguer les versions dans les données enregistrées.

Le chronomètre mesure toute la durée entre Démarrer et Terminer, sans possibilité de pause. Le changement de texte est désactivé pendant la lecture. Terminer ajoute le titre, l'identifiant du texte, la date et la durée à `localStorage` sous `cabane.readings.v1`. Les temps sont partagés entre les utilisateurs du même navigateur ; ils ne sont pas synchronisés entre appareils. L'effacement des données du navigateur les supprime. Si la sauvegarde échoue, l'interface le signale et conserve le temps sur la page.

### Programmer le texte par défaut

Modifier `docs/cabane/lecture/schedule.json`, puis publier le site normalement. Aucune compilation Rust n'est nécessaire.

```json
{
  "defaultTextId": "petit-matin-v1",
  "entries": [
    { "from": "2026-09-14", "textId": "bateau-v1" },
    { "from": "2026-09-21", "textId": "jardin-v1" }
  ]
}
```

`from` est une date incluse au format `AAAA-MM-JJ`. `textId` correspond à l'identifiant dans `texts.json`. Le texte de la date la plus récente déjà atteinte reste sélectionné jusqu'au prochain changement prévu. Avant la première date, `defaultTextId` s'applique. Les dates doivent être uniques ; l'ordre des entrées est libre.

Le choix est calculé à chaque ouverture ou rechargement selon la date locale de l'appareil. Il reste possible de choisir un autre texte dans la liste. Une erreur dans le planning laisse les textes accessibles et affiche un message. Le planning inclus est un exemple à remplacer par les devoirs réels.

### Ajouter une activité

Créer un sous-dossier de `docs/cabane/` avec son `index.html`, puis ajouter sa carte au menu `docs/cabane/index.html`. Utiliser des chemins relatifs pour les ressources et `../` pour le retour au menu.
