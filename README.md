# 🚀 DSA Tracker - Work Tracker

A comprehensive DSA (Data Structures & Algorithms) practice and revision tracking platform with spaced repetition, gamification, and analytics.

## ✨ Features

- 📝 **Question Management** - Track your DSA problems with tags, difficulty, and notes
- 🔁 **Spaced Repetition** - Smart revision engine using spaced repetition algorithm
- 🎮 **Gamification** - XP, levels, streaks, and badges to keep you motivated
- 📊 **Analytics** - Visualize your progress with interactive charts
- 🧠 **Growth Intel** - Insights on your learning patterns and weak areas
- 🏆 **Profile & Achievements** - Track milestones and earn badges
- ☁️ **Cloud Sync** - Firebase integration for data persistence
- 🎨 **Multiple Themes** - Dark and Obsidian themes

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dsa-tracker.git
cd dsa-tracker
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Firestore Database** and **Authentication**
4. Copy your Firebase configuration

5. **Option A: Using js/config.js (Current Setup)**
   ```bash
   # Copy the example config file
   cp js/config.example.js js/config.js
   ```

   Then edit `js/config.js` and add your Firebase credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "your_actual_api_key",
       authDomain: "your_project.firebaseapp.com",
       projectId: "your_project_id",
       storageBucket: "your_project.firebasestorage.app",
       messagingSenderId: "your_sender_id",
       appId: "your_app_id",
       measurementId: "your_measurement_id"
   };
   ```

6. **Option B: Using .env file (Alternative)**
   ```bash
   # Copy the example env file
   cp .env.example .env
   ```

   Then edit `.env` with your Firebase credentials:
   ```env
   FIREBASE_API_KEY=your_actual_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   **Note**: The current setup uses `js/config.js`. If you prefer `.env`, you'll need to modify the app to load environment variables.

### 3. Run the Application

Simply open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## 🔐 Security Note

⚠️ **IMPORTANT**: 
- Never commit `js/config.js` or `.env` to GitHub
- These files contain your sensitive Firebase credentials
- Both are already added to `.gitignore` for protection
- Only commit `.env.example` and `js/config.example.js` (templates with placeholders)

## 📁 Project Structure

```
dsa-tracker/
├── index.html              # Main HTML file
├── css/                    # Stylesheets
│   ├── variables.css       # CSS variables
│   ├── base.css            # Base styles
│   ├── layout.css          # Layout styles
│   ├── components.css      # UI components
│   ├── dashboard.css       # Dashboard specific
│   ├── views.css           # View specific styles
│   ├── responsive.css      # Responsive design
│   └── utilities.css       # Utility classes
├── js/                     # JavaScript modules
│   ├── config.js           # Firebase config (not committed)
│   ├── config.example.js   # Config template
│   ├── app.js              # Main app controller
│   ├── store.js            # Data storage & Firebase sync
│   ├── revision-engine.js  # Spaced repetition logic
│   ├── gamification.js     # XP, levels, badges
│   ├── charts.js           # Chart visualizations
│   └── notifications.js    # Notification system
├── cpp/                    # C++ backend (optional)
│   ├── src/                # C++ source files
│   ├── include/            # Header files
│   └── Makefile            # Build configuration
├── .gitignore              # Git ignore file
├── .env                    # Environment variables (not committed)
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🎯 Usage

1. **Add Questions** - Click "+ Quick Add" or navigate to "Add Question"
2. **Track Revisions** - View due revisions in the "Revisions" tab
3. **Complete Revisions** - Rate your recall quality (1-5)
4. **Monitor Progress** - Check Dashboard and Analytics for insights
5. **Earn Achievements** - Complete milestones to unlock badges

## 🔧 Configuration Options

Edit settings in the app or modify these in `js/store.js`:

- **Total Revision Cycles**: Number of revisions per question (default: 15)
- **Daily Revision Goal**: Target revisions per day (default: 5)
- **Base Intervals**: Spaced repetition intervals in days (customizable)

## 🌐 Deployment

### GitHub Pages
1. Push your code to GitHub (config.js will be ignored)
2. Go to Settings → Pages
3. Select branch and deploy

### Netlify/Vercel
1. Connect your repository
2. Add environment variables in the dashboard
3. Deploy

**Note**: For production, consider using environment variables through your hosting provider instead of committing config files.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💡 Tips

- Complete revisions on time to maintain your streak 🔥
- Use the "Important Note" field for key problem-solving insights
- Tag questions for easy filtering and searches
- Export your data regularly as backup

## 🐛 Issues

Found a bug? [Open an issue](https://github.com/yourusername/dsa-tracker/issues)

---

Built with ❤️ by Sachin Rao for DSA enthusiasts
