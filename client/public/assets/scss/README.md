# Styling Architecture Documentation

## File Structure

### `/src/styles.scss` (Main Styles)
**Purpose**: Contains Angular Material theme definitions and global imports
**Contents**:
- Angular Material core imports
- Theme palette definitions (blue, green, purple, orange, red, teal, indigo, pink)
- Angular Material theme classes (`.theme-*`)
- Global HTML/body styles
- Import statements for other style files

### `/src/assets/scss/themes.scss` (Theme-specific Styles)
**Purpose**: Contains custom styling that varies between light and dark themes
**Contents**:
- `.lightMode` styles with theme-specific card colors
- `.darkMode` styles with theme-specific card colors
- Highcharts theme customizations
- Calendar styling
- Transaction-specific colors
- Link and interaction states

### `/src/assets/scss/global.scss` (Global Utilities)
**Purpose**: Global utility classes and component overrides
**Contents**:
- Material component spacing/layout overrides
- Utility classes for common styling patterns

### `/src/assets/scss/_CustomVariable.scss` (Variables)
**Purpose**: SCSS variables for colors, spacing, etc.
**Contents**:
- Color definitions ($charcoal, $softgray, $white, etc.)
- Reusable spacing/sizing variables

## How Theming Works

### Theme Selection Flow
1. User selects theme in Settings component
2. `applyTheme()` method adds theme class to body (e.g., `theme-blue`)
3. Light/Dark mode toggle adds `.lightMode` or `.darkMode` to body
4. Final body classes: `lightMode theme-blue` or `darkMode theme-green`

### CSS Cascade
1. **Angular Material**: Handles buttons, forms, navigation components
2. **Theme-specific**: Custom colors for cards, charts, calendars
3. **Global**: Utility classes and component overrides

### Theme Color Scheme
- **Light Mode**: Subtle, light tinted backgrounds for each theme
- **Dark Mode**: Deep, rich backgrounds for each theme
- **8 Theme Options**: Blue, Green, Purple, Orange, Red, Teal, Indigo, Pink

## Maintenance Guidelines

### Adding New Themes
1. Add palette definition in `styles.scss`
2. Add theme class in `styles.scss`
3. Add light/dark color variants in `themes.scss`
4. Update theme selection array in settings component

### Modifying Existing Themes
- **Material components**: Edit `styles.scss`
- **Custom components**: Edit `themes.scss`
- **Global utilities**: Edit `global.scss`

### Best Practices
- Keep Angular Material definitions separate from custom styles
- Use theme-aware CSS for components that need different light/dark variants
- Avoid `!important` unless necessary for overriding third-party styles
- Test all theme combinations (8 themes × 2 modes = 16 combinations)
