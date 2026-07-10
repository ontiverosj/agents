# Remotion Video Project

Programmatic video generation with [Remotion](https://remotion.dev).

## Structure

```
remotion/
├── src/
│   ├── index.ts            # Entry point — registers the root component
│   ├── Root.tsx            # Declares all <Composition>s
│   ├── compositions/       # Top-level videos (registered in Root.tsx)
│   ├── components/         # Reusable visual building blocks
│   ├── transitions/        # Enter/exit transition wrappers
│   ├── templates/          # Layout/canvas wrappers shared across compositions
│   ├── audio/              # Audio playback components
│   └── types/              # Shared types and video constants (fps, dimensions)
├── public/                 # Static assets (referenced via staticFile())
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Commands

Run from this directory (`remotion/`):

```sh
npm install
npm run dev                       # Open Remotion Studio
npm run typecheck                 # TypeScript check
npx remotion render Main out/main.mp4   # Render the Main composition
```

## Adding a composition

1. Create the component in `src/compositions/`.
2. Register it in `src/Root.tsx` with a `<Composition>` tag.
3. Put any props types in `src/types/` and static assets in `public/`.
