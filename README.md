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
- Teilwiederholungen wie `5+2`, Sekundenübungen, Routinen und die nachträgliche EMOM-Erfassung bleiben verfügbar. Ton und Timer sind vollständig entfernt.
- Backups werden mit Version 3 exportiert. Bestehende Backups der Versionen 1 und 2 werden weiterhin akzeptiert.
- Vorhandene Daten in IndexedDB bleiben erhalten. Der Offline-Cache wurde aktualisiert; bei einer alten Ansicht die App mit Internetverbindung schließen und neu öffnen.

Regressionstests ohne zusätzliche Abhängigkeiten: `node tests/training.test.cjs`.


## iPhone 15 Pro und echte Sicherungsdateien

Die mobile Ansicht ist für 393 × 852 CSS-Pixel (iPhone 15 Pro bei Standarddarstellung) ausgelegt. Datum und Uhrzeit stehen auf schmalen Displays untereinander. Die Formulare berücksichtigen Safari-Eingabefelder, Safe Areas, Touchgrößen und Bildschirmhöhe. Die EMOM-Methode erfasst weiterhin Dauer und Sets, enthält aber keinen Timer und keine Start-/Pause-Bedienung mehr.

**In Dateien sichern** erzeugt eine vollständige JSON-Datei mit allen Trainings, Routinen, Übungen, Variationen und Medien. Wenn das Teilen von Dateien unterstützt wird, öffnet der Button die systemeigene Teilen-Funktion. Auf dem iPhone dort „In Dateien sichern“ und den gewünschten Ordner unter „Auf meinem iPhone“ wählen. Alternativ kann die Datei heruntergeladen und in der Dateien-App verschoben werden.

Die App kann weder den gewählten Speicherort noch das tatsächliche Ablegen einer geteilten Datei prüfen. Deshalb bestätigt sie nur die Übergabe oder den gestarteten Download. Der Browser bleibt die Arbeitskopie; nach Änderungen muss die Sicherungsdatei erneut gespeichert werden. Eine vorhandene Sicherung bleibt unabhängig von gelöschten Browserdaten erhalten. Über „Sicherung öffnen“ lässt sie sich wieder importieren. Es gibt keine automatische Ordnersynchronisation und keinen automatischen Dateizugriff im Hintergrund auf iOS.

Dateisicherungstests: `node tests/backup.test.cjs`.


## GuGu · Version 8

Schwarze Oberfläche mit blauen Trainingstagen im Kalender des aktuellen Monats. Die Kennzahlen zählen die Einträge und Trainingsminuten dieses Monats. Mehrere Trainings am gleichen Tag zählen als mehrere Trainings, erzeugen aber nur einen Kalenderkreis.

Der Rhythmus-Smiley erscheint erst nach fünf vollständig vergangenen Monatstagen (ab Tag 6). Mit `vergangene Tage = heutiger Tag - 1` gilt: glücklich bei Trainings >= vergangene Tage / 1,5, neutral bei >= vergangene Tage / 2, sonst traurig. Die angegebenen Formeln sind maßgeblich; die Monatswerte enthalten alle auf diesen Monat datierten Trainingseinträge. Der Kalender aktualisiert sich bei Rückkehr zur App und während sie geöffnet ist.

Trainingskarten zeigen Datum/Uhrzeit, Namen, Ort, Dauer, Methode und alle Übungen mit WDH-Summe einschließlich Teilwiederholungen. Zeitübungen zeigen die Sekundensumme. Pausen können nach der ersten Übung am Ende hinzugefügt und mit einer Dauer in Minuten gespeichert werden. Hinzufügen von Übungen und Pausen ist immer unter der aktuellen Folge möglich, auch in Routinen. Pausen zählen bei EMOM nicht als zusätzliche Übung.

Dateisicherung bleibt über „Dateien sichern“ erreichbar. Import und alternativer Download befinden sich oben im Menü „⋯“. Backups verwenden Version 4 für Pauseneinträge; Versionen 1–3 bleiben lesbar. Die bisherigen lokalen Datenbanknamen und vorhandenen Trainings bleiben unverändert.

Prüfen: `node tests/dashboard.test.cjs`, `node tests/training.test.cjs`, `node tests/backup.test.cjs`.
