# 🚀 DSA Tracker - Work Tracker

A comprehensive DSA (Data Structures & Algorithms) practice and revision tracking platform with spaced repetition, gamification, and analytics.

## ✨ Features

- 📝 **Question Management** - Track your DSA problems with tags, difficulty, and notes
- 🔁 **Spaced Repetition** - Smart revision engine using spaced repetition algorithm
- 🎮 **Gamification** - XP, levels, streaks, and badges to keep you motivated
- 📊 **Analytics** - Visualize your progress with interactive charts
- 🧠 **Growth Intel** - Insights on your learning patterns and weak areas
- 🏆 **Profile & Achievements** - Track milestones and earn badges
- 💾 **Local data and backups** - Keep progress in your browser and export or restore it as JSON
- 🎨 **Appearance** - Light and dark themes

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dsa-tracker.git
cd dsa-tracker
```

### 2. Run the Application

Serve the project folder locally:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open [Study Tracker on your computer](http://127.0.0.1:8000).

## Data and Backups

Study data is stored in the current browser and site address. Use **Settings → Export Data** to save a JSON backup. **Import Data** replaces the sections present in the file, so export a current backup before restoring an older one. Import a backup to move your progress to another browser or site address.

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
│   ├── app.js              # Main app controller
│   ├── store.js            # Browser-local data store
│   ├── practice-plan.js    # Bulk practice plans
│   ├── revision-engine.js  # Spaced repetition logic
│   ├── gamification.js     # XP, levels, badges
│   ├── charts.js           # Chart visualizations
│   └── notifications.js    # Notification system
├── cpp/                    # C++ backend (optional)
│   ├── src/                # C++ source files
│   ├── include/            # Header files
│   └── Makefile            # Build configuration
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## 🎯 Usage

Open **Practice Plan** and paste a list with one question per line. You can include a heading such as `Topic: Arrays`, a numbered list, links, or rows copied from a table. The plan schedules five questions per day. Use **Mark done**, **Mark revised**, or move an item to tomorrow. **Revisions → Practice Queue** shows scheduled and overdue work. Links are kept when they are present in the copied text or clipboard.

1. **Add Questions** - Click "+ Quick Add" or navigate to "Add Question"
2. **Track Revisions** - View due revisions in the "Revisions" tab
3. **Complete Revisions** - Rate your recall quality (1-5)
4. **Monitor Progress** - Check Dashboard and Analytics for insights
5. **Earn Achievements** - Complete milestones to unlock badges

## 🔧 Configuration Options

Edit settings in the app or modify these in `js/store.js`:

- **Total Revision Cycles**: Number of revisions per question (default: 15)
- **Daily review goal** measures reviews completed today against your target. The default is five reviews. Practiced questions are counted separately.
- **Base Intervals**: Spaced repetition intervals in days (customizable)

The app serves Chart.js 4.5.1 and the Latin Inter and Manrope fonts from local files. Their licenses are included in `js/vendor/` and `assets/fonts/`.

## 🌐 Deployment

### GitHub Pages
1. Go to Settings → Pages
2. Select branch and deploy

### Netlify/Vercel
1. Connect your repository
2. Deploy the static files


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
