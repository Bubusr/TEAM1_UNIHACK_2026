/**
 * MANG NON — Core Content Dictionary (English Edition)
 * Every string and microcopy lives here to uphold the gentle, pressure-free philosophy.
 * ZERO coercive language: no streaks, no penalties, no expiring timers, no XP grind.
 */

export const content = {
  common: {
    appName: 'MANG NON',
    tagline: 'A gentle sanctuary between memory and folklore',
    loreQuote: 'One quiet night in the bamboo grove, you find a small glowing creature waiting to learn about the world — not through lessons or drills, but simply by listening to your days.',
    gentleReminder: 'Take your time. Whenever you are ready, your companion is here.',
    back: 'Back',
    close: 'Close',
    confirm: 'Confirm',
    cancel: 'Maybe later',
    save: 'Keep',
    loading: 'Listening quietly...',
  },

  navigation: {
    forest: 'Bamboo Grove',
    village: 'Village Tree',
    memory: 'Stream of Memories',
  },

  s01_nightForest: {
    hintTitle: 'A gentle amber glow stirs among the bamboo.',
    hintTap: 'Touch the glowing bamboo stalk.',
  },

  s02_openBamboo: {
    title: 'The bamboo stalk cracks open...',
    subtitle: 'Warm golden light spills across the quiet forest',
    skip: 'Skip',
  },

  s03_createFigure: {
    heading: 'What does your companion look like? Show me.',
    tabDraw: 'Draw',
    tabPhoto: 'Camera',
    tabUpload: 'Upload',
    tabSamples: 'Use a sketch',
    previewLiving: 'Breathing softly in the bamboo grove',
    btnRetry: 'Try another sketch',
    btnConfirm: 'This is my friend',
    cameraDenied: 'Camera could not open. Feel free to choose an image from your device.',
    segmentSlow: 'Trimming the background takes a moment. Would you like to keep the gentle frame?',
  },

  s04_namingPersonality: {
    heading: 'What would you like to call your friend?',
    placeholderName: 'Mang',
    personalityTitle: 'Personality',
    personalities: {
      tomo: {
        name: 'Curious',
        desc: 'Wide-eyed, constantly wondering about the world',
        sample: 'Did you just discover something new? Tell me more! What did it look like?',
      },
      diemtinh: {
        name: 'Tranquil',
        desc: 'Quiet, listens with patience and deep presence',
        sample: '...Ah. So that is what you learned today. I will hold that in my heart.',
      },
      haohung: {
        name: 'Playful',
        desc: 'Cheerful, loves gentle guessing games and quiet smiles',
        sample: 'Oh wonderful!! Let me guess — does that connect to what you did yesterday?',
      },
      nhutnhat: {
        name: 'Shy',
        desc: 'Gentle, pauses softly, blossoms as you speak',
        sample: '...You came back. I... I was thinking about what you shared earlier.',
      },
    },
    btnMeet: 'Meet your companion',
  },

  s05_firstMeeting: {
    turn2_askJourney: 'What would you like to explore or grow with?',
    turn2_placeholder: 'Reading, sketching, coding, learning a language...',
    turn2_chips: ['Learn something new', 'Nurture a quiet habit', 'Navigate a hard season', 'Still exploring'],
    turn3_askDuration: 'Take as many days as you need. There is no rush at all.',
    turn3_chips: ['7 days', '14 days', '30 days', 'I will tell you when I finish'],
    btnStart: 'Let us begin',
  },

  s06_homeForest: {
    actionTell: 'Share a story with Mang Non',
    idleSpeech: ['Watching the bamboo leaves drift...', 'The evening breeze feels gentle.', 'Welcome back, friend.'],
    emptyNight: 'The grove is quiet. A glowing bamboo stalk is waiting for you.',
    emptyDay: 'Bamboo stalks glow warmest under the night sky. But if you are ready, we can open one now.',
    btnOpenNow: 'Open stalk',
    welcomeBackMild: 'Welcome back. I have been here all along.',
    welcomeBackLong: 'It has been a little while. No need to explain anything — just sitting together is enough.',
  },

  s07_chat: {
    inputPlaceholder: 'What would you like to tell your friend today…',
    starterChips: [
      'Today I learned…',
      'Something stayed on my mind…',
      'I noticed something curious today…',
    ],
    leaveMessage: 'Whenever you want to talk again, I will be right here.',
    memorySavedToast: 'I will remember this.',
  },

  s08_memories: {
    title: 'Things Mang Non Remembers',
    empty: 'I am still learning about you. Share a story whenever your heart feels like it.',
    btnPin: 'Cherish forever',
    btnForget: 'Let this fade',
    forgetConfirm: 'If we let this fade, Mang Non will no longer mention it. Are you sure?',
    stages: {
      1: { name: 'Raw Curiosity', poetic: 'Wondering about the first gentle things in this wide world.' },
      2: { name: 'Association', poetic: 'Connecting threads between the stories you have told me.' },
      3: { name: 'Personal Perspective', poetic: 'Developing gentle thoughts and little tastes of my own.' },
      4: { name: 'Deep Companionship', poetic: 'Understanding you deeply, keeping quiet company through thick and thin.' },
      5: { name: 'Boundless Companion', poetic: 'Stepping freely through the bamboo forest, walking hand in hand.' },
    },
  },

  s09_journeySheet: {
    title: 'Current Journey',
    btnEdit: 'Rename',
    btnCloseJourney: 'Conclude journey',
    journeyRestNotice: 'It looks like this journey has reached a quiet resting spot. How do you feel?',
    btnExtend: 'Walk a little further',
  },

  s10_restingRitual: {
    step1Title: 'A journey has come to a peaceful close. I want to say thank you before I rest…',
    step2Title: 'Looking back at our cherished memories',
    step3Title: 'A parting whisper to you',
    step4Title: 'Mang Non transforms into a smooth river stone beneath the clear water',
    step5Contribution: 'Your journey has gifted a shining leaf to the Phu Dong Village Tree.',
    btnReturnForest: 'Return to Grove',
  },

  s11_memoryStream: {
    title: 'Stream of Memories',
    subtitle: 'Water flows softly, yet the stones remain eternal.',
    empty: 'This quiet stream is waiting for its first companion.',
  },

  s12_villageTree: {
    title: 'Phu Dong Village',
    banyanName: 'The Sacred Banyan Tree',
    leavesCountText: 'glowing leaves dancing on the canopy',
    afterBloomText: 'Last night, the Sacred Tree burst into fiery crimson blossoms.',
    btnRewatch: 'Replay blossom',
    newSeasonText: 'A fresh season has gently begun across the village.',
  },

  s13_settings: {
    title: 'Settings',
    rename: 'Rename Mang Non',
    reminder: 'Gentle reminder',
    reducedMotion: 'Reduced motion',
    sound: 'Natural acoustics',
    loreIntro: 'About this world',
    clearData: 'Clear all memory',
    clearDataConfirm1: 'All shared stories and resting companions in the stream will be released. Do you wish to continue?',
    clearDataConfirm2: 'Type your companion’s name to confirm full reset:',
    demoModeToggle: 'Demonstration Panel (3-Minute Tour)',
  },

  s14_demoPanel: {
    title: 'Demo Control Panel (3-Minute Tour)',
    timeLabel: 'Time of Day:',
    seasonLabel: 'Season:',
    stageLabel: 'Cognitive Stage:',
    btnSeedMemories: 'Seed 8 sample memories',
    btnJumpRest: 'Jump to Resting Ritual',
    btnTriggerBloom: 'Trigger Village Tree Blossom',
    btnSimulateOffline: 'Simulate returning after 7 days',
    btnResetAll: 'Reset to new grove (S01)',
  },
};
