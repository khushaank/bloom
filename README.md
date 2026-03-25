
A sophisticated personal finance tracker designed for professionals who value privacy, elegance, and control over their financial data.

## Features

✨ **Real-time Tracking** - Monitor income and expenses across diverse categories
🎯 **Savings Goals** - Set ambitious targets and visualize your progress daily
🔒 **Bank-level Security** - Encrypted data transmission with Row Level Security via Supabase
📊 **Beautiful Analytics** - Intelligent insights in a calm, professional environment
💰 **Budget Management** - Set monthly budgets and track spending patterns
🌍 **Multi-currency Support** - Track finances in any currency
🔐 **Privacy Mode** - 100% local-only tracking with zero cloud sync
📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (optional, for development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/bloom/finance.git
cd bloom-finance
```

2. **Start a local server**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npm run dev
```

3. **Open in browser**
```
http://localhost:8000
```

## Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Build for production
npm run build
```

### Project Structure

```
bloom-finance/
├── index.html                    # Landing page
├── login.html                    # Authentication page
├── finance-tool.html             # Main dashboard
├── privacy-mode-finance.html     # Privacy mode dashboard
├── assets/
│   ├── css/
│   │   ├── style.css            # Main styles
│   │   ├── landing.css          # Landing page styles
│   │   └── login.css            # Login page styles
│   ├── js/
│   │   ├── script.js            # Main app logic
│   │   ├── supabase.js          # Database integration
│   │   ├── security.js          # Security utilities
│   │   ├── landing.js           # Landing page logic
│   │   ├── login.js             # Authentication logic
│   │   └── image-cropper.js     # Image cropping utility
│   └── images/                  # Images and assets
├── .htaccess                     # Apache configuration
├── .eslintrc                     # Linting rules
├── .editorconfig                 # Editor configuration
├── .gitignore                    # Git ignore rules
├── package.json                  # NPM configuration
└── README.md                     # This file
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + Auth)
- **Security**: SSL/TLS, CSP, Row Level Security
- **Charts**: Chart.js for data visualization
- **Hosting**: HTTPS-secured infrastructure

## Security Features

🔐 **End-to-End Encryption** - Your financial data is encrypted in transit
🔒 **Row Level Security (RLS)** - Database-level access control
🛡️ **Content Security Policy** - Prevents injection attacks
⚠️ **OWASP Top 10 Compliant** - Built with security best practices
🚫 **No Trackers** - Zero analytics or tracking cookies

## Privacy

Bloom is committed to your privacy:

- ✅ No third-party trackers
- ✅ No ad networks
- ✅ No data selling
- ✅ Open privacy policy
- ✅ GDPR compliant
- ✅ Privacy Mode for local-only data storage

See [Privacy Policy](privacy.html) for details.

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Safari  | ✅ Latest 2 versions |
| Edge    | ✅ Latest 2 versions |
| IE 11   | ❌ Not supported |

## Performance

- ⚡ **Fast Loading**: Optimized for Core Web Vitals
- 📊 **Responsive**: Adapts to all screen sizes
- 🎯 **Efficient**: Minimal JavaScript bundles
- 💾 **Caching**: Browser caching for faster repeat visits

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the ESLint rules (run `npm run lint`)
- Use Prettier for code formatting
- Write semantic HTML
- Test on multiple browsers
- Ensure accessibility (WCAG 2.1 Level AA)

## Troubleshooting

### Dashboard won't load
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)
- Ensure Supabase is configured correctly

### Transactions not saving
- Check internet connection
- Verify Supabase credentials
- Check browser's local storage permissions

### Images won't upload
- Ensure file size is under 5MB
- Supported formats: JPG, PNG, WebP, GIF
- Check browser's file input permissions

## API Reference

### Local Storage Keys

```javascript
// Theme setting
localStorage.getItem('bloom_theme')  // 'light' | 'dark' | 'system'

// Privacy mode flag
localStorage.getItem('bloom_privacy_mode')  // 'true' | 'false'

// User data (locally in privacy mode)
localStorage.getItem('bloom_transactions')
localStorage.getItem('bloom_goals')
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- 📧 Email: support@bloom.finance
- 🐛 Report bugs: [GitHub Issues](https://github.com/bloom/finance/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/bloom/finance/discussions)

## Changelog

### v1.0.0 (March 2026)
- Initial release
- Dashboard with expense tracking
- Savings goals management
- Budget tracking
- Privacy mode
- Security features

## Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] AI-powered insights
- [ ] Investment tracking
- [ ] Tax reporting
- [ ] Multi-user accounts
- [ ] Advanced analytics

## Credits

Developed with ❤️ by the Bloom Team  
Special thanks to Supabase for the amazing backend platform

---

**Made with elegance. Built with security. For your financial future.** 💚
