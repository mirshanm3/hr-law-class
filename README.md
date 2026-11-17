# Employment Law and Ethics in HRM: class site

A static site (slides, quiz, leaderboard, host screen) for GitHub Pages, with Firebase for the shared leaderboard.

## What is in the folder
- index.html: the page shell
- css/: styles (deck.css is the slide styling)
- js/data-slides.js: the 28 slides and speaker notes
- js/data-quiz.js: the 12 quiz questions (edit here to change the quiz)
- js/config.js: your Firebase settings (you fill this in)
- firestore.rules: security rules to paste into Firebase

## Part A. Create the Firebase project (about 10 minutes)
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**, name it (for example `mnu-hr-quiz`). You can turn Google Analytics off. Click Create.
3. In the left menu open **Build > Authentication**, click **Get started**, open **Sign-in method**, enable **Anonymous**, and save. Students use this to join without accounts.
4. (Optional, for the teacher reset button) In the same Sign-in method list, enable **Google**, choose a support email, and save.
5. Open **Build > Firestore Database**, click **Create database**, choose a location near the Maldives (for example `asia-south1`), and start in **production mode**.
6. Open the **Rules** tab, delete the existing text, and paste the contents of `firestore.rules`. Replace `YOUR_EMAIL@example.com` with your own Google email (the one you will use for the reset button). Click **Publish**.
7. Click the gear icon, then **Project settings**. Under **Your apps**, click the **</>** (Web) icon, give it a nickname, and register the app (skip Firebase Hosting).
8. Copy the `firebaseConfig` values it shows (apiKey, authDomain, projectId, appId) into `js/config.js`, replacing the PASTE_ placeholders. These values are not secrets; the rules protect your data.

## Part B. Put the site on GitHub Pages (about 10 minutes)
1. Create a free account at https://github.com if you do not have one.
2. Click **New repository**. Name it (for example `hr-law-class`), set it to **Public**, and create it.
3. Click **uploading an existing file**. Drag in everything from this folder: `index.html`, the `css` folder, the `js` folder, `firestore.rules` and this README. Make sure `js/config.js` has your Firebase values. Click **Commit changes**.
4. Open **Settings > Pages**. Under Build and deployment, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, and save.
5. Wait one to two minutes. Your site will be at `https://YOUR-USERNAME.github.io/hr-law-class/`.

## Part C. Authorise your domain in Firebase
1. In Firebase, open **Authentication > Settings > Authorized domains**.
2. Click **Add domain** and enter `YOUR-USERNAME.github.io`. Without this, sign-in will fail.

## Part D. Test before class
1. Open your site. The top bar should say **● live**. If it says "offline mode", re-check `js/config.js`.
2. Play the quiz once on your phone. Your score should appear on the leaderboard.
3. Open `https://YOUR-USERNAME.github.io/hr-law-class/#/host` on the projector. It shows a QR code and the live leaderboard.

## On the day
- Slides: `#/slides`. Arrow keys, space or tap to advance; tap the left quarter to go back; N shows speaker notes.
- Show the host screen (`#/host`), students scan the QR code, enter a nickname and play.
- Reset between groups: on the host screen click **Sign in and reset leaderboard** and sign in with the teacher email.

## Notes
- Scores are calculated in the student's browser, so a determined student could cheat. The rules cap scores and nicknames, but this is for classroom fun, not assessment.
- Free Firebase limits are far above a class of this size.
- To change questions, edit `js/data-quiz.js` (each item: question, four options, index of the correct answer, explanation).
- Teaching material, not legal advice. Check the current consolidated Employment Act text.
