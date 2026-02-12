# 🎨 Quick CSS Reference Guide

## Modern Features CSS Classes

### Timer Widget
```html
<div class="timer-widget">
    <div class="timer-display">00:00:00</div>
    <div class="timer-controls">
        <button class="timer-btn">▶</button>
    </div>
</div>
```

### Company Tags
```html
<div class="company-tags">
    <span class="company-tag google">Google</span>
    <span class="company-tag meta">Meta</span>
    <span class="company-tag amazon">Amazon</span>
    <span class="company-tag microsoft">Microsoft</span>
    <span class="company-tag apple">Apple</span>
    <span class="company-tag netflix">Netflix</span>
</div>
```

### Topic Tags
```html
<div class="topic-tags">
    <Span class="topic-tag">Array</span>
    <span class="topic-tag">Dynamic Programming</span>
    <span class="topic-tag">Graph</span>
</div>
```

### Progress Bars
```html
<div class="progress-item">
    <div class="progress-header">
        <div class="progress-label">Arrays</div>
        <div class="progress-value">15/20 • 75%</div>
    </div>
    <div class="progress-bar-container">
        <div class="progress-bar-fill easy" style="width: 75%"></div>
    </div>
</div>
```

**Progress Bar Types:**
- `.progress-bar-fill.easy` - Green gradient
- `.progress-bar-fill.medium` - Orange gradient
- `.progress-bar-fill.hard` - Red gradient

### Difficulty Distribution
```html
<div class="difficulty-distribution">
    <div class="diff-stat easy">
        <div class="diff-stat-value">50</div>
        <div class="diff-stat-label">Easy</div>
    </div>
    <div class="diff-stat medium">
        <div class="diff-stat-value">30</div>
        <div class="diff-stat-label">Medium</div>
    </div>
    <div class="diff-stat hard">
        <div class="diff-stat-value">20</div>
        <div class="diff-stat-label">Hard</div>
    </div>
</div>
```

### Study Planner Calendar
```html
<div class="study-planner">
    <div class="calendar-header">
        <button class="calendar-nav-btn">◀</button>
        <div class="calendar-month">January 2026</div>
        <button class="calendar-nav-btn">▶</button>
    </div>
    <div class="calendar-grid">
        <div class="calendar-day-header">Sun</div>
        <!-- ... -->
        <div class="calendar-day today has-task">15</div>
    </div>
</div>
```

**Calendar Day States:**
- `.calendar-day` - Default day
- `.calendar-day.today` - Current day (highlighted)
- `.calendar-day.has-task` - Day with tasks (dot indicator)
- `.calendar-day.disabled` - Days outside current month

### Goal Tracker
```html
<div class="goal-tracker">
    <div class="goal-header">
        <div class="goal-title">Weekly Target</div>
        <div class="goal-status">7 / 10 problems</div>
    </div>
    <div class="goal-progress-ring">
        <svg viewBox="0 0 100 100">
            <!-- SVG circles -->
        </svg>
        <div class="goal-percentage">70%</div>
    </div>
</div>
```

### Code Snippet
```html
<div class="code-snippet">
    <div class="code-header">
        <span class="code-language">Python</span>
        <button class="code-copy-btn">Copy Code</button>
    </div>
    <pre class="code-content">def solution(nums):
    return sum(nums)</pre>
</div>
```

### Problem Links
```html
<div class="problem-links">
    <a href="#" class="problem-link">
        <span class="problem-link-icon">🔗</span>
        LeetCode
    </a>
    <a href="#" class="problem-link">
        <span class="problem-link-icon">📝</span>
        Editorial
    </a>
</div>
```

### Skeleton Loaders
```html
<div class="skeleton skeleton-card"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text short"></div>
<div class="skeleton skeleton-circle"></div>
```

### Tooltips
```html
<button data-tooltip="Click to start timer">
    Start Timer
</button>
```

### Badge Pills
```html
<span class="badge-pill new">New</span>
<span class="badge-pill hot">Hot</span>
<span class="badge-pill trending">Trending</span>
```

### Loading Spinner
```html
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
```

---

## Utility Classes Reference

### Spacing
```css
/* Margin */
.mt-1, .mt-2, .mt-3  /* margin-top */
.mb-1, .mb-2, .mb-3  /* margin-bottom */
.m-auto, .mx-auto    /* margin auto */

/* Padding */
.p-1, .p-2, .p-3, .p-4  /* all padding */
.px-1, .px-2            /* horizontal padding */
.py-1, .py-2            /* vertical padding */
```

### Typography
```css
/* Alignment */
.text-left, .text-center, .text-right

/* Weight */
.font-normal, .font-medium, .font-semibold, .font-bold

/* Size */
.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl

/* Color */
.text-accent, .text-success, .text-warning, .text-danger, .text-muted
```

### Layout
```css
/* Display */
.block, .inline-block, .inline, .flex, .inline-flex, .grid, .hidden

/* Flex */
.flex-row, .flex-col, .flex-wrap
.flex-center, .flex-between
.justify-start, .justify-end, .justify-center, .justify-between
.items-start, .items-end, .items-center, .items-stretch
.gap-1, .gap-2
```

### Sizing
```css
.w-full, .w-auto, .max-w-full
```

### Styling
```css
/* Borders */
.border, .border-t, .border-b, .border-l, .border-r, .border-none
.rounded, .rounded-md, .rounded-lg, .rounded-xl, .rounded-full

/* Shadows */
.shadow-sm, .shadow-md, .shadow-lg, .shadow-none

/* Background */
.bg-success-soft, .bg-warning-soft, .bg-danger-soft

/* Opacity */
.opacity-0, .opacity-50, .opacity-75, .opacity-100
```

### Interactive
```css
/* Cursor */
.cursor-pointer, .cursor-not-allowed, .cursor-default

/* Hover Effects */
.hover-lift      /* Lifts element on hover */
.hover-glow      /* Adds glow on hover */
.hover-scale     /* Scales element on hover */

/* Transitions */
.transition, .transition-smooth, .transition-none
```

### Text Utilities
```css
.truncate           /* Single line ellipsis */
.line-clamp-2       /* 2 line clamp */
.line-clamp-3       /* 3 line clamp */
.select-none        /* Disable text selection */
```

### Position & Z-Index
```css
.relative, .absolute, .fixed, .sticky
.z-0, .z-10, .z-20, .z-30, .z-40, .z-50
```

### Overflow
```css
.overflow-hidden, .overflow-auto, .overflow-scroll
```

### Animation
```css
.animate-in  /* Fade in up animation */
```

---

## Color Variables Reference

### Primary Colors
```css
--accent: #7c6aff              /* Main accent color */
--text-primary: #f0f0f0        /* Main text */
--text-secondary: #a0a0a0      /* Secondary text */
--text-muted: #606060          /* Muted text */
```

### Status Colors
```css
--success: #38d9a9
--warning: #f6ad55
--danger: #ff6b6b
--info: #63b3ed
```

### Timer Colors
```css
--timer-active: #38d9a9
--timer-paused: #f6ad55
--timer-stopped: #ff6b6b
```

### Company Colors
```css
--tag-google: #4285f4
--tag-meta: #0668e1
--tag-amazon: #ff9900
--tag-microsoft: #00a4ef
--tag-apple: #555555
--tag-netflix: #e50914
```

### Progress Colors
```css
--progress-easy: #38d9a9
--progress-medium: #f6ad55
--progress-hard: #ff6b6b
```

---

## Animation Reference

### Available Animations
```css
@keyframes fadeInUp       /* Fade in from bottom */
@keyframes fadeInDown     /* Fade in from top */
@keyframes fadeInScale    /* Fade in with scale */
@keyframes slideInLeft    /* Slide from left */
@keyframes slideInRight   /* Slide from right */
@keyframes bounceIn       /* Bounce entrance */
@keyframes slideUp        /* Slide up */
@keyframes slideDown      /* Slide down */
@keyframes zoomIn         /* Zoom in */
@keyframes shakeX         /* Horizontal shake */
@keyframes heartbeat      /* Pulsing scale */
@keyframes glow           /* Glowing effect */
@keyframes shimmer        /* Shimmer/shine */
@keyframes pulse          /* Gentle pulse */
@keyframes float          /* Floating effect */
@keyframes gradientShift  /* Animated gradient */
@keyframes spin           /* 360° rotation */
```

### Using Animations
```css
.element {
    animation: fadeInUp 0.5s ease-out both;
    animation-delay: 0.2s;
}
```

---

## Responsive Breakpoints

```css
/* Large Desktop */
@media (min-width: 1600px) { }

/* Desktop */
@media (min-width: 1200px) and (max-width: 1599px) { }

/* Medium Desktop */
@media (min-width: 901px) and (max-width: 1199px) { }

/* Tablet */
@media (max-width: 900px) { }

/* Mobile */
@media (max-width: 600px) { }

/* Extra Small Mobile */
@media (max-width: 400px) { }
```

---

## Best Practices

### 1. Component Structure
```html
<div class="component-name">
    <div class="component-header">
        <h3>Title</h3>
    </div>
    <div class="component-body">
        <!-- Content -->
    </div>
    <div class="component-footer">
        <!-- Actions -->
    </div>
</div>
```

### 2. Consistent Spacing
Use the spacing scale: 8px, 16px, 24px, 32px (p-1, p-2, p-3, p-4)

### 3. Elevation Hierarchy
- Cards: `shadow-sm` or `shadow-card`
- Hover states: `shadow-md`
- Modals/overlays: `shadow-lg`

### 4. Color Usage
- Use semantic colors (.text-success, .text-warning, etc.)
- Use accent color sparingly for important actions
- Maintain proper contrast ratios

### 5. Animation
- Keep animations subtle (0.2s - 0.5s duration)
- Use `ease-out` for entrances
- Use `ease-in` for exits
- Add slight delays for staggered animations

---

## Common Patterns

### Card with Hover Effect
```html
<div class="stat-card hover-lift transition">
    <div class="stat-icon">📊</div>
    <div class="stat-info">
        <div class="stat-value">42</div>
        <div class="stat-label">Total</div>
    </div>
</div>
```

### Form Input with Icon
```html
<div class="form-group">
    <label>Search</label>
    <input type="text" placeholder="🔍 Search...">
</div>
```

### Button Group
```html
<div class="flex gap-2">
    <button class="btn btn-primary">Save</button>
    <button class="btn btn-outline">Cancel</button>
</div>
```

### Status Badge
```html
<span class="badge-pill" 
      style="background: var(--success-bg); color: var(--success);">
    Active
</span>
```

---

## Performance Tips

1. **Use CSS transforms** for animations (better performance)
2. **Limit backdrop-filter** usage (can be expensive)
3. **Use will-change** sparingly for animations
4. **Prefer class toggles** over inline styles
5. **Minimize repaints** by batching DOM updates

---

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (with -webkit- prefixes)
- **Edge**: ✅ Full support
- **Mobile browsers**: ✅ Optimized for touch

---

**Last Updated**: February 12, 2026
**CSS Version**: 2.0
