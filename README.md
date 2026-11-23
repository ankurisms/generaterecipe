# Generaterecipe

Proceed with the Recipe app, starting with video URL input and structured recipe extraction.

Build a polished, mobile-first web application called **Recipe**.

**Product concept:** Turn Instagram Reels and YouTube recipe videos into structured, easy-to-follow recipes that users can follow while cooking.

### Design direction
- Clean, modern, premium consumer-app aesthetic.
- Warm neutral background, subtle green accent, dark readable typography.
- Food-focused imagery, generous whitespace and minimal visual clutter.
- Mobile-first responsive design, with excellent desktop support.
- Large touch-friendly controls and readable typography for kitchen use.
- Avoid excessive gradients, cards, animations or dashboard-style layouts.

### Build this complete user journey

**1. Welcome screen**
- Headline: "Turn recipe videos into recipes."
- Supporting text: "Paste a cooking video. Get ingredients, instructions and a simple cooking experience."
- Prominent URL input or CTA to paste a link.
- Mention YouTube and Instagram Reels as supported sources.

**2. URL input**
- Single input field for a video URL.
- Primary CTA: "Generate recipe".
- Validate empty and invalid URLs.
- Keep the screen minimal.

**3. Processing screen**
- Show three short progress stages:
  1. Accessing video
  2. Analysing ingredients and instructions
  3. Preparing your recipe
- Use a subtle progress indicator.
- Include a clear error and retry state.

**4. Recipe review screen**
Use realistic mock recipe data.
- Recipe title and optional source thumbnail.
- Servings, preparation time and cooking time.
- Ingredients with quantities.
- Equipment.
- Clear distinction between explicit, visually observed, estimated and unspecified information.
- Do not hide missing quantities or make uncertain details appear definitive.
- Primary CTA: "Prepare ingredients".

**5. Preparation checklist**
- Show consolidated ingredients with checkboxes.
- Allow users to mark ingredients as ready.
- Show preparation progress.
- CTA: "Start cooking".

**6. Cook Mode**
- One cooking instruction per screen.
- Large, highly readable instruction text.
- Step number and progress indicator.
- Previous and Next controls.
- Show a timer only when a duration is available and supported by source evidence.
- Allow marking a step complete.
- Provide a clear way to exit back to recipe overview.
- Optimise for one-handed mobile use.

### Product and interaction constraints
- Keep the experience linear and intuitive.
- No login, accounts, saved recipes, social features, shopping lists, meal planning or nutrition features.
- No unnecessary navigation or dashboard.
- Build all screens and transitions with mock data initially.
- Keep frontend components modular and API-ready.
- Create a clear separation between UI and data/service logic so a backend API can be integrated later.
- Use realistic loading, empty, validation and error states.
- Ensure the app works well on common mobile screen sizes and desktop.

**Primary success criterion:** A user can paste a recipe video, review the extracted recipe, prepare ingredients and follow the cooking instructions without repeatedly returning to the original video.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://generaterecipe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28c3190e-db41-4431-bbe4-49b43d221728).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
