# Clerk Authentication Setup Guide

## 🔐 Setting up Clerk Authentication for ThreatSentry

Follow these steps to configure Clerk authentication in your ThreatSentry application:

### 1. Create a Clerk Account
- Go to [https://clerk.com/](https://clerk.com/)
- Sign up for a free account
- Create a new application

### 2. Get Your API Keys
1. In your Clerk dashboard, go to **API Keys** section
2. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Clerk keys:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

### 4. Start Your Development Server
```bash
npm run dev
```

## ✨ Features Added

### Authentication Components
- **Sign In/Sign Up Buttons**: Integrated into the navigation bar
- **User Profile**: Shows user avatar and welcome message when signed in
- **Protected Routes**: Dashboard is only accessible to authenticated users

### New Routes
- `/` - Public landing page
- `/dashboard` - Protected dashboard for authenticated users

### Dashboard Features
- **Welcome Message**: Personalized greeting with user's name
- **Statistics Cards**: Mock threat monitoring stats
- **Recent Alerts**: Security notifications and threat detection alerts  
- **Quick Actions**: Buttons for common security tasks
- **Protected Models**: Overview of ML models under protection

### Navigation Updates
- **Conditional Rendering**: Shows different buttons based on auth status
- **User Menu**: Avatar dropdown with profile options when signed in
- **Mobile Responsive**: Works seamlessly on mobile devices

## 🚀 How It Works

1. **Public Access**: Landing page is accessible to everyone
2. **Sign Up/In**: Users can create accounts or sign in via modal dialogs
3. **Dashboard Access**: Authenticated users can access the dashboard
4. **Protected Content**: Dashboard shows personalized security monitoring interface
5. **Sign Out**: Users can sign out via the profile dropdown

## 🎨 Styling

All authentication components use your existing design system:
- ThreatSentry brand colors and gradients
- Consistent rounded corners and shadows
- Mobile-responsive design
- Dark theme compatibility

## 🔧 Customization

You can customize the authentication experience by:
- Modifying the Dashboard component for your specific needs
- Adding more protected routes
- Customizing Clerk's appearance to match your brand
- Adding additional user profile fields

## 📱 Testing

1. Visit your application at `http://localhost:5173`
2. Click "Sign In" or "Get Started" in the navigation
3. Create a test account using Clerk's authentication flow
4. Navigate to the dashboard to see the protected content
5. Sign out using the profile dropdown

Your ThreatSentry application now has full authentication functionality! 🎉
