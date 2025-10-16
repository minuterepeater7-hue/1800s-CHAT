// Text Analyzer for Dickens Novels
// Provides full text access and analysis for Mr. Boz character

import fs from 'fs';
import path from 'path';

const DICKENS_FILES = {
  "A Tale of Two Cities": "/Users/dylan/Downloads/A Tale of Two Cities by Charles Dickens.txt",
  "Great Expectations": "/Users/dylan/Downloads/Great Expectations by Charles Dickens.txt", 
  "Oliver Twist": "/Users/dylan/Downloads/Oliver Twist by Charles Dickens.txt"
};

// Function to get full text content of a book
function getFullText(bookTitle) {
  const filePath = DICKENS_FILES[bookTitle];
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove Project Gutenberg headers and footers
    const cleanContent = content
      .replace(/^.*?\*\*\* START OF THE PROJECT GUTENBERG EBOOK.*?\*\*\*\s*/s, '')
      .replace(/\*\*\* END OF THE PROJECT GUTENBERG EBOOK.*$/s, '')
      .replace(/^.*?CONTENTS.*?\n\n/s, '') // Remove table of contents
      .trim();
    
    return cleanContent;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Function to get relevant text chunks based on topic
function getRelevantTextChunks(bookTitle, topic, maxChunks = 3) {
  const fullText = getFullText(bookTitle);
  if (!fullText) return [];
  
  const lowerTopic = topic.toLowerCase();
  const chunks = [];
  
  // Split text into paragraphs
  const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  
  // Score paragraphs based on topic relevance
  const scoredParagraphs = paragraphs.map(paragraph => {
    const lowerParagraph = paragraph.toLowerCase();
    let score = 0;
    
    // Check for topic keywords
    const topicWords = lowerTopic.split(/\s+/);
    topicWords.forEach(word => {
      if (word.length > 2) {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        const matches = lowerParagraph.match(regex);
        if (matches) score += matches.length;
      }
    });
    
    // Check for Dickens-specific themes
    const themeKeywords = ['poverty', 'poor', 'justice', 'injustice', 'social', 'class', 'workhouse', 'child', 'character', 'story'];
    themeKeywords.forEach(keyword => {
      if (lowerParagraph.includes(keyword)) score += 1;
    });
    
    return { paragraph, score };
  });
  
  // Sort by score and return top chunks
  return scoredParagraphs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(item => item.paragraph);
}

// Function to extract key quotes from a text file
function extractKeyQuotes(filePath, maxQuotes = 10) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for famous quotes and memorable lines
    const quotePatterns = [
      /"[^"]{20,100}"/g,  // Quoted text
      /It was the best of times[^.]*\./g,  // Famous opening
      /Please, sir, I want some more/g,  // Oliver Twist
      /It is a far, far better thing[^.]*\./g,  // A Tale of Two Cities
      /Suffering has been stronger[^.]*\./g,  // Great Expectations
    ];
    
    const quotes = [];
    for (const pattern of quotePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        quotes.push(...matches.slice(0, 3)); // Take first 3 matches per pattern
      }
    }
    
    // Remove duplicates and limit
    return [...new Set(quotes)].slice(0, maxQuotes);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Function to extract character names from text
function extractCharacterNames(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Common character name patterns
    const namePatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,  // First Last names
      /\bMr\. [A-Z][a-z]+\b/g,  // Mr. Surname
      /\bMiss [A-Z][a-z]+\b/g,  // Miss Surname
      /\bMrs\. [A-Z][a-z]+\b/g,  // Mrs. Surname
    ];
    
    const names = [];
    for (const pattern of namePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        names.push(...matches);
      }
    }
    
    // Count frequency and return most common
    const nameCount = {};
    names.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    return Object.entries(nameCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([name]) => name);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Function to extract themes based on keyword frequency
function extractThemes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    
    const themeKeywords = {
      'poverty': ['poor', 'poverty', 'destitute', 'beggar', 'hunger', 'want'],
      'social class': ['gentleman', 'lady', 'common', 'noble', 'rank', 'station'],
      'justice': ['justice', 'law', 'court', 'trial', 'guilty', 'innocent'],
      'love': ['love', 'beloved', 'heart', 'affection', 'devotion'],
      'sacrifice': ['sacrifice', 'give up', 'surrender', 'devote'],
      'redemption': ['redemption', 'redeem', 'forgive', 'repent'],
      'revolution': ['revolution', 'revolt', 'rebel', 'uprising'],
      'childhood': ['child', 'boy', 'girl', 'youth', 'young', 'innocent'],
      'crime': ['crime', 'criminal', 'thief', 'steal', 'murder'],
      'workhouse': ['workhouse', 'poorhouse', 'charity', 'alms']
    };
    
    const themeScores = {};
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) score += matches.length;
      });
      if (score > 0) themeScores[theme] = score;
    }
    
    return Object.entries(themeScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([theme]) => theme);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Main function to analyze all Dickens files
function analyzeDickensWorks() {
  const analysis = {};
  
  for (const [title, filePath] of Object.entries(DICKENS_FILES)) {
    if (fs.existsSync(filePath)) {
      analysis[title] = {
        quotes: extractKeyQuotes(filePath),
        characters: extractCharacterNames(filePath),
        themes: extractThemes(filePath)
      };
    }
  }
  
  return analysis;
}

export { 
  analyzeDickensWorks, 
  extractKeyQuotes, 
  extractCharacterNames, 
  extractThemes,
  getFullText,
  getRelevantTextChunks
};
