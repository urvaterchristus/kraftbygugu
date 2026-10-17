# Kraftlog

Eine deutschsprachige, mobile Web-App für dein Krafttraining. Ohne Anmeldung, ohne Serverdatenbank und ohne Build-Schritt.

## Funktionen

- Trainings mit Datum, Uhrzeit, Ort und Dauer erfassen und bearbeiten.
- Eigene Übungen mit Bild oder Video (bis 30 MB je Datei) und optionalem Gerät anlegen.
- Eigene Geräte und Notizen verwalten.
- Routinen mit geordneter Übungsfolge und Satzvorgaben erstellen. Mit dem Pfeil nach oben lässt sich die Reihenfolge ändern.
- Eine Routine in ein neues Training kopieren. Die Satzwerte des Trainings lassen sich unabhängig von der Routine ändern.
- Beliebig viele Sätze je Übung mit Wiederholungen und optionalem Gewicht in kg.
- Lokale Speicherung einschließlich Medien in IndexedDB.
- JSON-Backup mit allen Daten und Medien exportieren und importieren. Ein Import ersetzt den aktuellen Datenbestand nach Rückfrage.
- Home-Bildschirm-Installation und Offline-Aufruf nach dem ersten vollständigen Online-Aufruf.

## Auf GitHub Pages veröffentlichen

1. Den Inhalt dieses Ordners in die Wurzel deines GitHub-Repositorys kopieren. `index.html` muss direkt dort liegen. Auch die Datei `.nojekyll` übernehmen.
2. Dateien committen und pushen.
3. Im Repository **Settings → Pages → Build and deployment → Source → Deploy from a branch** auswählen.
4. Den Branch mit den Dateien (beispielsweise `main`) und **/(root)** wählen, dann **Save**.
5. Nach der Bereitstellung die in GitHub Pages angezeigte HTTPS-Adresse öffnen.

Alternativ den Inhalt in `/docs` ablegen und `/docs` als Quelle wählen. Alle Pfade sind relativ und funktionieren auch unter einem Repository-Unterpfad.

Offizielle Anleitung: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Auf dem iPhone

Die veröffentlichte HTTPS-Adresse in Safari öffnen. Über **Teilen → Zum Home-Bildschirm** hinzufügen; anschließend über das neue Symbol starten. Menübezeichnungen können je nach iOS-Version variieren.

Nutze von Anfang an möglichst die Home-Bildschirm-App: Daten gehören zum jeweiligen Browser-/App-Speicher und werden nicht automatisch zwischen Browsern, Geräten oder URLs übertragen. Bei einem Wechsel ein Backup exportieren und am neuen Ort importieren.

## Daten und OneDrive

Trainings und Medien bleiben im lokalen Browser-Speicher. Es gibt keine automatische OneDrive-Synchronisation. Über **Backup exportieren** kannst du die JSON-Datei in der Dateien-App in OneDrive ablegen und später über **Backup importieren** wiederherstellen. Persönliche Backups nicht in das GitHub-Repository hochladen.

Browserdaten können durch Löschen der Website-Daten, Speicherbereinigung oder das Entfernen der App verloren gehen. Regelmäßige Backups sind deshalb sinnvoll. Die App-Version enthält keine Trainingsdaten; die Vorschau-Testdaten gehören nur zum lokalen Testbrowser.

## Lokal entwickeln

Im App-Ordner `python -m http.server 8765 --bind 127.0.0.1` ausführen und `http://127.0.0.1:8765` öffnen. Nicht durch Doppelklick auf die HTML-Datei starten: Service Worker und Installierbarkeit brauchen HTTP auf localhost oder HTTPS.

Bei Änderungen an den Offline-Dateien den Cache-Namen in `sw.js` erhöhen (etwa `kraftlog-v2`). Keine Abhängigkeiten, externen Schriftarten oder Analysedienste.

## Prüfung des ersten Stands

JavaScript-Syntax geprüft. Im Desktop-Browser wurden Gerät und Übung angelegt, eine Routine mit drei Sätzen gespeichert, ein Training daraus erstellt und nach Neuladen wieder aufgerufen. Ein Test auf einem echten iPhone steht noch aus.


## Update: kompakte Sets und Variationsbuttons

- Unter „Variationen für alle Sets“ steht immer zuerst die globale Auswahl **Ohne / Gewichtsweste / Gewichtsgürtel**. Bei Weste oder Gürtel ist die kg-Angabe pro Set erforderlich; ohne Zusatzgerät bleibt kg optional (z. B. für vorhandene Hantelgewichte).
- Zugewiesene Variationskategorien zeigen ihre Optionen als Buttons. „Keine Auswahl“ oder erneutes Antippen der aktiven Option hebt die Auswahl auf.
- Die Vorgabe gilt für alle Sets ohne eigene Abweichung. „Fertig · Einklappen“ lässt nur die kompakte Tabelle **Set | Kg | WDH | VAR** stehen. Zeitübungen zeigen **SEK**.
- **VAR** öffnet die Einstellungen für genau dieses Set. Ein Punkt kennzeichnet eigene Abweichungen. „Vorgabe der Übung übernehmen“ entfernt diese; die eingegebenen kg und Wiederholungen bleiben erhalten.
- Teilwiederholungen wie `5+2`, Sekundenübungen, Routinen und der lautlose EMOM-Timer bleiben verfügbar. Die Tonfunktion ist vollständig entfernt.
- Backups werden mit Version 3 exportiert. Bestehende Backups der Versionen 1 und 2 werden weiterhin akzeptiert.
- Vorhandene Daten in IndexedDB bleiben erhalten. Der Offline-Cache wurde aktualisiert; bei einer alten Ansicht die App mit Internetverbindung schließen und neu öffnen.

Regressionstests ohne zusätzliche Abhängigkeiten: `node tests/training.test.cjs`.
