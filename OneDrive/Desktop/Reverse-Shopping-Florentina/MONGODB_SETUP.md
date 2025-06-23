# MongoDB Atlas Setup Guide

## Hapat për të krijuar MongoDB Atlas:

### 1. Krijo llogari
- Shko në [MongoDB Atlas](https://www.mongodb.com/atlas)
- Kliko "Try Free" ose "Sign Up"
- Regjistrohu me email ose Google

### 2. Krijo Cluster
- Zgjidh "FREE" tier (M0)
- Zgjidh cloud provider (AWS/Google Cloud/Azure)
- Zgjidh region (më afër vendit tënd)
- Kliko "Create"

### 3. Konfiguro Database Access
- Shko në "Database Access" në menu
- Kliko "Add New Database User"
- Username: `recipe_user` (ose çfarëdo emri)
- Password: Krijo një fjalëkalim të fortë
- Role: "Read and write to any database"
- Kliko "Add User"

### 4. Konfiguro Network Access
- Shko në "Network Access" në menu
- Kliko "Add IP Address"
- Kliko "Allow Access from Anywhere" (0.0.0.0/0)
- Kliko "Confirm"

### 5. Kopjo Connection String
- Shko në "Database" në menu
- Kliko "Connect"
- Zgjidh "Connect your application"
- Kopjo connection string-un
- Zëvendëso `<password>` me fjalëkalimin që krijove
- Zëvendëso `<dbname>` me `recipeDB`

### Shembull Connection String:
```
mongodb+srv://recipe_user:yourpassword@cluster0.xxxxx.mongodb.net/recipeDB
```

### 6. Testo Connection
- Ruaj connection string-un - do ta përdorësh në Render 