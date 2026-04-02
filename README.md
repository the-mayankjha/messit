# Messit - Premium College Mess Menu 🍱

**Messit** is a high-fidelity, Notion-inspired Progressing Web App (PWA) designed to simplify your college mess experience. Track your meals, get smart reminders, and share menu snapshots with a single tap.

![Messit Interface Banner](src/assets/hero.png)

## ✨ Features

- **📂 Smart Menu Parsing**: Upload your college's `.xlsx` mess menu. Messit automatically extracts and schedules breakfast, lunch, snacks, and dinner for the entire week.
- **📊 Dynamic Dashboard**:
  - **Real-time Status**: Meals are tagged as `Ongoing`, `Upcoming`, or `Done` based on the current time.
  - **Multi-View Navigation**: Seamlessly switch between Day, Week, and Month views.
  - **Compact Mobile Mode**: Optimized date selector for quick navigation on the go.
- **📸 Snapshot Share**: Capture a high-quality "pic" of any meal card. Share visually stunning menu snapshots directly to WhatsApp, Telegram, and Discord.
- **🔔 Personalized Notifications**:
  - **Stud Mode**: "Yo Bro, Fuel Up! Grab your protein..."
  - **Princess Mode**: "Your Meal Awaits, Princess. Time for a delicious..."
- **🎨 Premium Aesthetics**:
  - **Notion-Inspired UI**: Clean, minimal, and glassmorphic design.
  - **High-Fidelity Animations**: Interactive, custom-coded icons (Bell, Settings, Dashboard, Send) with smooth state transitions.
  - **Customizable Themes**: Light/Dark mode and a variety of elegant accent colors.
- **📱 Native-App Feel**: Fully configured PWA. Install it on your iOS or Android device for a standalone, app-like experience.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Animation**: [Motion (Framer Motion)](https://motion.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **PWA Capabilities**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Utilities**: `html-to-image` (for snapshots), `date-fns` (time tracking), `xlsx` (excel parsing)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / pnpm / yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/the-mayankjha/messit.git
   cd messit
   ```

2. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📦 Project Structure

- `src/components/ui/icons`: Custom, high-fidelity animated icons.
- `src/pages/Dashboard`: The main schedule and sharing engine.
- `src/utils/excelParser`: Core logic for extracting meal data from Excel files.
- `src/utils/notifier`: Smart notification dispatcher.
- `src/store`: Unified state management with Zustand persistence.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by [Mayank Jha](https://github.com/the-mayankjha)
