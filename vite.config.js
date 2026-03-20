import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tripmate/',  // ← your exact repo name
})
```

**Step 2 — Create a GitHub Actions file** that auto-builds and deploys for you. On GitHub click **"Add file" → "Create new file"** and name it exactly:
```
.github/workflows/deploy.yml
