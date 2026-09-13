# Arthaus

Arthaus is a student-only auction web application where registered users can browse, bid on, create, and manage listings using virtual credits. The project is built with TypeScript and Tailwind CSS, and uses the Noroff Auction API v2 for authentication, profile data, listings, and bidding.

## Project overview

This project was created as a Semester Project 2 assignment. It focuses on an online art auction experience with a clean, responsive interface for both visitors and registered students.

### Core goals

- Let visitors browse active listings without logging in.
- Require a Noroff student email for registration and authentication.
- Allow logged-in users to create and manage listings.
- Let users place bids using virtual credits.
- Provide profile management for bio, avatar, banner, and credit overview.

## Features

### All users

- Browse active listings.
- Search listings by title or publisher.
- Filter listings by category.
- View single listing details and bid history.

### Registered users

- Register with an email ending in `@stud.noroff.no`.
- Log in and log out securely.
- View and manage profile information.
- Update bio, avatar, and banner image.
- See current credit balance.
- Create, edit, and delete listings.
- Place bids on other users' listings.
- View personal listings and bid history.

### Restrictions

- Visitors cannot register with non-student emails.
- Visitors cannot create listings or place bids.
- Visitors cannot access the personal profile management flow.

## Tech stack

- TypeScript
- Tailwind CSS
- Vite
- Noroff Auction API v2
- Static HTML pages with DOM-based interactivity

## Project links

- GitHub repository: https://github.com/malintheier/semester-project-2
- Live demo: https://semester-project-2-dxaqtd9ip-malintheier.vercel.app/

## Local development

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Project structure

```text
semester-project-2/
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── pages/
│   ├── scripts/
│   └── styles/
├── package.json
├── README.md
└── vite.config.*
```

## Notes

This project follows the assignment brief by using a vanilla TypeScript approach without React or other front-end frameworks. Styling is handled through Tailwind CSS and layout is designed to be responsive across desktop and mobile devices.
