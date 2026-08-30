# Personal Portfolio v2 — Full Admin Control

Full-stack portfolio with a MongoDB backend and a password-protected admin
panel. Your **photo**, **resume**, **projects**, and **certificates** are
all stored in the database — you add, edit, or delete any of them straight
from the website itself. No more editing code or pushing to GitHub every
time you want to update something.

## What changed from the old version

The old portfolio stored projects in a static `data/projects.json` file
that you had to hand-edit and push to GitHub. This version stores
everything in MongoDB instead, with a real admin panel at `/admin.html`.

**Your 4 existing projects (Patient Scheduling, Task Manager, Blog
Platform, Data Analytics) are not automatically carried over** — you'll
re-add them once through the admin panel (2 minutes, and you'll never
need to touch code for it again). Keep your old project links handy.

## 1. MongoDB — reuse your existing cluster

You already have a MongoDB Atlas cluster from your other projects. Use
the same connection string, just pick a fresh database name so this
site's data doesn't mix with your other apps — e.g. add `/portfolio`
before the `?` in the URI.

## 2. Set up environment variables

Create a `.env` file in the project root (copy `.env.example`):

```
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=any-long-random-string
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=choose-a-strong-password
PORT=5000
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are **your** login for the `/admin.html`
page — there's no public sign-up, since this is your personal site and
only you should be able to edit it. Pick a real password, not something
guessable.

## 3. Run locally

```bash
npm install
npm start
```

Open **http://localhost:5000** for the public site, and
**http://localhost:5000/admin.html** to log in and manage everything.

## 4. Using the admin panel

Go to `/admin.html`, log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

- **Profile tab**: your name, role, bio, skills, email/GitHub/LinkedIn,
  photo, and resume. Upload a photo (JPG/PNG) and your resume (PDF), then
  **Save profile**.
- **Projects tab**: add/edit/delete projects. You can either paste an
  image URL or upload an image file for each project. Or click
  **"Import from GitHub"**, enter your GitHub username, and pick which
  public repos to add — this fills in the title, description, language,
  and link automatically so you don't have to retype anything. This is a
  one-time import (click it again anytime to pull your latest repos), not
  a live sync — GitHub's public API has no way to push changes to your
  site automatically without a more complex webhook setup.
- **Certificates tab**: add/edit/delete certificates. Upload an image
  (JPG/PNG screenshot) or a PDF for each one.

Every change appears on the public site (`index.html`) immediately —
no redeploy needed, since it's all read live from the database.

## 5. File size note

Uploaded photos, resumes, and certificates are limited to **4MB each**.
If a file is larger, compress it first (e.g. resize the image, or export
the PDF at a lower quality) — for a portfolio site, a few hundred KB per
image is already plenty sharp.

## 6. How it's built

- `backend/models/Profile.js` — a single document holding your info
- `backend/models/Project.js`, `backend/models/Certificate.js` — one
  document per item
- `backend/middleware/upload.js` — accepts uploaded files in memory and
  converts them to base64 data URIs, which are stored directly in
  MongoDB and used as-is by `<img src>` / `<a href>` on the frontend —
  no separate file storage service needed
- `backend/middleware/authMiddleware.js` — protects all write (POST/PUT/
  DELETE) routes; only requests with a valid admin JWT can change data
- `backend/routes/authRoutes.js` — single-admin login, checked against
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` in your environment (not a database —
  there's intentionally no public registration)
- `public/index.html` + `public/js/main.js` — the public site, fully
  populated from the API
- `public/admin.html` + `public/js/admin.js` — the admin panel

## 7. Deploy (Vercel)

1. Push to GitHub.
2. Import on vercel.com, set Root Directory if the folder is nested.
3. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`.
4. Deploy.

After deploying, go to `https://your-site.vercel.app/admin.html` and log
in to add your projects, certificates, photo, and resume.
