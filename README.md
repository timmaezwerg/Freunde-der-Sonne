# Freunde der Sonne ☀️
> Mobile-First PWA für 8 Freunde: Spieltage, Live-Tabelle, geheime Joker & Wintergrillen-Ermittlung.

---

## 🚀 1. Supabase Backend einrichten (Dauer: ca. 2 Minuten)

1. Gehe auf [supabase.com](https://supabase.com) und erstelle ein neues Projekt (z. B. `freunde-der-sonne`).
2. Klicke links im Menü auf **SQL Editor** ➔ **New query**.
3. Öffne die Datei [supabase_schema.sql](./supabase_schema.sql), kopiere den gesamten Inhalt hinein und klicke auf **Run** (Ausführen).
   * Dadurch werden alle Tabellen (`members`, `events`, `history_seasons`), RLS-Rechte und Realtime-Abonnements angelegt und mit den echten 2026er-Ergebnissen befüllt.
4. Klicke links unten auf **Project Settings** ➔ **API** und kopiere:
   * **Project URL** (z. B. `https://xyz.supabase.co`)
   * **anon public Key** (z. B. `eyJhbGci...`)
5. Trage diese beiden Werte entweder in [js/supabase-config.js](./js/supabase-config.js) ein, oder gib sie in der App unter **Kader ➔ Daten & Verwaltung ➔ ☁️ Supabase Cloud-Verbindung** direkt ein!

---

## 🌐 2. Auf Vercel bereitstellen (Dauer: ca. 1 Minute)

### Option A: Über GitHub (Empfohlen)
1. Erstelle auf GitHub ein neues Repository (z. B. `freunde-der-sonne`).
2. Pushe diesen Ordner auf GitHub:
   ```bash
   git init
   git add .
   git commit -m "Freunde der Sonne PWA"
   git branch -M main
   git remote add origin https://github.com/DEIN_NUTZERNAME/freunde-der-sonne.git
   git push -u origin main
   ```
3. Gehe auf [vercel.com](https://vercel.com/new), wähle das Repository aus und klicke auf **Deploy**.
4. Fertig! Deine App ist sofort unter `https://freunde-der-sonne.vercel.app` mit weltweitem HTTPS erreichbar.

### Option B: Direktes Deployment
Du kannst das Projekt auch über die Vercel CLI oder direkt per Git-Import im Vercel Dashboard anlegen.

---

## 📱 Als App auf dem iPhone installieren
1. Öffne die Vercel-URL in **Safari** auf dem iPhone.
2. Tippe unten in der Leiste auf den **Teilen-Button** (Viereck mit Pfeil nach oben).
3. Scrolle etwas nach unten und tippe auf **„Zum Home-Bildschirm“**.
4. Die App startet nun wie eine echte native iOS-App im Vollbildmodus ohne Safari-Bedienelemente!
