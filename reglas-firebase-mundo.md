# Reglas de Firebase para Mundo

En Firebase > Firestore > Reglas, pega este bloque DENTRO de `match /databases/{database}/documents { ... }`
(por ejemplo, debajo del bloque de `recetas`). No borres nada de lo que ya tienes.

```
    match /mundo/{uid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['alias','avatar','nivel','titulo','xp','xpSem','sem','racha','d30','t'])
        && request.resource.data.alias is string
        && request.resource.data.alias.size() >= 3
        && request.resource.data.alias.size() <= 20;
      allow delete: if request.auth != null && request.auth.uid == uid;
    }
```

Qué hace: cualquier usuario con sesión puede leer el ranking; cada quien solo crea, edita o borra SU documento,
y solo puede guardar esos campos (no se puede colar correo, nombre real ni nada más).
