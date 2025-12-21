// Animation configuration for the entire app
export const ANIMATION_CONFIG = {
  // Global animation settings
  global: {
    type: 'fade' as const,
    duration: 300,
    useSpring: false,
    springConfig: {
      damping: 20,
      stiffness: 100,
    },
  },

  // Tab-specific animations
  tabs: {
    type: 'fade' as const,
    duration: 250,
    useSpring: false,
  },

  // Stack navigation animations
  stack: {
    slideFromRight: {
      animation: 'slide_from_right' as const,
      duration: 300,
    },
    slideFromLeft: {
      animation: 'slide_from_left' as const,
      duration: 300,
    },
    fade: {
      animation: 'fade' as const,
      duration: 250,
    },
    modal: {
      animation: 'slide_from_bottom' as const,
      duration: 350,
    },
  },

  // Modal animations
  modal: {
    type: 'slideUp' as const,
    duration: 350,
    useSpring: true,
    springConfig: {
      damping: 25,
      stiffness: 120,
    },
  },

  // Page transition animations for different screen types
  screens: {
    home: {
      type: 'fade' as const,
      duration: 300,
    },
    list: {
      type: 'slideUp' as const,
      duration: 250,
    },
    detail: {
      type: 'slideInRight' as const,
      duration: 300,
    },
    profile: {
      type: 'scale' as const,
      duration: 250,
      useSpring: true,
    },
  },

  // Component-level animations
  components: {
    card: {
      pressScale: 0.95,
      duration: 150,
    },
    button: {
      pressScale: 0.98,
      duration: 100,
    },
    fadeIn: {
      delay: 100, // Stagger animations
      duration: 300,
    },
  },
} as const;

// Preset animation configs for common use cases
export const ANIMATION_PRESETS = {
  smooth: {
    type: 'fade' as const,
    duration: 300,
    useSpring: false,
  },
  bouncy: {
    type: 'scale' as const,
    duration: 400,
    useSpring: true,
    springConfig: { damping: 15, stiffness: 100 },
  },
  quick: {
    type: 'fade' as const,
    duration: 200,
    useSpring: false,
  },
  elegant: {
    type: 'slideUp' as const,
    duration: 350,
    useSpring: true,
    springConfig: { damping: 25, stiffness: 120 },
  },
} as const;
