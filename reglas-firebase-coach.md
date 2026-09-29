# Reglas de Firebase para rutinas y videos de coach

Pon el correo real de cada coach en **dos lugares**:
1. `index.html` → `COACHES` → campo `email` (Diego y Christian).
2. Las reglas de abajo (lista `coaches`).

## Firestore (Firebase → Firestore → Reglas) — agrega dentro de `match /databases/{database}/documents { … }`

```
function esCoach() {
  return request.auth != null &&
    request.auth.token.email in ['christian.rojas.gerente.r9@gmail.com', 'dgarfiasg23@gmail.com'];
}
match /coachRutinas/{id} {
  allow read: if request.auth != null;
  allow write: if esCoach();
}
match /recetas/{id} {
  allow read: if request.auth != null;
  allow write: if esCoach();
}
match /coachVideos/{id} {
  allow read: if request.auth != null;
  allow write: if esCoach();
}
```

## Storage (Firebase → Storage → Reglas)

Storage requiere el plan **Blaze** (pago por uso; tiene capa gratis de 5 GB). Si no lo activas, Diego igual puede pegar enlaces de YouTube (no listado) o Google Drive.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos-coach/{uid}/{archivo} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.auth.token.email in ['christian.rojas.gerente.r9@gmail.com', 'dgarfiasg23@gmail.com']
        && request.resource.size < 300 * 1024 * 1024
        && request.resource.contentType.matches('video/.*');
    }
  }
}
```

## Archivos a subir a GitHub
- `index.html`
- `forja-coach.js` (nuevo)
- `sw.js` (v121)
