# Study Tracker setup

Study Tracker is a static web app. Serve the project folder from a local web server or deploy it to static hosting.

## Run locally

From the project folder, run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [Study Tracker on your computer](http://127.0.0.1:8000). Use the same browser profile and address each time so the app can find your saved progress.

## Deploy

Publish the project folder as a static site with `index.html` as its entry point. GitHub Pages can serve it directly from the repository root.

## Move or restore your progress

1. Open **Settings** and choose **Export Data**.
2. Keep the downloaded JSON file somewhere you can find it.
3. On the destination browser or site, choose **Import Data** and select the backup.

Import replaces the sections included in the backup. Reset clears the tracker’s study data for the current browser and site. Browser data clearing and private browsing can also remove progress.

## Existing Firebase deployments

The app no longer connects to the legacy shared Firebase database. Study data already saved in your browser is still available at its original address. If a previous deployment kept records exclusively in Firestore, have its owner recover the appropriate records separately. A browser reset only applies to the browser copy.
