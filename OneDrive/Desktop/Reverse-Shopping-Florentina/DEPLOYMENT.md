# Deployment Guide - Render Hosting

Ky guide do të të ndihmojë të hostosh aplikacionin tënd në Render.

## 1. Përgatitja e Database (MongoDB Atlas)

1. Shko në [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Krijo një llogari të re
3. Krijo një cluster të ri (mund të përdorësh tier-in free)
4. Krijo një database user
5. Whitelist IP-në tënde (ose përdor 0.0.0.0/0 për të gjitha IP-të)
6. Kopjo connection string-un

## 2. Hostimi i Backend-ut në Render

### Hapat:

1. **Krijo një llogari në Render:**
   - Shko në [render.com](https://render.com)
   - Regjistrohu me GitHub

2. **Krijo një Web Service:**
   - Kliko "New +" → "Web Service"
   - Lidh repository-n tënde nga GitHub
   - Zgjidh branch-in main

3. **Konfiguro Web Service:**
   - **Name:** `recipe-api-backend` (ose çfarëdo emri të do)
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Shto Environment Variables:**
   - Kliko "Environment" tab
   - Shto këto variabla:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipeDB
     NODE_ENV=production
     CORS_ORIGIN=https://your-frontend-url.onrender.com
     ```

5. **Deploy:**
   - Kliko "Create Web Service"
   - Prit që build-i të përfundojë

## 3. Hostimi i Frontend-ut në Render

### Hapat:

1. **Krijo një Static Site:**
   - Kliko "New +" → "Static Site"
   - Lidh repository-n tënde nga GitHub

2. **Konfiguro Static Site:**
   - **Name:** `recipe-app-frontend`
   - **Build Command:** `npm install && npm run web:build`
   - **Publish Directory:** `dist`

3. **Shto Environment Variables:**
   ```
   NODE_ENV=production
   ```

4. **Deploy:**
   - Kliko "Create Static Site"

## 4. Përditëso Konfigurimin

Pasi të kesh URL-të e backend-ut dhe frontend-ut:

1. **Përditëso `app/config.ts`:**
   ```typescript
   production: {
     baseURL: 'https://your-backend-url.onrender.com',
   },
   ```

2. **Përditëso CORS_ORIGIN në backend:**
   - Shko në backend settings në Render
   - Përditëso CORS_ORIGIN me URL-n e frontend-ut

## 5. Testimi Lokal

Para se të deploy-osh, testo lokalisht:

1. **Testo Backend-in:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Testo API-n:**
   ```bash
   npm run test:api
   ```

3. **Testo Frontend-in:**
   ```bash
   npm run web
   ```

## 6. Testimi në Production

1. Shko në URL-n e frontend-ut
2. Testo funksionalitetet kryesore
3. Kontrollo nëse API calls po funksionojnë

## Troubleshooting

### Probleme të zakonshme:

1. **CORS Error:**
   - Kontrollo CORS_ORIGIN në backend
   - Sigurohu që URL-të të jenë të sakta

2. **MongoDB Connection Error:**
   - Kontrollo MONGODB_URI
   - Sigurohu që IP-ja të jetë whitelisted

3. **Build Error:**
   - Kontrollo package.json files
   - Sigurohu që të gjitha dependencies janë të shtuara

4. **Images not loading:**
   - Kontrollo nëse `copy-images.js` po ekzekutohet
   - Sigurohu që imazhet janë në `server/images/`

## Support

Nëse ke probleme, kontrollo:
- Render logs në dashboard
- Console logs në browser
- Network tab për API calls

## Hapat e Shpejtë për Deploy

1. **Push kodin në GitHub**
2. **Krijo MongoDB Atlas cluster**
3. **Deploy backend në Render** (Web Service)
4. **Deploy frontend në Render** (Static Site)
5. **Përditëso URL-të në config**
6. **Testo aplikacionin** 