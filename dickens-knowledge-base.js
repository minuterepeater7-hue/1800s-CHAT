// Dickens Knowledge Base for Mr. Boz Character
// This module provides book summaries, themes, and character references

import { analyzeDickensWorks, getRelevantTextChunks, getFullText } from './text-analyzer.js';

// Analyze the actual Dickens text files
const DICKENS_ANALYSIS = analyzeDickensWorks();

const DICKENS_KNOWLEDGE = {
  "A Tale of Two Cities": {
    year: 1859,
    setting: "London and Paris during the French Revolution",
    themes: ["revolution", "sacrifice", "resurrection", "social injustice", "class struggle"],
    keyCharacters: ["Sydney Carton", "Charles Darnay", "Lucie Manette", "Madame Defarge", "Dr. Manette"],
    famousQuotes: [
      "It was the best of times, it was the worst of times",
      "It is a far, far better thing that I do, than I have ever done",
      "Recalled to life"
    ],
    plotSummary: "A story of love, sacrifice, and redemption set against the backdrop of the French Revolution, featuring themes of resurrection and the contrast between London and Paris."
  },
  
  "Great Expectations": {
    year: 1861,
    setting: "Kent and London, early 19th century",
    themes: ["social mobility", "ambition", "class", "identity", "redemption"],
    keyCharacters: ["Pip", "Estella", "Miss Havisham", "Magwitch", "Joe Gargery"],
    famousQuotes: [
      "I was always treated as if I had insisted on being born",
      "Suffering has been stronger than all other teaching",
      "Take nothing on its looks; take everything on evidence"
    ],
    plotSummary: "The coming-of-age story of Pip, an orphan who dreams of becoming a gentleman, exploring themes of social class, ambition, and the true meaning of wealth."
  },
  
  "Oliver Twist": {
    year: 1838,
    setting: "London workhouses and criminal underworld",
    themes: ["poverty", "child labor", "social reform", "innocence", "corruption"],
    keyCharacters: ["Oliver Twist", "Fagin", "Bill Sikes", "Nancy", "Mr. Bumble"],
    famousQuotes: [
      "Please, sir, I want some more",
      "The law is a ass",
      "It is because I think so much of warm and sensitive hearts, that I would spare them from being wounded"
    ],
    plotSummary: "The story of an orphan boy's struggles in Victorian London, exposing the harsh realities of workhouses and the criminal underworld while advocating for social reform."
  }
};

// Function to get relevant book information based on conversation topic
function getRelevantDickensKnowledge(topic) {
  const lowerTopic = topic.toLowerCase();
  const relevantBooks = [];
  
  for (const [bookTitle, bookInfo] of Object.entries(DICKENS_KNOWLEDGE)) {
    // Check if topic matches themes or characters
    const themeMatch = bookInfo.themes.some(theme => lowerTopic.includes(theme));
    const characterMatch = bookInfo.keyCharacters.some(character => 
      lowerTopic.includes(character.toLowerCase())
    );
    
    // Also check analyzed themes and characters from actual text
    const analyzedData = DICKENS_ANALYSIS[bookTitle];
    let analyzedThemeMatch = false;
    let analyzedCharacterMatch = false;
    
    if (analyzedData) {
      analyzedThemeMatch = analyzedData.themes.some(theme => lowerTopic.includes(theme));
      analyzedCharacterMatch = analyzedData.characters.some(character => 
        lowerTopic.includes(character.toLowerCase())
      );
    }
    
    if (themeMatch || characterMatch || analyzedThemeMatch || analyzedCharacterMatch) {
      const enhancedBook = {
        title: bookTitle,
        ...bookInfo
      };
      
      // Add analyzed data if available
      if (analyzedData) {
        enhancedBook.analyzedThemes = analyzedData.themes.slice(0, 5);
        enhancedBook.analyzedCharacters = analyzedData.characters.slice(0, 8);
      }
      
      // Add relevant text chunks from the actual novels
      const relevantChunks = getRelevantTextChunks(bookTitle, topic, 2);
      if (relevantChunks.length > 0) {
        enhancedBook.relevantTextChunks = relevantChunks;
      }
      
      relevantBooks.push(enhancedBook);
    }
  }
  
  return relevantBooks;
}

// Function to get a random quote from a specific book
function getRandomQuote(bookTitle) {
  const book = DICKENS_KNOWLEDGE[bookTitle];
  if (book && book.famousQuotes.length > 0) {
    return book.famousQuotes[Math.floor(Math.random() * book.famousQuotes.length)];
  }
  return null;
}

// Function to get character references for a topic
function getCharacterReferences(topic) {
  const lowerTopic = topic.toLowerCase();
  const references = [];
  
  for (const [bookTitle, bookInfo] of Object.entries(DICKENS_KNOWLEDGE)) {
    const relevantCharacters = bookInfo.keyCharacters.filter(character =>
      lowerTopic.includes(character.toLowerCase()) || 
      bookInfo.themes.some(theme => lowerTopic.includes(theme))
    );
    
    if (relevantCharacters.length > 0) {
      references.push({
        book: bookTitle,
        characters: relevantCharacters
      });
    }
  }
  
  return references;
}

// Function to get full text of a specific book
function getBookFullText(bookTitle) {
  return getFullText(bookTitle);
}

export {
  DICKENS_KNOWLEDGE,
  getRelevantDickensKnowledge,
  getRandomQuote,
  getCharacterReferences,
  getBookFullText
};
