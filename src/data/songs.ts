export interface LyricLine {
  time: number; // timestamp in seconds
  text: string; // line of lyrics
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  lyrics: LyricLine[];
}

export const songs: Song[] = [
  {
    id: "bohemian-rhapsody",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    audioUrl: "/audio/bohemian-rhapsody.mp3",
    lyrics: [
      { time: 0, text: "is this the real life?" },
      { time: 3.5, text: "is this just fantasy?" },
      { time: 7, text: "Caught in a landslide" },
      { time: 10.5, text: "No escape from reality" },
      { time: 14, text: "Open your eyes" },
      { time: 17.5, text: "Look up to the skies and see" },
      { time: 21, text: "i'm just a poor boy, i need no sympathy" },
      { time: 28, text: "Because i'm easy come, easy go" },
      { time: 31.5, text: "Little high, little low" },
      { time: 35, text: "Any way the wind blows doesn't really matter to me" },
      { time: 42, text: "To me" }
    ]
  },
  {
    id: "imagine",
    title: "imagine",
    artist: "John Lennon",
    audioUrl: "/audio/imagine.mp3",
    lyrics: [
      { time: 0, text: "imagine there's no heaven" },
      { time: 5, text: "it's easy if you try" },
      { time: 10, text: "No hell below us" },
      { time: 15, text: "Above us only sky" },
      { time: 20, text: "imagine all the people" },
      { time: 25, text: "Living for today" },
      { time: 30, text: "Ah" }
    ]
  },
  {
    id: "am-i-dreaming",
    title: "Am i Dreaming",
    artist: "Metro Boomin ft. A$AP Rocky & Roisee",
    audioUrl: "/audio/am-i-dreaming.mp3",
    lyrics: [
      { time: 14.5, text: "Not done fighting i dont feel ive lost" },
      { time: 18.2, text: "Am i dreamin is there more like us" },
      { time: 21.8, text: "Got me feeling like its all too much" },
      { time: 25.4, text: "i feel beaten but i cant give up" },
      { time: 29.0, text: "im still fighting i dont feel ive lost" },
      { time: 32.6, text: "Am i dreamin is there more like us" },
      { time: 36.2, text: "Got me feelin like its all too much" },
      { time: 39.8, text: "i feel beaten but i cant give up" },
      { time: 43.4, text: "Uh wakin up feelin like the thankful one" },
      { time: 47.0, text: "Count up my ones lacin up my favorite ones" },
      { time: 50.6, text: "One of a kind one of one the only one" },
      { time: 54.2, text: "Got one shot and one chance to take it once" },
      { time: 57.8, text: "Kiss my mama on the forehead fore i get the code red" },
      { time: 61.4, text: "Cause i was born bred to go in toast red" },
      { time: 65.0, text: "And swing by four ten beef patty cornbread" },
      { time: 68.6, text: "in the concrete jungle where my home is" },
      { time: 72.2, text: "All get focused all range of toast is" },
      { time: 75.8, text: "For nickname its the king that do the mostest" },
      { time: 79.4, text: "i was livin down bad in my folks crib" },
      { time: 83.0, text: "Now im laughin to the bank and the joke is" },
      { time: 86.6, text: "They want things them folks did or folks get" },
      { time: 90.2, text: "Weve been gettin this fly since some poor kids" },
      { time: 93.8, text: "My rich friends and my broke friends co exist" },
      { time: 97.4, text: "They love to mix em we know what it is" },
      { time: 101.0, text: "Not done fightin i dont fear ive lost" },
      { time: 104.6, text: "Am i dreamin is there more like us" },
      { time: 108.2, text: "Got me feeling like its all too much" },
      { time: 111.8, text: "i feel beaten but i cant give up" },
      { time: 115.4, text: "im still fighting i dont fear ive lost" },
      { time: 119.0, text: "Am i dreamin is there more like us" },
      { time: 122.6, text: "Got me feelin like its all too much" },
      { time: 126.2, text: "i feel beaten but i cant give up" },
      { time: 129.8, text: "i cant find it in myself to just walk away" },
      { time: 133.4, text: "i cant find it in myself to lose everything" },
      { time: 137.0, text: "Feel everyones against me dont want me to be great" },
      { time: 140.6, text: "Things might look bad not afraid to look death in the face" },
      { time: 144.2, text: "im good now now now whos really bad" },
      { time: 147.8, text: "i choose me now now now whats wrong with that" },
      { time: 151.4, text: "Wish you could see me" },
      { time: 155.0, text: "Now now hmm who had my back baby" },
      { time: 158.6, text: "You dont know no love always will win" },
      { time: 162.2, text: "Not done fightin i dont fear ive lost" },
      { time: 165.8, text: "Am i dreamin is there more like us" },
      { time: 169.4, text: "Got me feeling like its all too much" },
      { time: 173.0, text: "i feel beaten but i cant give up" },
      { time: 176.6, text: "im still fighting i dont fear ive lost" },
      { time: 180.2, text: "Am i dreamin is there more like us" },
      { time: 183.8, text: "Got me feelin like its all too much" },
      { time: 187.4, text: "i feel beaten but i cant give up" },
      { time: 191.0, text: "Cant give up" },
      { time: 194.6, text: "Cant give cant give up" },
      { time: 198.2, text: "Cant give cant give up" },
      { time: 201.8, text: "Cant give cant give up" },
      { time: 205.4, text: "Cant give up" }
    ]
  }
]; 