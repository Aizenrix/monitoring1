import { defineConfig } from 'vite'

export default defineConfig({
  base: '/monitoring1/',
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // React Router also supports server components. Its client directive is redundant in this static build.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE'
          && warning.id?.includes('/react-router/')
          && warning.message.includes('"use client"')) return
        warn(warning)
      },
    },
  },
})
